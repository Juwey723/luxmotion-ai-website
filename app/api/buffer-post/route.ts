import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createBufferUpdate } from "@/lib/buffer";
import { captionToText, generateCaptionAndHashtags } from "@/lib/captions";
import { TIERS } from "@/lib/tiers";
import type { BufferPostRecord, PaidOrderRecord } from "@/lib/order-types";

// Worker-callable: schedule a paid-order video to post on the customer's
// connected Buffer channels. Falls back gracefully when Buffer isn't wired
// up for a given customer — the worker keeps moving and the customer still
// gets the video by email.
export const runtime = "nodejs";
export const maxDuration = 60;

const UUID_RX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  let body: { orderId?: unknown; videoUrl?: unknown; productName?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const orderId = String(body.orderId ?? "").trim();
  const videoUrl = String(body.videoUrl ?? "").trim();
  const productName =
    body.productName == null
      ? null
      : String(body.productName).trim() || null;

  if (!UUID_RX.test(orderId)) {
    return NextResponse.json(
      { error: "orderId must be a valid UUID." },
      { status: 400 },
    );
  }
  if (!videoUrl || !/^https?:\/\//.test(videoUrl)) {
    return NextResponse.json(
      { error: "videoUrl must be http(s)." },
      { status: 400 },
    );
  }

  // Look up the paid order. 404 here is a real error — the worker is calling
  // us with an ID that should exist.
  const orderKey = `paid-order:${orderId}`;
  const order = await kv.get<PaidOrderRecord>(orderKey);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  // Graceful fallback paths — return 200 so the worker keeps processing the
  // next video. The customer still gets the video via the fulfillment email;
  // we just couldn't auto-post this one.
  const profileIds = order.bufferProfileIds ?? [];
  if (profileIds.length === 0) {
    return NextResponse.json({
      posted: false,
      reason: "buffer_not_configured",
    });
  }
  if (!process.env.BUFFER_ACCESS_TOKEN) {
    console.warn(
      "[buffer-post] BUFFER_ACCESS_TOKEN missing — refusing to call Buffer",
    );
    return NextResponse.json({
      posted: false,
      reason: "buffer_token_missing",
    });
  }

  // Generate caption + hashtags. Falls back to a template on Claude error.
  const tier = TIERS[order.tier];
  const niche =
    (order.industry === "other" && order.industryOther) ||
    order.industry ||
    tier?.shortName ||
    null;

  const caption = await generateCaptionAndHashtags({
    brandName: order.brandName,
    productName,
    niche: niche ? String(niche) : null,
    audienceGoals: order.audienceGoals ?? null,
  });
  const text = captionToText(caption);

  // Schedule via Buffer.
  const result = await createBufferUpdate({
    profileIds,
    text,
    videoUrl,
    postNow: false,
  });

  if (!result.ok) {
    console.error(
      `[buffer-post] order ${orderId} Buffer ${result.status}: ${result.error}`,
    );
    if (result.status === 401 || result.status === 403) {
      return NextResponse.json({
        posted: false,
        reason: "buffer_auth_failed",
        detail: result.error,
      });
    }
    if (result.status >= 400 && result.status < 500) {
      return NextResponse.json({
        posted: false,
        reason: "buffer_bad_request",
        detail: result.error,
      });
    }
    return NextResponse.json({
      posted: false,
      reason: "buffer_error",
      detail: result.error,
    });
  }

  // Append the new posts to the order's history. Buffer can return one update
  // per profile_id we sent, so several rows land at once for a multi-channel
  // customer.
  const nowIso = new Date().toISOString();
  const newPosts: BufferPostRecord[] = result.value.map((u) => ({
    updateId: u.id,
    profileId: u.profile_id,
    scheduledAt: u.scheduled_at
      ? new Date(u.scheduled_at * 1000).toISOString()
      : u.due_at
        ? new Date(u.due_at * 1000).toISOString()
        : nowIso,
    videoUrl,
    caption: text,
    service: u.service,
  }));

  const updated: PaidOrderRecord = {
    ...order,
    bufferPosts: [...(order.bufferPosts ?? []), ...newPosts],
  };
  await kv.set(orderKey, updated, { ex: 60 * 60 * 24 * 90 });

  return NextResponse.json({
    success: true,
    posted: true,
    updatesCreated: newPosts.length,
    updates: newPosts,
  });
}
