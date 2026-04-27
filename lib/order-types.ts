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

/**
 * One scheduled / posted Buffer update tied to a specific delivered video.
 * Appended to `paid-order:<id>.bufferPosts[]` each time `/api/buffer-post`
 * successfully schedules a post on a customer's connected channel.
 */
export interface BufferPostRecord {
  /** Buffer's `updates[].id` from the create response. */
  updateId: string;
  /** The Buffer profile (channel) this post is scheduled to. */
  profileId: string;
  /** ISO 8601 timestamp Buffer scheduled the post for (or scheduled-at-now if posted immediately). */
  scheduledAt: string;
  /** Vercel Blob URL of the video that was posted. */
  videoUrl: string;
  /** Caption + hashtags submitted to Buffer. */
  caption: string;
  /** Service the profile belongs to: "instagram" / "tiktok" / "twitter" / etc. */
  service?: string;
}

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

  /** Multi-video tiers accumulate Blob URLs here as `/api/order-fulfill-partial` lands each one. The final video also goes into `videoUrl` when `/api/order-fulfill` finalizes. */
  gallery?: string[];
  videosCompleted?: number;
  videosNeeded?: number;

  // Buffer integration ───────────────────────────────────────────────
  /**
   * Buffer profile IDs the customer's social channels are connected under.
   * Set manually by the admin (James) after the customer connects their
   * accounts during Buffer onboarding. v2 will be a real OAuth flow.
   */
  bufferProfileIds?: string[];
  /** History of Buffer posts scheduled for this order's videos. */
  bufferPosts?: BufferPostRecord[];

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
