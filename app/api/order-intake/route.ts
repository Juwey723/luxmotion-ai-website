import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  buildShopifyCheckoutUrl,
  isAdSpendRangeValue,
  isGrowthGoalValue,
  isIndustryValue,
  isPendingShopifySetup,
  isRevenueRangeValue,
  isTierSlug,
  TIERS,
  type AdSpendRangeValue,
  type GrowthGoalValue,
  type IndustryValue,
  type RevenueRangeValue,
  type TierSlug,
} from "@/lib/tiers";
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
import {
  sendAdminOrderNotification,
  sendFullSpectrumIntakeReceived,
} from "@/lib/emails";

// Pre-checkout intake. Customer fills a tier-specific form on /order/[tier];
// we save the payload to KV under `intake:<id>` and return either:
//   - a Shopify cart permalink (for tiers with real variant IDs)
//   - { pendingSetup: true } (for Full Spectrum tiers where the variant is
//     still a TODO placeholder — we email the customer + alert admin instead
//     of redirecting to a broken cart)
//
// Validation is tier-aware — every tier-specific field has its own rules.
export const runtime = "nodejs";

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HANDLE_RX = /^@?[A-Za-z0-9._-]{1,40}$/;
const PHONE_RX = /^[+]?[0-9\s().-]{7,30}$/;

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

function normalizeHandle(input: unknown): string | null {
  if (input == null) return null;
  const raw = String(input).trim();
  if (!raw) return null;
  return raw.startsWith("@") ? raw : `@${raw}`;
}

