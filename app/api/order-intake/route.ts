import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { buildShopifyCheckoutUrl, isTierSlug, type TierSlug } from "@/lib/tiers";
import {
  DEFAULT_STYLE_MIX,
  isPostingFrequency,
  isPremiumFormat,
  isStyleMixValid,
  type IntakeRecord,
  type PostingFrequency,
  type PremiumFormat,
  type StyleMix,
} from "@/lib/order-types";

// Pre-checkout intake. Customer fills a tier-specific form on /order/[tier];
// we save the payload to KV under `intake:<id>` and return the Shopify cart
// permalink with `attributes[intake_id]=<id>` baked in. After Shopify
// processes payment, /api/order-paid recovers our record via the cart
// attribute and denormalizes everything into `paid-order:<id>`.
//
// Validation is tier-aware — the worker downstream relies on tier-specific
// fields being present and well-formed:
//   premium       → premiumFormat ("3x10s" | "2x15s")
//   content-pack  → productUrls (1–10), styleMix (sums to 10), postingPlan
//   managed-social → IG and/or TikTok handle, postingFrequency, brand voice/goals
export const runtime = "nodejs";

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HANDLE_RX = /^@?[A-Za-z0-9._-]{1,40}$/;

function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

function isHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Strip `@` prefix, trim. Returns `null` for empty. */
function normalizeHandle(input: unknown): string | null {
  if (input == null) return null;
  const raw = String(input).trim();
  if (!raw) return null;
  return raw.startsWith("@") ? raw : `@${raw}`;
}

/**
 * Parse the content-pack URLs list. Customer can paste up to 10 URLs in a
 * textarea, one per line. Trims, drops blanks, validates each is http(s).
 */
function parseProductUrls(input: unknown): { ok: true; urls: string[] } | { ok: false; error: string } {
  if (typeof input === "string") {
    const lines = input
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length === 0) {
      return { ok: false, error: "Please enter at least one product URL." };
    }
    if (lines.length > 10) {
      return {
        ok: false,
        error: `Content Pack supports up to 10 product URLs (you entered ${lines.length}).`,
      };
    }
    for (const u of lines) {
      if (!isHttpUrl(u)) {
        return {
          ok: false,
          error: `"${u.slice(0, 60)}…" isn't a valid http(s) URL. Check each line.`,
        };
      }
    }
    return { ok: true, urls: lines };
  }
  if (Array.isArray(input)) {
    const lines = input
      .map((x) => String(x ?? "").trim())
      .filter((l) => l.length > 0);
    if (lines.length === 0) {
      return { ok: false, error: "Please enter at least one product URL." };
    }
    if (lines.length > 10) {
      return {
        ok: false,
        error: `Content Pack supports up to 10 product URLs (you entered ${lines.length}).`,
      };
    }
    for (const u of lines) {
      if (!isHttpUrl(u)) {
        return {
          ok: false,
          error: `"${u.slice(0, 60)}…" isn't a valid http(s) URL.`,
        };
      }
    }
    return { ok: true, urls: lines };
  }
  return { ok: false, error: "Please enter at least one product URL." };
}

function parseStyleMix(input: unknown): { ok: true; mix: StyleMix } | { ok: false; error: string } {
  if (input == null) return { ok: true, mix: DEFAULT_STYLE_MIX };
  if (typeof input !== "object") {
    return { ok: false, error: "Style mix must be an object." };
  }
  const raw = input as Record<string, unknown>;
  const mix: StyleMix = {
    hyperMotion: Number(raw.hyperMotion ?? raw.hyper_motion ?? 0),
    soul: Number(raw.soul ?? 0),
    cinema: Number(raw.cinema ?? 0),
  };
  if (!isStyleMixValid(mix)) {
    return {
      ok: false,
      error:
        "Style mix must be three integers (Hyper Motion / Soul / Cinema) summing to exactly 10.",
    };
  }
  return { ok: true, mix };
}

interface RawBody {
  tier?: unknown;
  productUrl?: unknown;
  productUrls?: unknown;
  brandName?: unknown;
  prompt?: unknown;
  name?: unknown;
  email?: unknown;
  // Premium:
  premiumFormat?: unknown;
  // Content Pack:
  styleMix?: unknown;
  postingPlan?: unknown;
  // Managed Social:
  instagramHandle?: unknown;
  tiktokHandle?: unknown;
  otherSocials?: unknown;
  postingFrequency?: unknown;
  postingFrequencyCustom?: unknown;
  brandVoice?: unknown;
  audienceGoals?: unknown;
  bufferEmail?: unknown;
}

