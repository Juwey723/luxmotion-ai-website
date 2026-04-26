import type { TierSlug } from "@/lib/tiers";

export type IntakeStatus = "intake" | "consumed";

export type PremiumFormat = "3x10s" | "2x15s";

export type PostingFrequency =
  | "3xPerWeek"
  | "frontLoaded"
  | "evenSpread"
  | "custom";

export interface StyleMix {
  /** Number of videos in the Hyper Motion (cinematic luxury) style. 0–10. */
  hyperMotion: number;
  /** Number of videos in the Soul (artistic, dreamy) style. 0–10. */
  soul: number;
  /** Number of videos in the Cinema (clean, editorial) style. 0–10. */
  cinema: number;
}

export interface IntakeRecord {
  id: string; // UUID
  tier: TierSlug;

  // ─── Common to every tier ───────────────────────────────────────────
  /**
   * Single product / brand homepage URL.
   *
   * For content-pack, this is the FIRST URL in `productUrls` (kept here
   * for backward compat with worker code that only reads productUrl).
   */
  productUrl: string;
  brandName: string;
  prompt: string | null;
  name: string;
  email: string;
  ip: string;
  createdAt: string; // ISO 8601
  status: IntakeStatus;

  // ─── Premium-only ───────────────────────────────────────────────────
  /** Selected delivery format for premium tier. */
  premiumFormat?: PremiumFormat;

  // ─── Content Pack-only ──────────────────────────────────────────────
  /** Up to 10 product URLs the customer wants featured across the 10 videos. */
  productUrls?: string[];
  /** Distribution of the 10 videos across the 3 visual styles (must sum to 10). */
  styleMix?: StyleMix;
  /** Customer's posting plan / context (informational only, helps formatting). */
  postingPlan?: string | null;

  // ─── Managed Social-only ────────────────────────────────────────────
  /** e.g. "@brandname" */
  instagramHandle?: string | null;
  /** e.g. "@brandname" */
  tiktokHandle?: string | null;
  /** Freeform text — Twitter, YouTube, LinkedIn, etc. */
  otherSocials?: string | null;
  postingFrequency?: PostingFrequency;
  /** Free-text description, only set when `postingFrequency === "custom"`. */
  postingFrequencyCustom?: string | null;
  brandVoice?: string | null;
  audienceGoals?: string | null;
  bufferEmail?: string | null;

  // ─── Legacy ─────────────────────────────────────────────────────────
  /**
   * Old free-text "social handles" field used before we split into
   * dedicated IG/TikTok inputs. Kept on the type so in-flight intakes
   * already in KV deserialize cleanly.
   */
  socialHandles?: string | null;
}

export type PaidOrderStatus = "pending" | "fulfilled" | "failed";

export interface PaidOrderRecord {
  /** Same UUID as the intake — we use it as the order ID end-to-end. */
  id: string;
  intakeId: string;
  tier: TierSlug;

  // Denormalized intake data (so the worker only needs to read one key):
  productUrl: string;
  productUrls?: string[];
  brandName: string;
  prompt: string | null;
  name: string;
  email: string;
  ip: string;

  // Tier-specific options (mirror IntakeRecord):
  premiumFormat?: PremiumFormat;
  styleMix?: StyleMix;
  postingPlan?: string | null;
  instagramHandle?: string | null;
  tiktokHandle?: string | null;
  otherSocials?: string | null;
  postingFrequency?: PostingFrequency;
  postingFrequencyCustom?: string | null;
  brandVoice?: string | null;
  audienceGoals?: string | null;
  bufferEmail?: string | null;
  socialHandles?: string | null; // legacy

  // Shopify metadata captured by the webhook:
  shopifyOrderId: string;
  shopifyOrderName?: string;
  shopifyOrderNumber?: number;
  shopifyAmount?: string;
  shopifyCurrency?: string;
  paidAt: string; // ISO 8601

  // Fulfillment metadata, set by /api/order-fulfill:
  status: PaidOrderStatus;
  videoUrl?: string;
  fileSizeMb?: number;
  fulfilledAt?: string;
  fulfillmentEmailSent?: boolean;

  // Bookkeeping:
  createdAt: string; // mirrors intake.createdAt for sorting
}

export const DEFAULT_STYLE_MIX: StyleMix = {
  hyperMotion: 3,
  soul: 3,
  cinema: 4,
};

export const POSTING_FREQUENCY_LABELS: Record<PostingFrequency, string> = {
  "3xPerWeek": "3× per week (12 videos / 4 weeks)",
  frontLoaded: "Daily for the first 12 days, then weekly",
  evenSpread: "Even spread across the month",
  custom: "Custom — described below",
};

export function isStyleMixValid(m: StyleMix): boolean {
  const total = m.hyperMotion + m.soul + m.cinema;
  return (
    Number.isInteger(m.hyperMotion) &&
    Number.isInteger(m.soul) &&
    Number.isInteger(m.cinema) &&
    m.hyperMotion >= 0 &&
    m.soul >= 0 &&
    m.cinema >= 0 &&
    total === 10
  );
}

export function isPostingFrequency(value: unknown): value is PostingFrequency {
  return (
    value === "3xPerWeek" ||
    value === "frontLoaded" ||
    value === "evenSpread" ||
    value === "custom"
  );
}

export function isPremiumFormat(value: unknown): value is PremiumFormat {
  return value === "3x10s" || value === "2x15s";
}
