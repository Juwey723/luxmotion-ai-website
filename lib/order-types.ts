import type {
  AdSpendRangeValue,
  GrowthGoalValue,
  IndustryValue,
  RevenueRangeValue,
  TierSlug,
} from "@/lib/tiers";

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
  productUrl: string;
  brandName: string;
  prompt: string | null;
  name: string;
  email: string;
  ip: string;
  createdAt: string; // ISO 8601
  status: IntakeStatus;

  // ─── Premium-only ───────────────────────────────────────────────────
  premiumFormat?: PremiumFormat;

  // ─── Content Pack-only ──────────────────────────────────────────────
  productUrls?: string[];
  styleMix?: StyleMix;
  postingPlan?: string | null;

  // ─── Managed Social-only ────────────────────────────────────────────
  instagramHandle?: string | null;
  tiktokHandle?: string | null;
  otherSocials?: string | null;
  postingFrequency?: PostingFrequency;
  postingFrequencyCustom?: string | null;
  brandVoice?: string | null;
  audienceGoals?: string | null;
  bufferEmail?: string | null;

  // ─── Full Spectrum-only (Growth / Scale / Dominate) ────────────────
  /** Phone number — FS leads always get a call back. */
  phone?: string | null;
  youtubeChannel?: string | null;
  industry?: IndustryValue;
  industryOther?: string | null;
  monthlyRevenue?: RevenueRangeValue;
  adSpend?: AdSpendRangeValue;
  competitors?: string | null;
  growthGoal?: GrowthGoalValue;
  growthGoalOther?: string | null;
  /** Free-text best-time-for-onboarding (e.g. "Tue mornings ET"). */
  onboardingPreference?: string | null;

  // ─── Legacy ─────────────────────────────────────────────────────────
  socialHandles?: string | null;
}

export type PaidOrderStatus = "pending" | "fulfilled" | "failed";

export interface PaidOrderRecord {
  id: string;
  intakeId: string;
  tier: TierSlug;

  // Denormalized intake data ─────────────────────────────────────────
  productUrl: string;
  productUrls?: string[];
  brandName: string;
  prompt: string | null;
  name: string;
  email: string;
  ip: string;

  // Tier-specific options (mirror IntakeRecord) ──────────────────────
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
  phone?: string | null;
  youtubeChannel?: string | null;
  industry?: IndustryValue;
  industryOther?: string | null;
  monthlyRevenue?: RevenueRangeValue;
  adSpend?: AdSpendRangeValue;
  competitors?: string | null;
  growthGoal?: GrowthGoalValue;
  growthGoalOther?: string | null;
  onboardingPreference?: string | null;
  socialHandles?: string | null;

  // Shopify metadata ─────────────────────────────────────────────────
  shopifyOrderId: string;
  shopifyOrderName?: string;
  shopifyOrderNumber?: number;
  shopifyAmount?: string;
  shopifyCurrency?: string;
  paidAt: string;

  // Fulfillment metadata ─────────────────────────────────────────────
  status: PaidOrderStatus;
  videoUrl?: string;
  fileSizeMb?: number;
  fulfilledAt?: string;
  fulfillmentEmailSent?: boolean;

  // Bookkeeping ──────────────────────────────────────────────────────
  createdAt: string;
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