export async function POST(req: NextRequest) {
  let body: RawBody;
  try {
    body = (await req.json()) as RawBody;
  } catch {
    return bad("Invalid request body.");
  }

  // ─── Tier ──────────────────────────────────────────────────────────
  const tierStr = String(body.tier ?? "").trim();
  if (!isTierSlug(tierStr)) return bad("Unknown tier.");
  const tier: TierSlug = tierStr;

  // ─── Common fields ─────────────────────────────────────────────────
  const brandName = String(body.brandName ?? "").trim();
  const promptRaw = body.prompt == null ? "" : String(body.prompt).trim();
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();

  if (brandName.length < 1 || brandName.length > 80) {
    return bad("Please enter a brand name (max 80 characters).");
  }
  if (name.length < 2 || name.length > 80) {
    return bad("Please enter your name (at least 2 characters).");
  }
  if (!EMAIL_RX.test(email) || email.length > 254) {
    return bad("Please enter a valid email address.");
  }
  if (promptRaw.length > 2000) {
    return bad("Style notes are too long (max 2000 characters).");
  }

  // ─── Tier-specific URL handling ────────────────────────────────────
  let productUrl: string;
  let productUrls: string[] | undefined;

  if (tier === "content-pack") {
    const parsed = parseProductUrls(body.productUrls ?? body.productUrl);
    if (!parsed.ok) return bad(parsed.error);
    productUrls = parsed.urls;
    productUrl = parsed.urls[0]; // first URL kept as primary for compat
  } else {
    const single = String(body.productUrl ?? "").trim();
    if (!isHttpUrl(single)) {
      return bad(
        "Please enter a valid URL (must start with http:// or https://).",
      );
    }
    productUrl = single;
  }

  // ─── Tier-specific extras ──────────────────────────────────────────
  let premiumFormat: PremiumFormat | undefined;
  let styleMix: StyleMix | undefined;
  let postingPlan: string | null | undefined;
  let instagramHandle: string | null | undefined;
  let tiktokHandle: string | null | undefined;
  let otherSocials: string | null | undefined;
  let postingFrequency: PostingFrequency | undefined;
  let postingFrequencyCustom: string | null | undefined;
  let brandVoice: string | null | undefined;
  let audienceGoals: string | null | undefined;
  let bufferEmail: string | null | undefined;

  if (tier === "premium") {
    if (!isPremiumFormat(body.premiumFormat)) {
      return bad(
        "Please choose a Premium format (Three 10-second videos or Two 15-second videos).",
      );
    }
    premiumFormat = body.premiumFormat;
  }

  if (tier === "content-pack") {
    const sm = parseStyleMix(body.styleMix);
    if (!sm.ok) return bad(sm.error);
    styleMix = sm.mix;

    const ppRaw = body.postingPlan == null ? "" : String(body.postingPlan).trim();
    if (ppRaw.length > 2000) {
      return bad("Posting plan is too long (max 2000 characters).");
    }
    postingPlan = ppRaw || null;
  }

  if (tier === "managed-social") {
    instagramHandle = normalizeHandle(body.instagramHandle);
    tiktokHandle = normalizeHandle(body.tiktokHandle);

    if (!instagramHandle && !tiktokHandle) {
      return bad("Please provide at least one — Instagram or TikTok handle.");
    }
    for (const [label, h] of [
      ["Instagram", instagramHandle],
      ["TikTok", tiktokHandle],
    ] as const) {
      if (h && !HANDLE_RX.test(h)) {
        return bad(
          `${label} handle "${h}" looks off — use letters, numbers, dots, dashes, underscores.`,
        );
      }
    }

    const otherRaw =
      body.otherSocials == null ? "" : String(body.otherSocials).trim();
    if (otherRaw.length > 500) {
      return bad("Other social handles list is too long (max 500 characters).");
    }
    otherSocials = otherRaw || null;

    if (!isPostingFrequency(body.postingFrequency)) {
      return bad("Please choose a posting frequency.");
    }
    postingFrequency = body.postingFrequency;

    if (postingFrequency === "custom") {
      const customRaw =
        body.postingFrequencyCustom == null
          ? ""
          : String(body.postingFrequencyCustom).trim();
      if (!customRaw) {
        return bad("Please describe your custom posting frequency.");
      }
      if (customRaw.length > 500) {
        return bad("Custom posting frequency is too long (max 500 characters).");
      }
      postingFrequencyCustom = customRaw;
    } else {
      postingFrequencyCustom = null;
    }

    const voiceRaw = body.brandVoice == null ? "" : String(body.brandVoice).trim();
    if (voiceRaw.length > 1000) {
      return bad("Brand voice is too long (max 1000 characters).");
    }
    brandVoice = voiceRaw || null;

    const goalsRaw =
      body.audienceGoals == null ? "" : String(body.audienceGoals).trim();
    if (goalsRaw.length > 1000) {
      return bad("Audience / goals is too long (max 1000 characters).");
    }
    audienceGoals = goalsRaw || null;

    const bufferRaw =
      body.bufferEmail == null ? "" : String(body.bufferEmail).trim().toLowerCase();
    if (bufferRaw && (!EMAIL_RX.test(bufferRaw) || bufferRaw.length > 254)) {
      return bad("Buffer account email isn't valid.");
    }
    bufferEmail = bufferRaw || null;
  }

  // ─── Persist ───────────────────────────────────────────────────────
  const intakeId = randomUUID();
  const ip = clientIp(req);
  const createdAt = new Date().toISOString();

  const record: IntakeRecord = {
    id: intakeId,
    tier,
    productUrl,
    productUrls,
    brandName,
    prompt: promptRaw || null,
    name,
    email,
    ip,
    createdAt,
    status: "intake",
    premiumFormat,
    styleMix,
    postingPlan,
    instagramHandle,
    tiktokHandle,
    otherSocials,
    postingFrequency,
    postingFrequencyCustom,
    brandVoice,
    audienceGoals,
    bufferEmail,
  };

  try {
    // 30-day TTL — long enough for slow-deciding customers, short enough that
    // abandoned carts age out.
    await kv.set(`intake:${intakeId}`, record, { ex: 60 * 60 * 24 * 30 });
  } catch (e) {
    console.error("[order-intake] KV write failed:", e);
    return bad("Couldn't save your order. Try again.", 500);
  }

  const checkoutUrl = buildShopifyCheckoutUrl(tier, intakeId);
  return NextResponse.json({ intakeId, checkoutUrl });
}
