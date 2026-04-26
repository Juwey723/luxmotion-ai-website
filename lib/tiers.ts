// Single source of truth for ALL paid tiers. Read by:
//   - components/site/pricing.tsx (renders SINGLE_TIERS + BUNDLE_TIERS)
//   - app/full-spectrum/* (renders FULL_SPECTRUM_TIERS only)
//   - app/order/[tier]/page.tsx (dispatches by slug to the right form)
//   - app/api/order-intake/route.ts (validates tier, builds Shopify URL,
//     short-circuits when variant ID is still a TODO placeholder)
//   - app/layout.tsx (JSON-LD Service offers)
//   - lib/emails.ts (tier mini-row in fulfillment email)

export type TierSlug =
  | "basic"
  | "standard"
  | "premium"
  | "content-pack"
  | "managed-social"
  | "full-spectrum-growth"
  | "full-spectrum-scale"
  | "full-spectrum-dominate";

export type TierKind = "single" | "bundle" | "full-spectrum";

export interface Tier {
  slug: TierSlug;
  /** Long label used on intake page header — "Basic — 10s Hyper Motion Ad" */
  label: string;
  /** Short label for buttons + emails — "Basic" */
  shortName: string;
  price: number;
  /** "" for one-time, "/mo" for the recurring services */
  priceSuffix: string;
  /** Shopify variant ID for the checkout cart permalink. */
  variantId: string;
  /** Human-readable delivery window — "24 hours", "Monthly", etc. */
  delivery: string;
  /** Bullet list shown on the pricing card */
  features: readonly string[];
  /** Marks the "Most Popular" pricing card */
  popular: boolean;
  /** Visual section grouping */
  kind: TierKind;
  /** Tier-aware label for the URL field on the intake form */
  urlFieldLabel: string;
  /** Whether to show the optional "social handles" field on the intake form */
  showSocialHandlesField: boolean;
  /** Marketing tagline shown above the price on bundle cards */
  tagline: string;
}

