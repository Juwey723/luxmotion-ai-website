import { kv } from "@vercel/kv";
import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { sendCustomerFulfillment } from "@/lib/emails";
import type { SampleRequestRecord } from "@/lib/sample-types";

export const runtime = "nodejs";
export const maxDuration = 60;

const UUID_RX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

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

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }
  if (record.status === "fulfilled") {
    return NextResponse.json(
      { error: "Request already fulfilled.", videoUrl: record.videoUrl },
      { status: 409 },
    );
  }

  let videoUrl: string;
  try {
    const uploaded = await put(`samples/${requestId}.mp4`, fileEntry, {
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
    Math.round((fileEntry.size / (1024 * 1024)) * 100) / 100;
  const fulfilledAt = new Date().toISOString();
  const updated: SampleRequestRecord = {
    ...record,
    status: "fulfilled",
    videoUrl,
    fulfilledAt,
    durationSeconds: 5,
    fileSizeMb,
  };

  await kv.set(recordKey, updated, { ex: 60 * 60 * 24 * 60 });
  await kv.lrem("sample-queue:pending", 1, requestId);

  // Fulfillment email is the actual deliverable. If it fails we still mark
  // the record fulfilled — same policy as /api/sample-deliver.
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
