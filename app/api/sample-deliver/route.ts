import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { sendCustomerFulfillment } from "@/lib/emails";
import type { SampleRequestRecord } from "@/lib/sample-types";

export const runtime = "nodejs";
export const maxDuration = 30;

const BLOB_HOST_RX = /\.blob\.vercel-storage\.com$/i;

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

  let body: {
    requestId?: unknown;
    videoUrl?: unknown;
    durationSeconds?: unknown;
    fileSizeMb?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const requestId = String(body.requestId ?? "").trim();
  const videoUrl = String(body.videoUrl ?? "").trim();
  const durationSeconds = Number(body.durationSeconds);
  const fileSizeMb = Number(body.fileSizeMb);

  if (!requestId || !videoUrl) {
    return NextResponse.json(
      { error: "requestId and videoUrl are required." },
      { status: 400 },
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(videoUrl);
  } catch {
    return NextResponse.json({ error: "videoUrl must be a valid URL." }, { status: 400 });
  }
  if (parsed.protocol !== "https:" || !BLOB_HOST_RX.test(parsed.host)) {
    return NextResponse.json(
      { error: "videoUrl must be hosted on Vercel Blob (*.blob.vercel-storage.com)." },
      { status: 400 },
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

  const fulfilledAt = new Date().toISOString();
  const updated: SampleRequestRecord = {
    ...record,
    status: "fulfilled",
    videoUrl,
    fulfilledAt,
    durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : undefined,
    fileSizeMb: Number.isFinite(fileSizeMb) ? fileSizeMb : undefined,
  };

  await kv.set(recordKey, updated, { ex: 60 * 60 * 24 * 60 });
  await kv.lrem("sample-queue:pending", 1, requestId);

  // Fulfillment email is the actual deliverable. If it fails we still mark the
  // record fulfilled (the worker has nothing to retry against this endpoint).
  // Logged + flagged on the record so admin email gives visibility.
  const emailSent = await sendCustomerFulfillment({
    to: updated.email,
    name: updated.name,
    videoUrl,
  });

  if (emailSent) {
    updated.fulfillmentEmailSent = true;
    await kv.set(recordKey, updated, { ex: 60 * 60 * 24 * 60 });
  }

  return NextResponse.json({ success: true, emailSent });
}
