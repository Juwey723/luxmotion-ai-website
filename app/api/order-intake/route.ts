import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { buildShopifyCheckoutUrl, isTierSlug } from "@/lib/tiers";
import type { IntakeRecord } from "@/lib/order-types";

// Pre-checkout intake. Customer fills a form on /order/[tier], we save the
// payload to KV under `intake:<id>`, and return the Shopify cart permalink
// with `attributes[intake_id]=<id>` baked in. After Shopify processes
// payment, /api/order-paid recovers our record via the cart attribute.
export const runtime = "nodejs";

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: NextRequest) {
  let body: {
    tier?: unknown;
    productUrl?: unknown;
    brandName?: unknown;
    prompt?: unknown;
    socialHandles?: unknown;
    name?: unknown;
    email?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const tier = String(body.tier ?? "").trim();
  if (!isTierSlug(tier)) {
    return NextResponse.json({ error: "Unknown tier." }, { status: 400 });
  }

  const productUrl = String(body.productUrl ?? "").trim();
  const brandName = String(body.brandName ?? "").trim();
  const promptRaw = body.prompt == null ? "" : String(body.prompt).trim();
  const socialHandlesRaw =
    body.socialHandles == null ? "" : String(body.socialHandles).trim();
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();

  // URL — http/https only
  try {
    const u = new URL(productUrl);
    if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error();
  } catch {
    return NextResponse.json(
      { error: "Please enter a valid URL (must start with http:// or https://)." },
      { status: 400 },
    );
  }

  if (brandName.length < 1 || brandName.length > 80) {
    return NextResponse.json(
      { error: "Please enter a brand name (max 80 characters)." },
      { status: 400 },
    );
  }
  if (name.length < 2 || name.length > 80) {
    return NextResponse.json(
      { error: "Please enter your name (at least 2 characters)." },
      { status: 400 },
    );
  }
  if (!EMAIL_RX.test(email) || email.length > 254) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }
  if (promptRaw.length > 1000) {
    return NextResponse.json(
      { error: "Style notes are too long (max 1000 characters)." },
      { status: 400 },
    );
  }
  if (socialHandlesRaw.length > 200) {
    return NextResponse.json(
      { error: "Social handles are too long (max 200 characters)." },
      { status: 400 },
    );
  }

  const intakeId = randomUUID();
  const ip = clientIp(req);
  const createdAt = new Date().toISOString();

  const record: IntakeRecord = {
    id: intakeId,
    tier,
    productUrl,
    brandName,
    prompt: promptRaw || null,
    socialHandles: socialHandlesRaw || null,
    name,
    email,
    ip,
    createdAt,
    status: "intake",
  };

  try {
    // 30-day TTL — long enough for slow-deciding customers, short enough that
    // abandoned carts age out.
    await kv.set(`intake:${intakeId}`, record, { ex: 60 * 60 * 24 * 30 });
  } catch (e) {
    console.error("[order-intake] KV write failed:", e);
    return NextResponse.json(
      { error: "Couldn't save your order. Try again." },
      { status: 500 },
    );
  }

  const checkoutUrl = buildShopifyCheckoutUrl(tier, intakeId);
  return NextResponse.json({ intakeId, checkoutUrl });
}
