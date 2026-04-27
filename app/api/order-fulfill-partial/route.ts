import { put } from "@vercel/blob";
import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import type { PaidOrderRecord } from "@/lib/order-types";

// Multi-video sibling of /api/order-fulfill. Worker calls this between cycles
// to land an intermediate video on the order's gallery; finalization (status
// flip + email + queue removal) still happens in /api/order-fulfill.
export const runtime = "nodejs";
export const maxDuration = 120;

const UUID_RX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BYTES = 200 * 1024 * 1024;

const TRUSTED_HOSTS: readonly { type: "exact" | "suffix"; value: string }[] = [
  { type: "exact", value: "cdn.higgsfield.ai" },
  { type: "suffix", value: ".cloudfront.net" },
  { type: "suffix", value: ".amazonaws.com" },
  { type: "suffix", value: ".public.blob.vercel-storage.com" },
];

function isTrustedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  for (const t of TRUSTED_HOSTS) {
    if (t.type === "exact" && h === t.value) return true;
    if (t.type === "suffix" && h.endsWith(t.value)) return true;
  }
  return false;
}

function isAlreadyOnBlob(hostname: string): boolean {
  return hostname.toLowerCase().endsWith(".public.blob.vercel-storage.com");
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

  let body: {
    orderId?: unknown;
    videoUrl?: unknown;
    videosCompleted?: unknown;
    videosNeeded?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const orderId = String(body.orderId ?? "").trim();
  const videoUrl = String(body.videoUrl ?? "").trim();
  const videosCompleted = Number(body.videosCompleted);
  const videosNeeded = Number(body.videosNeeded);

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
  if (
    !Number.isInteger(videosCompleted) ||
    videosCompleted < 1 ||
    videosCompleted > 100
  ) {
    return NextResponse.json(
      { error: "videosCompleted must be an integer 1..100." },
      { status: 400 },
    );
  }
  if (
    !Number.isInteger(videosNeeded) ||
    videosNeeded < 1 ||
    videosNeeded > 100
  ) {
    return NextResponse.json(
      { error: "videosNeeded must be an integer 1..100." },
      { status: 400 },
    );
  }
  if (videosCompleted > videosNeeded) {
    return NextResponse.json(
      { error: "videosCompleted cannot exceed videosNeeded." },
      { status: 400 },
    );
  }

  const orderKey = `paid-order:${orderId}`;
  const order = await kv.get<PaidOrderRecord>(orderKey);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

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

  let blobUrl: string;
  let fileSizeMb: number | undefined;

  if (isAlreadyOnBlob(parsed.hostname)) {
    // Worker already pushed straight to Blob — accept the URL as-is.
    blobUrl = videoUrl;
  } else {
    let upstream: Response;
    try {
      upstream = await fetch(videoUrl, {
        redirect: "follow",
        headers: {
          "User-Agent": "LuxMotion-AI-OrderFulfillPartial/1.0",
          Accept: "video/mp4,video/*;q=0.9,*/*;q=0.5",
        },
      });
    } catch (e) {
      console.error("[order-fulfill-partial] upstream fetch threw:", e);
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
      console.error("[order-fulfill-partial] body buffer failed:", e);
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

    try {
      // videosCompleted is the index of THIS video (1-based), so retries with
      // the same value overwrite cleanly via allowOverwrite.
      const uploaded = await put(
        `orders/${orderId}/${videosCompleted}.mp4`,
        blob,
        {
          access: "public",
          contentType: "video/mp4",
          addRandomSuffix: false,
          allowOverwrite: true,
        },
      );
      blobUrl = uploaded.url;
    } catch (e) {
      console.error("[order-fulfill-partial] blob put failed:", e);
      return NextResponse.json(
        { error: "Failed to upload video." },
        { status: 502 },
      );
    }

    fileSizeMb = Math.round((blob.size / (1024 * 1024)) * 100) / 100;
  }

  // Append to gallery, dedup by URL (idempotent for retries).
  const existingGallery = order.gallery ?? [];
  const gallery = existingGallery.includes(blobUrl)
    ? existingGallery
    : [...existingGallery, blobUrl];

  const updated: PaidOrderRecord = {
    ...order,
    gallery,
    videosCompleted,
    videosNeeded,
  };
  if (fileSizeMb != null) {
    // Track cumulative-ish file size; final fulfill overwrites with the last video's size for back-compat.
    updated.fileSizeMb = fileSizeMb;
  }

  await kv.set(orderKey, updated, { ex: 60 * 60 * 24 * 90 });
  // Intentionally do NOT lrem from paid-queue:pending; finalization happens in /api/order-fulfill.

  return NextResponse.json({
    success: true,
    gallery,
    videosCompleted,
    videosNeeded,
  });
}
