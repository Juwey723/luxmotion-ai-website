import { put } from "@vercel/blob";
import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { sendCustomerFulfillment } from "@/lib/emails";
import type { SampleRequestRecord } from "@/lib/sample-types";

// Two ingest modes, picked by Content-Type:
//   1. multipart/form-data  — worker uploads the file directly (≤ 4.5 MB on
//      Hobby due to Vercel's body limit).
//   2. application/json {requestId, videoUrl} — worker hands us a URL on a
//      trusted CDN; we server-side-fetch and stream into Blob, bypassing the
//      body limit entirely.
// Both paths converge on finalizeUpload() to mark fulfilled + send the email.
export const runtime = "nodejs";
export const maxDuration = 120;

const UUID_RX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BYTES = 100 * 1024 * 1024; // 100 MB ceiling for either path

// Hosts the worker is allowed to send us a videoUrl for. Suffix entries must
// begin with "." so `foo.cloudfront.net` matches but `evil-cloudfront.net` does
// not.
const TRUSTED_HOSTS: readonly {
  type: "exact" | "suffix";
  value: string;
}[] = [
  { type: "exact", value: "cdn.higgsfield.ai" },
  { type: "suffix", value: ".cloudfront.net" },
  { type: "suffix", value: ".amazonaws.com" },
];

function isTrustedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  for (const t of TRUSTED_HOSTS) {
    if (t.type === "exact" && h === t.value) return true;
    if (t.type === "suffix" && h.endsWith(t.value)) return true;
  }
  return false;
}

function authorized(req: NextRequest): boolean {
  const expected = process.env.WORKER_SECRET;
  if (!expected) return false;
  const auth = req.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(auth);
  if (!m) return false;
  const provided = m[1];
  if (provided.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  } catch {
    return false;
  }
}

type FetchResult =
  | { ok: true; blob: Blob }
  | { ok: false; status: number; error: string };