export const TIERS: Record<TierSlug, Tier> = {
  basic: {
    slug: "basic",
    label: "Basic — 10s Hyper Motion Ad",
    shortName: "Basic",
    price: 30,
    priceSuffix: "",
    variantId: "48568804835545",
    delivery: "24 hours",
    features: [
      "One 10-second video",
      "1080P resolution",
      "1 revision",
      "24-hour delivery",
      "Commercial use license",
    ],
    popular: false,
    kind: "single",
    urlFieldLabel: "Product URL",
    showSocialHandlesField: false,
    tagline: "Single video",
  },
  standard: {
    slug: "standard",
    label: "Standard — 15s Hyper Motion Ad",
    shortName: "Standard",
    price: 60,
    priceSuffix: "",
    variantId: "48568806047961",
    delivery: "24 hours",
    features: [
      "One 15-second video",
      "1080P resolution",
      "2 revisions",
      "24-hour delivery",
      "Commercial use license",
    ],
    popular: true,
    kind: "single",
    urlFieldLabel: "Product URL",
    showSocialHandlesField: false,
    tagline: "Single video",
  },
  premium: {
    slug: "premium",
    label: "Premium — Multi-Video Pack",
    shortName: "Premium",
    price: 90,
    priceSuffix: "",
    variantId: "48568807096537",
    delivery: "12 hours",
    features: [
      "Three 10-second OR two 15-second videos",
      "1080P resolution",
      "3 revisions",
      "12-hour delivery",
      "Commercial use license",
    ],
    popular: false,
    kind: "single",
    urlFieldLabel: "Product URL",
    showSocialHandlesField: false,
    tagline: "Multi-video",
  },
  "content-pack": {
    slug: "content-pack",
    label: "Content Pack — 10 Videos in 3 Styles",
    shortName: "Content Pack",
    price: 250,
    priceSuffix: "",
    variantId: "48569239109849",
    delivery: "48 hours",
    features: [
      "10 videos × 10 seconds each",
      "1080P cinematic quality",
      "3 different visual styles (Hyper Motion, Soul, Cinema)",
      "2 revisions per video",
      "48-hour delivery",
      "Commercial use license",
    ],
    popular: false,
    kind: "bundle",
    urlFieldLabel: "Product URL",
    showSocialHandlesField: false,
    tagline: "Multi-style bundle",
  },
  "managed-social": {
    slug: "managed-social",
    label: "Managed Social — Monthly Service",
    shortName: "Managed Social",
    price: 600,
    priceSuffix: "/mo",
    variantId: "48569279480025",
    delivery: "Monthly",
    features: [
      "12 videos per month, mixed styles",
      "Posted on your Instagram + TikTok via Buffer",
      "Monthly analytics report (views, clicks, conversions)",
      "Brand-matched aesthetic across every video",
      "Cancel anytime, no minimum commitment",
      "Commercial use license",
    ],
    popular: false,
    kind: "bundle",
    urlFieldLabel: "Brand homepage URL",
    showSocialHandlesField: true,
    tagline: "Monthly service",
  },

  // ─── Full Spectrum Marketing — flagship recurring tiers ─────────────────
  // Variant IDs are TODO placeholders. /api/order-intake detects the prefix
  // and short-circuits the Shopify redirect so customers see a "we'll be in
  // touch" confirmation instead of a broken cart. Fill these in after
  // creating the Shopify products and the flow becomes a normal redirect.

  "full-spectrum-growth": {
    slug: "full-spectrum-growth",
    label: "Full Spectrum: Growth",
    shortName: "Growth",
    price: 2000,
    priceSuffix: "/mo",
    variantId: "TODO_FULL_SPECTRUM_GROWTH",
    delivery: "Monthly subscription",
    features: [
      "30 cinematic AI videos / month (mixed styles)",
      "Posted on Instagram + TikTok via Buffer",
      "2× monthly strategy calls (30 min each)",
      "Bi-weekly analytics + recommendations report",
      "Email marketing setup: 3 automated sequences",
      "$500/mo Meta ads — we run + optimize",
      "1 custom landing page, A/B tested",
      "Priority 12-hour turnaround",
      "Brand voice + messaging guidelines doc",
      "Cancel anytime, no minimum commitment",
    ],
    popular: false,
    kind: "full-spectrum",
    urlFieldLabel: "Brand homepage URL",
    showSocialHandlesField: true,
    tagline: "Full Spectrum",
  },
  "full-spectrum-scale": {
    slug: "full-spectrum-scale",
    label: "Full Spectrum: Scale",
    shortName: "Scale",
    price: 3500,
    priceSuffix: "/mo",
    variantId: "TODO_FULL_SPECTRUM_SCALE",
    delivery: "Monthly subscription",
    features: [
      "Everything in Growth, plus:",
      "60 cinematic AI videos / month",
      "Multi-platform posting: IG, TikTok, YouTube Shorts, Pinterest, Facebook",
      "Weekly strategy calls (45 min)",
      "Weekly analytics + recommendations",
      "$1,500/mo combined Meta + TikTok ads",
      "3 custom landing pages, A/B tested",
      "SEO blog content: 4 articles per month",
      "Influencer outreach: 10 micro-influencers contacted per month",
      "Monthly competitor analysis report",
      "Seasonal campaign planning",
      "Priority 6-hour turnaround",
      "Live performance dashboard",
    ],
    popular: true,
    kind: "full-spectrum",
    urlFieldLabel: "Brand homepage URL",
    showSocialHandlesField: true,
    tagline: "Full Spectrum",
  },
  "full-spectrum-dominate": {
    slug: "full-spectrum-dominate",
    label: "Full Spectrum: Dominate",
    shortName: "Dominate",
    price: 5000,
    priceSuffix: "/mo",
    variantId: "TODO_FULL_SPECTRUM_DOMINATE",
    delivery: "Monthly subscription",
    features: [
      "Everything in Scale, plus:",
      "100+ cinematic AI videos / month",
      "All major platforms: IG, TikTok, YouTube Shorts, Pinterest, Facebook, X, LinkedIn",
      "2× weekly strategy calls (1 hour each)",
      "Real-time analytics + viral alerts (we boost spikes with paid spend)",
      "$3,000/mo dynamic ad management across Meta, TikTok, Google",
      "Unlimited custom landing pages + A/B testing",
      "Expanded email marketing: 6+ sequences + monthly newsletter",
      "SEO content: 10 blog articles per month + transcripts",
      "Influencer + UGC partnerships managed end-to-end (3–5/month)",
      "Brand identity refinement throughout",
      "Monthly CRO audit + implementation",
      "Priority 1-hour emergency turnaround",
      "Direct Slack/Discord channel with the team",
      "Quarterly business review + 12-month roadmap",
      "Performance guarantee: 30% follower growth or 20% more conversions in 90 days",
    ],
    popular: false,
    kind: "full-spectrum",
    urlFieldLabel: "Brand homepage URL",
    showSocialHandlesField: true,
    tagline: "Full Spectrum",
  },
};

export const TIER_SLUGS = Object.keys(TIERS) as TierSlug[];