function parseProductUrls(
  input: unknown,
): { ok: true; urls: string[] } | { ok: false; error: string } {
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

function parseStyleMix(
  input: unknown,
): { ok: true; mix: StyleMix } | { ok: false; error: string } {
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
  // Full Spectrum:
  phone?: unknown;
  youtubeChannel?: unknown;
  industry?: unknown;
  industryOther?: unknown;
  monthlyRevenue?: unknown;
  adSpend?: unknown;
  competitors?: unknown;
  growthGoal?: unknown;
  growthGoalOther?: unknown;
  onboardingPreference?: unknown;
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
  const tierData = TIERS[tier];
  const isFullSpectrum = tierData.kind === "full-spectrum";

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
    return bad("Notes are too long (max 2000 characters).");
  }

  // ─── Tier-specific URL handling ────────────────────────────────────
  let productUrl: string;
  let productUrls: string[] | undefined;

  if (tier === "content-pack") {
    const parsed = parseProductUrls(body.productUrls ?? body.productUrl);
    if (!parsed.ok) return bad(parsed.error);
    productUrls = parsed.urls;
    productUrl = parsed.urls[0];
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
  // Full Spectrum:
  let phone: string | null | undefined;
  let youtubeChannel: string | null | undefined;
  let industry: IndustryValue | undefined;
  let industryOther: string | null | undefined;
  let monthlyRevenue: RevenueRangeValue | undefined;
  let adSpend: AdSpendRangeValue | undefined;
  let competitors: string | null | undefined;
  let growthGoal: GrowthGoalValue | undefined;
  let growthGoalOther: string | null | undefined;
  let onboardingPreference: string | null | undefined;

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

  if (tier === "managed-social" || isFullSpectrum) {
    instagramHandle = normalizeHandle(body.instagramHandle);
    tiktokHandle = normalizeHandle(body.tiktokHandle);

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
  }

  if (tier === "managed-social") {
    if (!instagramHandle && !tiktokHandle) {
      return bad("Please provide at least one — Instagram or TikTok handle.");
    }
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
      body.bufferEmail == null
        ? ""
        : String(body.bufferEmail).trim().toLowerCase();
    if (bufferRaw && (!EMAIL_RX.test(bufferRaw) || bufferRaw.length > 254)) {
      return bad("Buffer account email isn't valid.");
    }
    bufferEmail = bufferRaw || null;
  }

  if (isFullSpectrum) {
    // YouTube channel — freeform string (handle, URL, or both)
    const ytRaw =
      body.youtubeChannel == null ? "" : String(body.youtubeChannel).trim();
    if (ytRaw.length > 200) {
      return bad("YouTube channel is too long (max 200 characters).");
    }
    youtubeChannel = ytRaw || null;

    // At least one social channel required
    if (!instagramHandle && !tiktokHandle && !youtubeChannel) {
      return bad(
        "Please share at least one social channel — Instagram, TikTok, or YouTube.",
      );
    }

    // Phone — required for FS tiers (we'll personally call them)
    const phoneRaw = body.phone == null ? "" : String(body.phone).trim();
    if (!phoneRaw || !PHONE_RX.test(phoneRaw)) {
      return bad("Please enter a phone number we can reach you at.");
    }
    phone = phoneRaw;

    // Industry
    if (!isIndustryValue(body.industry)) {
      return bad("Please choose an industry.");
    }
    industry = body.industry;
    if (industry === "other") {
      const otherRaw =
        body.industryOther == null ? "" : String(body.industryOther).trim();
      if (!otherRaw) return bad("Please describe your industry.");
      if (otherRaw.length > 80) {
        return bad("Industry description is too long (max 80 characters).");
      }
      industryOther = otherRaw;
    } else {
      industryOther = null;
    }

    // Revenue + Ad spend (both required, but "private" is a valid value)
    if (!isRevenueRangeValue(body.monthlyRevenue)) {
      return bad("Please choose a monthly revenue range.");
    }
    monthlyRevenue = body.monthlyRevenue;

    if (!isAdSpendRangeValue(body.adSpend)) {
      return bad("Please choose an ad spend range.");
    }
    adSpend = body.adSpend;

    // Competitors (optional)
    const compRaw =
      body.competitors == null ? "" : String(body.competitors).trim();
    if (compRaw.length > 1000) {
      return bad("Competitor list is too long (max 1000 characters).");
    }
    competitors = compRaw || null;

    // Growth goal
    if (!isGrowthGoalValue(body.growthGoal)) {
      return bad("Please choose a primary growth goal.");
    }
    growthGoal = body.growthGoal;
    if (growthGoal === "other") {
      const otherRaw =
        body.growthGoalOther == null
          ? ""
          : String(body.growthGoalOther).trim();
      if (!otherRaw) return bad("Please describe your growth goal.");
      if (otherRaw.length > 500) {
        return bad("Growth goal description is too long (max 500 characters).");
      }
      growthGoalOther = otherRaw;
    } else {
      growthGoalOther = null;
    }

    // Brand voice + audience (optional, but encouraged)
    const voiceRaw = body.brandVoice == null ? "" : String(body.brandVoice).trim();
    if (voiceRaw.length > 1500) {
      return bad("Brand voice is too long (max 1500 characters).");
    }
    brandVoice = voiceRaw || null;

    const goalsRaw =
      body.audienceGoals == null ? "" : String(body.audienceGoals).trim();
    if (goalsRaw.length > 1500) {
      return bad("Audience / goals is too long (max 1500 characters).");
    }
    audienceGoals = goalsRaw || null;

    // Onboarding preference (optional)
    const onbRaw =
      body.onboardingPreference == null
        ? ""
        : String(body.onboardingPreference).trim();
    if (onbRaw.length > 200) {
      return bad("Onboarding availability is too long (max 200 characters).");
    }
    onboardingPreference = onbRaw || null;
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
    phone,
    youtubeChannel,
    industry,
    industryOther,
    monthlyRevenue,
    adSpend,
    competitors,
    growthGoal,
    growthGoalOther,
    onboardingPreference,
  };

  try {
    // 30-day TTL — long enough for slow-deciding customers, short enough that
    // abandoned carts age out.
    await kv.set(`intake:${intakeId}`, record, { ex: 60 * 60 * 24 * 30 });
  } catch (e) {
    console.error("[order-intake] KV write failed:", e);
    return bad("Couldn't save your order. Try again.", 500);
  }

  // ─── TODO-variant short-circuit ────────────────────────────────────
  // For tiers whose Shopify variant ID is still a placeholder (currently the
  // 3 Full Spectrum tiers), don't redirect to a broken cart. Send an admin
  // alert (HIGH-VALUE LEAD) + customer confirmation, and return pendingSetup.
  if (isPendingShopifySetup(tier)) {
    void sendAdminOrderNotification({
      orderId: intakeId,
      intakeId,
      tier,
      brandName,
      productUrl,
      productUrls,
      prompt: promptRaw || null,
      customerName: name,
      customerEmail: email,
      ip,
      isIntakeOnly: true,
      premiumFormat,
      styleMix,
      postingPlan,
      instagramHandle: instagramHandle ?? null,
      tiktokHandle: tiktokHandle ?? null,
      otherSocials: otherSocials ?? null,
      postingFrequency,
      postingFrequencyCustom: postingFrequencyCustom ?? null,
      brandVoice: brandVoice ?? null,
      audienceGoals: audienceGoals ?? null,
      bufferEmail: bufferEmail ?? null,
      phone: phone ?? null,
      youtubeChannel: youtubeChannel ?? null,
      industry,
      industryOther: industryOther ?? null,
      monthlyRevenue,
      adSpend,
      competitors: competitors ?? null,
      growthGoal,
      growthGoalOther: growthGoalOther ?? null,
      onboardingPreference: onboardingPreference ?? null,
    }).catch((e) =>
      console.warn("[order-intake] admin email (intake-only) failed:", e),
    );

    if (isFullSpectrum) {
      void sendFullSpectrumIntakeReceived({
        to: email,
        name,
        brandName,
        tier,
        phone: phone ?? null,
      }).catch((e) =>
        console.warn("[order-intake] FS intake-received email failed:", e),
      );
    }

    return NextResponse.json({
      intakeId,
      pendingSetup: true,
      message:
        "Got it — we'll personally call you within 24 hours to set up your onboarding.",
    });
  }

  const checkoutUrl = buildShopifyCheckoutUrl(tier, intakeId);
  return NextResponse.json({ intakeId, checkoutUrl });
}