async function fetchFromTrustedHost(videoUrl: string): Promise<FetchResult> {
  let parsed: URL;
  try {
    parsed = new URL(videoUrl);
  } catch {
    return { ok: false, status: 400, error: "videoUrl must be a valid URL." };
  }
  if (parsed.protocol !== "https:") {
    return {
      ok: false,
      status: 400,
      error: "videoUrl must use https://",
    };
  }
  if (!isTrustedHost(parsed.hostname)) {
    return {
      ok: false,
      status: 400,
      error: `videoUrl host "${parsed.hostname}" is not in the trusted-host allowlist.`,
    };
  }

  let upstream: Response;
  try {
    upstream = await fetch(videoUrl, {
      redirect: "follow",
      headers: {
        "User-Agent": "LuxMotion-AI-SampleFulfill/1.0",
        Accept: "video/mp4,video/*;q=0.9,*/*;q=0.5",
      },
    });
  } catch (e) {
    console.error("[sample-fulfill] upstream fetch threw:", e);
    return { ok: false, status: 502, error: "Could not fetch videoUrl." };
  }

  if (!upstream.ok) {
    return {
      ok: false,
      status: 502,
      error: `Upstream returned HTTP ${upstream.status}.`,
    };
  }

  // Cheap pre-flight: skip the buffer if Content-Length already says it's too big.
  const cl = Number(upstream.headers.get("content-length") ?? 0);
  if (cl && cl > MAX_BYTES) {
    return {
      ok: false,
      status: 413,
      error: `Upstream file is ${(cl / (1024 * 1024)).toFixed(1)} MB; max is 100 MB.`,
    };
  }

  let blob: Blob;
  try {
    blob = await upstream.blob();
  } catch (e) {
    console.error("[sample-fulfill] upstream body buffer failed:", e);
    return {
      ok: false,
      status: 502,
      error: "Could not buffer upstream body.",
    };
  }

  if (blob.size === 0) {
    return { ok: false, status: 502, error: "Upstream returned empty body." };
  }
  if (blob.size > MAX_BYTES) {
    return {
      ok: false,
      status: 413,
      error: `Upstream file is ${(blob.size / (1024 * 1024)).toFixed(1)} MB; max is 100 MB.`,
    };
  }

  return { ok: true, blob };
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ct = (req.headers.get("content-type") ?? "").toLowerCase();
  const isJson = ct.includes("application/json");
  const isMultipart = ct.includes("multipart/form-data");

  if (isJson) {
    let body: { requestId?: unknown; videoUrl?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const requestId = String(body.requestId ?? "").trim();
    const videoUrl = String(body.videoUrl ?? "").trim();

    if (!UUID_RX.test(requestId)) {
      return NextResponse.json(
        { error: "requestId must be a valid UUID." },
        { status: 400 },
      );
    }
    if (!videoUrl) {
      return NextResponse.json(
        { error: "videoUrl is required when sending JSON." },
        { status: 400 },
      );
    }

    // KV lookup BEFORE we download — don't burn bandwidth on a missing record.
    const recordKey = `sample-request:${requestId}`;
    const record = await kv.get<SampleRequestRecord>(recordKey);
    if (!record) {
      return NextResponse.json(
        { error: "Request not found." },
        { status: 404 },
      );
    }
    if (record.status === "fulfilled") {
      return NextResponse.json(
        { error: "Request already fulfilled.", videoUrl: record.videoUrl },
        { status: 409 },
      );
    }

    const fetched = await fetchFromTrustedHost(videoUrl);
    if (!fetched.ok) {
      return NextResponse.json(
        { error: fetched.error },
        { status: fetched.status },
      );
    }

    return await finalizeUpload(requestId, record, fetched.blob);
  }

  if (isMultipart) {
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        { error: "Invalid multipart/form-data body." },
        { status: 400 },
      );
    }

    const requestId = String(formData.get("requestId") ?? "").trim();
    const fileEntry = formData.get("file");

    if (!UUID_RX.test(requestId)) {
      return NextResponse.json(
        { error: "requestId must be a valid UUID." },
        { status: 400 },
      );
    }
    if (!(fileEntry instanceof File)) {
      return NextResponse.json(
        { error: "file is required." },
        { status: 400 },
      );
    }
    if (fileEntry.type !== "video/mp4") {
      return NextResponse.json(
        { error: "file must be video/mp4." },
        { status: 415 },
      );
    }
    if (fileEntry.size === 0) {
      return NextResponse.json({ error: "file is empty." }, { status: 400 });
    }
    if (fileEntry.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `file exceeds ${MAX_BYTES} bytes.` },
        { status: 413 },
      );
    }

    const recordKey = `sample-request:${requestId}`;
    const record = await kv.get<SampleRequestRecord>(recordKey);
    if (!record) {
      return NextResponse.json(
        { error: "Request not found." },
        { status: 404 },
      );
    }
    if (record.status === "fulfilled") {
      return NextResponse.json(
        { error: "Request already fulfilled.", videoUrl: record.videoUrl },
        { status: 409 },
      );
    }

    return await finalizeUpload(requestId, record, fileEntry);
  }

  return NextResponse.json(
    {
      error:
        "Send either multipart/form-data with a `file` field, or application/json with { requestId, videoUrl }.",
    },
    { status: 415 },
  );
}

async function finalizeUpload(
  requestId: string,
  record: SampleRequestRecord,
  payload: Blob | File,
): Promise<NextResponse> {
  let videoUrl: string;
  try {
    const uploaded = await put(`samples/${requestId}.mp4`, payload, {
      access: "public",
      contentType: "video/mp4",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    videoUrl = uploaded.url;
  } catch (e) {
    console.error("[sample-fulfill] blob put failed:", e);
    return NextResponse.json(
      { error: "Failed to upload video." },
      { status: 502 },
    );
  }

  const fileSizeMb =
    Math.round((payload.size / (1024 * 1024)) * 100) / 100;
  const fulfilledAt = new Date().toISOString();
  const updated: SampleRequestRecord = {
    ...record,
    status: "fulfilled",
    videoUrl,
    fulfilledAt,
    durationSeconds: 5,
    fileSizeMb,
  };

  const recordKey = `sample-request:${requestId}`;
  await kv.set(recordKey, updated, { ex: 60 * 60 * 24 * 60 });
  await kv.lrem("sample-queue:pending", 1, requestId);

  // Fulfillment email is the actual deliverable. If it fails we still mark
  // the record fulfilled — same policy as before; admin record carries the
  // videoUrl for manual recovery.
  const emailSent = await sendCustomerFulfillment({
    to: updated.email,
    name: updated.name,
    videoUrl,
  });

  if (emailSent) {
    updated.fulfillmentEmailSent = true;
    await kv.set(recordKey, updated, { ex: 60 * 60 * 24 * 60 });
  }

  return NextResponse.json({ success: true, videoUrl, emailSent });
}