export const SINGLE_TIERS: readonly Tier[] = TIER_SLUGS.filter(
  (s) => TIERS[s].kind === "single",
).map((s) => TIERS[s]);

export const BUNDLE_TIERS: readonly Tier[] = TIER_SLUGS.filter(
  (s) => TIERS[s].kind === "bundle",
).map((s) => TIERS[s]);

export const FULL_SPECTRUM_TIERS: readonly Tier[] = TIER_SLUGS.filter(
  (s) => TIERS[s].kind === "full-spectrum",
).map((s) => TIERS[s]);

export function isTierSlug(value: string): value is TierSlug {
  return value in TIERS;
}

/**
 * Returns true if this tier's Shopify variant ID is still a TODO placeholder.
 * /api/order-intake uses this to short-circuit the Shopify redirect and
 * deliver a "we'll be in touch" confirmation instead.
 */
export function isPendingShopifySetup(slug: TierSlug): boolean {
  return TIERS[slug].variantId.startsWith("TODO_");
}

/** Public intake-page path for a tier: /order/<slug> */
export function intakePath(slug: TierSlug): string {
  return `/order/${slug}`;
}

/**
 * Builds the Shopify cart permalink with the intake_id stored as a cart
 * attribute. Square brackets are URL-encoded so framework parsers don't
 * reject them — Shopify accepts both encoded and literal forms.
 */
export function buildShopifyCheckoutUrl(slug: TierSlug, intakeId: string): string {
  const tier = TIERS[slug];
  const u = new URL(`https://checkout.luxmotionai.com/cart/${tier.variantId}:1`);
  u.searchParams.set("attributes[intake_id]", intakeId);
  return u.toString();
}

// ─── Dropdown options for the Full Spectrum intake form ───────────────────

export const INDUSTRY_OPTIONS = [
  { value: "fashion", label: "Fashion / Apparel" },
  { value: "beauty", label: "Beauty / Skincare" },
  { value: "tech", label: "Tech / Electronics" },
  { value: "food-beverage", label: "Food / Beverage" },
  { value: "fitness", label: "Fitness / Wellness" },
  { value: "home-goods", label: "Home Goods / Decor" },
  { value: "jewelry", label: "Jewelry / Accessories" },
  { value: "supplements", label: "Supplements / Health" },
  { value: "luxury", label: "Luxury / High-end" },
  { value: "other", label: "Other (specify below)" },
] as const;

export type IndustryValue = (typeof INDUSTRY_OPTIONS)[number]["value"];

export const REVENUE_RANGES = [
  { value: "<10k", label: "Under $10k / month" },
  { value: "10k-50k", label: "$10k–$50k / month" },
  { value: "50k-100k", label: "$50k–$100k / month" },
  { value: "100k-500k", label: "$100k–$500k / month" },
  { value: "500k+", label: "$500k+ / month" },
  { value: "private", label: "Prefer not to say" },
] as const;

export type RevenueRangeValue = (typeof REVENUE_RANGES)[number]["value"];

export const AD_SPEND_RANGES = [
  { value: "0", label: "$0 (not running ads yet)" },
  { value: "<1k", label: "Under $1k / month" },
  { value: "1k-5k", label: "$1k–$5k / month" },
  { value: "5k-20k", label: "$5k–$20k / month" },
  { value: "20k+", label: "$20k+ / month" },
  { value: "private", label: "Prefer not to say" },
] as const;

export type AdSpendRangeValue = (typeof AD_SPEND_RANGES)[number]["value"];

export const GROWTH_GOAL_OPTIONS = [
  { value: "followers", label: "Increase followers" },
  { value: "conversions", label: "Increase conversions" },
  { value: "launch", label: "Launch a new product" },
  { value: "expand", label: "Expand to a new market" },
  { value: "awareness", label: "Brand awareness" },
  { value: "other", label: "Other (specify below)" },
] as const;

export type GrowthGoalValue = (typeof GROWTH_GOAL_OPTIONS)[number]["value"];

export function isIndustryValue(v: unknown): v is IndustryValue {
  return INDUSTRY_OPTIONS.some((o) => o.value === v);
}
export function isRevenueRangeValue(v: unknown): v is RevenueRangeValue {
  return REVENUE_RANGES.some((o) => o.value === v);
}
export function isAdSpendRangeValue(v: unknown): v is AdSpendRangeValue {
  return AD_SPEND_RANGES.some((o) => o.value === v);
}
export function isGrowthGoalValue(v: unknown): v is GrowthGoalValue {
  return GROWTH_GOAL_OPTIONS.some((o) => o.value === v);
}
