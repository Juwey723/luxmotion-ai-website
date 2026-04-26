import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { sendAdminOrderNotification } from "@/lib/emails";
import type { IntakeRecord, PaidOrderRecord } from "@/lib/order-types";
import { isTierSlug } from "@/lib/tiers";

// Shopify `orders/paid` webhook. We:
//   1. Verify the X-Shopify-Hmac-Sha256 header against the raw body bytes.
//   2. Recover our `intake_id` cart attribute from `note_attributes`.
//   3. Look up the intake we saved in /api/order-intake.
//   4. Create a `paid-order:<id>` record + push to `paid-queue:pending`.
//   5. Send an admin notification email; fire-and-forget, doesn't block 200.
//
// Response policy (deviates from "always 200" — see project notes):
//   - HMAC mismatch → 401          (alerts on misconfig / forgery attempts)
//   - HMAC OK + logical no-op → 200 (intake missing/expired, duplicate retry)
//   - HMAC OK + infra failure → 500 (lets Shopify retry transient KV errors)
export const runtime = "nodejs";
export const maxDuration = 15;

interface ShopifyOrderPaid {
  id?: number | string;
  name?: string;
  order_number?: number;
  total_price?: string;
  currency?: string;
  note_attributes?: Array<{ name?: string; value?: string }>;
  attributes?: Array<{ name?: string; value?: string }>;
  customer?: { email?: string; first_name?: string; last_name?: string };
}

function verifyHmac(rawBody: string, signature: string | null): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  let expected: Buffer;
  let provided: Buffer;
  try {
    expected = Buffer.from(
      createHmac("sha256", secret).update(rawBody, "utf8").digest("base64"),
      "base64",
    );
    provided = Buffer.from(signature, "base64");
  } catch {
    return false;
  }
  if (expected.length !== provided.length) return false;
  return timingSafeEqual(expected, provided);
}

function findIntakeId(payload: ShopifyOrderPaid): string | null {
  // `note_attributes` is the canonical field on the Order object after
  // checkout; some payload variants also expose `attributes`. Check both.
  const candidates = [
    ...(payload.note_attributes ?? []),
    ...(payload.attributes ?? []),
  ];
  for (const a of candidates) {
    if (a?.name === "intake_id" && a.value) {
      const v = String(a.value).trim();
      if (v) return v;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  if (!process.env.SHOPIFY_WEBHOOK_SECRET) {
    console.error("[order-paid] SHOPIFY_WEBHOOK_SECRET not configured");
    // 500 so Shopify retries — once we add the env var the retries land.
    return NextResponse.json({ error: "Server not configured." }, { status: 500 });
  }

  // Read raw body BEFORE parsing — HMAC must run on the exact bytes Shopify signed.
  const rawBody = await req.text();
  const signature = req.headers.get("x-shopify-hmac-sha256");

  if (!verifyHmac(rawBody, signature)) {
    console.warn(
      "[order-paid] HMAC mismatch — likely forged, mistargeted, or wrong SHOPIFY_WEBHOOK_SECRET",
    );
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let payload: ShopifyOrderPaid;
  try {
    payload = JSON.parse(rawBody) as ShopifyOrderPaid;
  } catch {
    console.error("[order-paid] valid HMAC but invalid JSON body");
    // Logical no-op — Shopify-signed garbage; no point retrying.
    return NextResponse.json({ ok: true, note: "invalid-json" });
  }

  const shopifyOrderId = String(payload.id ?? "");
  if (!shopifyOrderId) {
    console.warn("[order-paid] payload missing order id");
    return NextResponse.json({ ok: true, note: "no-order-id" });
  }

  const intakeId = findIntakeId(payload);
  if (!intakeId) {
    console.warn(
      `[order-paid] order ${shopifyOrderId} has no intake_id attribute — likely a manual checkout, not from /order/[tier]`,
    );
    return NextResponse.json({ ok: true, note: "no-intake-id" });
  }

  let intake: IntakeRecord | null;
  try {
    intake = await kv.get<IntakeRecord>(`intake:${intakeId}`);
  } catch (e) {
    console.error("[order-paid] KV read failed:", e);
    return NextResponse.json({ error: "KV read failed." }, { status: 500 });
  }
  if (!intake) {
    console.warn(
      `[order-paid] intake ${intakeId} not found — TTL expired or never created`,
    );
    return NextResponse.json({ ok: true, note: "intake-not-found" });
  }
  if (!isTierSlug(intake.tier)) {
    console.error(
      `[order-paid] intake ${intakeId} has unknown tier "${intake.tier}"`,
    );
    return NextResponse.json({ ok: true, note: "bad-tier" });
  }

  // Idempotency — Shopify retries are common; treat duplicates as success.
  const orderKey = `paid-order:${intakeId}`;
  let existing: PaidOrderRecord | null = null;
  try {
    existing = await kv.get<PaidOrderRecord>(orderKey);
  } catch (e) {
    console.error("[order-paid] KV read (idempotency) failed:", e);
    return NextResponse.json({ error: "KV read failed." }, { status: 500 });
  }
  if (existing) {
    console.warn(
      `[order-paid] duplicate webhook for intake ${intakeId} — already at status=${existing.status}`,
    );
    return NextResponse.json({ ok: true, note: "duplicate" });
  }

  const paidAt = new Date().toISOString();
  const order: PaidOrderRecord = {
    id: intakeId,
    intakeId,
    tier: intake.tier,
    productUrl: intake.productUrl,
    brandName: intake.brandName,
    prompt: intake.prompt,
    socialHandles: intake.socialHandles,
    name: intake.name,
    email: intake.email,
    ip: intake.ip,
    shopifyOrderId,
    shopifyOrderName: payload.name,
    shopifyOrderNumber: payload.order_number,
    shopifyAmount: payload.total_price,
    shopifyCurrency: payload.currency,
    paidAt,
    status: "pending",
    createdAt: intake.createdAt,
  };

  try {
    // 90-day TTL on the order record; intake gets marked consumed (housekeeping).
    await kv.set(orderKey, order, { ex: 60 * 60 * 24 * 90 });
    await kv.lpush("paid-queue:pending", intakeId);

    intake.status = "consumed";
    await kv.set(`intake:${intakeId}`, intake, { ex: 60 * 60 * 24 * 30 });
  } catch (e) {
    console.error("[order-paid] KV write failed:", e);
    return NextResponse.json({ error: "KV write failed." }, { status: 500 });
  }

  // Admin notification — fire-and-forget; never block the 200 to Shopify.
  void sendAdminOrderNotification({
    orderId: order.id,
    intakeId: order.intakeId,
    tier: order.tier,
    brandName: order.brandName,
    productUrl: order.productUrl,
    prompt: order.prompt,
    socialHandles: order.socialHandles,
    customerName: order.name,
    customerEmail: order.email,
    ip: order.ip,
    shopifyOrderId: order.shopifyOrderId,
    shopifyOrderName: order.shopifyOrderName,
    shopifyAmount: order.shopifyAmount,
    shopifyCurrency: order.shopifyCurrency,
    paidAt: order.paidAt,
  }).catch((e) => console.warn("[order-paid] admin email failed:", e));

  return NextResponse.json({ ok: true });
}
