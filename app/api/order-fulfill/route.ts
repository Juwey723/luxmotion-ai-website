import { put } from "@vercel/blob";
import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { sendCustomerOrderFulfillment } from "@/lib/emails";
import type { PaidOrderRecord } from "@/lib/order-types";

// Paid analog of /api/sample-fulfill. JSON-only path: worker hands us a URL
// on a trusted CDN; we server-side-fetch, upload to Vercel Blob, mark the
// order fulfilled, and email the customer.
export const runtime = "nodejs";
export const maxDuration = 120;

const UUID_RX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Paid videos are longer than samples, so allow up to 200 MB upstream pulls.
const MAX_BYTES = 200 * 1024 * 1024;

const TRUSTED_HOSTS: readonly { type: "exact" | "suffix"; value: string }[] = [
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

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { orderId?: unknown; videoUrl?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const orderId = String(body.orderId ?? "").trim();
  const videoUrl = String(body.videoUrl ?? "").trim();

  if (!UUID_RX.test(orderId)) {
    return NextResponse.json(
      { error: "orderId must be a valid UUID." },
      { status: 400 },
    );
  }
  if (!videoUrl) {
    return NextResponse.json(
      { error: "videoUrl is required." },
      { status: 400 },
    );
  }

  const orderKey = `paid-order:${orderId}`;
  const order = await kv.get<PaidOrderRecord>(orderKey);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (order.status === "fulfilled") {
    return NextResponse.json(
      { error: "Order already fulfilled.", videoUrl: order.videoUrl },
      { status: 409 },
    );
  }

  // Validate URL up front so we fail fast on bad worker input.
  let parsed: URL;
  try {
    parsed = new URL(videoUrl);
  } catch {
    return NextResponse.json(
      { error: "videoUrl must be a valid URL." },
      { status: 400 },
    );
  }
  if (parsed.protocol !== "https:") {
    return NextResponse.json(
      { error: "videoUrl must use https://" },
      { status: 400 },
    );
  }
  if (!isTrustedHost(parsed.hostname)) {
    return NextResponse.json(
      {
        error: `videoUrl host "${parsed.hostname}" is not in the trusted-host allowlist.`,
      },
      { status: 400 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(videoUrl, {
      redirect: "follow",
      headers: {
        "User-Agent": "LuxMotion-AI-OrderFulfill/1.0",
        Accept: "video/mp4,video/*;q=0.9,*/*;q=0.5",
      },
    });
  } catch (e) {
    console.error("[order-fulfill] upstream fetch threw:", e);
    return NextResponse.json(
      { error: "Could not fetch videoUrl." },
      { status: 502 },
    );
  }
  if (!upstream.ok) {
    return NextResponse.json(
      { error: `Upstream returned HTTP ${upstream.status}.` },
      { status: 502 },
    );
  }

  const cl = Number(upstream.headers.get("content-length") ?? 0);
  if (cl && cl > MAX_BYTES) {
    return NextResponse.json(
      {
        error: `Upstream file is ${(cl / (1024 * 1024)).toFixed(1)} MB; max is 200 MB.`,
      },
      { status: 413 },
    );
  }

  let blob: Blob;
  try {
    blob = await upstream.blob();
  } catch (e) {
    console.error("[order-fulfill] body buffer failed:", e);
    return NextResponse.json(
      { error: "Could not buffer upstream body." },
      { status: 502 },
    );
  }
  if (blob.size === 0) {
    return NextResponse.json(
      { error: "Upstream returned empty body." },
      { status: 502 },
    );
  }
  if (blob.size > MAX_BYTES) {
    return NextResponse.json(
      {
        error: `Upstream file is ${(blob.size / (1024 * 1024)).toFixed(1)} MB; max is 200 MB.`,
      },
      { status: 413 },
    );
  }

  let blobUrl: string;
  try {
    const uploaded = await put(`orders/${orderId}.mp4`, blob, {
      access: "public",
      contentType: "video/mp4",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    blobUrl = uploaded.url;
  } catch (e) {
    console.error("[order-fulfill] blob put failed:", e);
    return NextResponse.json(
      { error: "Failed to upload video." },
      { status: 502 },
    );
  }

  const fileSizeMb = Math.round((blob.size / (1024 * 1024)) * 100) / 100;
  const fulfilledAt = new Date().toISOString();
  const updated: PaidOrderRecord = {
    ...order,
    status: "fulfilled",
    videoUrl: blobUrl,
    fulfilledAt,
    fileSizeMb,
  };

  await kv.set(orderKey, updated, { ex: 60 * 60 * 24 * 90 });
  await kv.lrem("paid-queue:pending", 1, orderId);

  // Fulfillment email — actual deliverable. If it fails we still mark
  // fulfilled (worker has nothing to retry against this endpoint, the admin
  // record carries the videoUrl for manual recovery).
  const emailSent = await sendCustomerOrderFulfillment({
    to: updated.email,
    name: updated.name,
    brandName: updated.brandName,
    tier: updated.tier,
    videoUrl: blobUrl,
  });

  if (emailSent) {
    updated.fulfillmentEmailSent = true;
    await kv.set(orderKey, updated, { ex: 60 * 60 * 24 * 90 });
  }

  return NextResponse.json({ success: true, videoUrl: blobUrl, emailSent });
}
