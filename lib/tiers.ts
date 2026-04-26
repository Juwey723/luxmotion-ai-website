// Single source of truth for the 5 paid tiers. Read by:
//   - components/site/pricing.tsx (renders the two pricing sections)
//   - app/order/[tier]/page.tsx (loads tier metadata for the intake form)
//   - app/api/order-intake/route.ts (validates tier, builds Shopify checkout URL)
//   - app/layout.tsx (JSON-LD Service offers)
//   - lib/emails.ts (tier mini-row in fulfillment email)

export type TierSlug =
  | "basic"
  | "standard"
  | "premium"
  | "content-pack"
  | "managed-social";

export type TierKind = "single" | "bundle";

export interface Tier {
  slug: TierSlug;
  /** Long label used on intake page header — "Basic — 10s Hyper Motion Ad" */
  label: string;
  /** Short label for buttons + emails — "Basic" */
  shortName: string;
  price: number;
  /** "" for one-time, "/mo" for the recurring service */
  priceSuffix: string;
  /** Shopify variant ID for the checkout cart permalink */
  variantId: string;
  /** Human-readable delivery window — "24 hours", "Monthly", etc. */
  delivery: string;
  /** Bullet list shown on the pricing card */
  features: readonly string[];
  /** Marks the "Most Popular" pricing card */
  popular: boolean;
  /** Visual section: single-shot video vs bundle/recurring */
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
};

export const TIER_SLUGS = Object.keys(TIERS) as TierSlug[];

export const SINGLE_TIERS: readonly Tier[] = TIER_SLUGS.filter(
  (s) => TIERS[s].kind === "single",
).map((s) => TIERS[s]);

export const BUNDLE_TIERS: readonly Tier[] = TIER_SLUGS.filter(
  (s) => TIERS[s].kind === "bundle",
).map((s) => TIERS[s]);

export function isTierSlug(value: string): value is TierSlug {
  return value in TIERS;
}

/**
 * Public intake-page path for a tier: /order/<slug>
 * This is what marketing CTAs link to (Nav, Hero, Final CTA, pricing cards, etc.).
 * The customer fills the intake form on this page; the form POSTs to /api/order-intake
 * which generates the Shopify checkout URL with the intake_id baked in.
 */
export function intakePath(slug: TierSlug): string {
  return `/order/${slug}`;
}

/**
 * Builds the Shopify cart permalink with the intake_id stored as a cart attribute.
 * Cart attributes flow through to the Order's `note_attributes` once the customer
 * pays, which is how /api/order-paid recovers the link to our intake record.
 *
 * Square brackets are URL-encoded (%5B / %5D) so framework parsers don't reject
 * them — Shopify accepts both encoded and literal forms.
 */
export function buildShopifyCheckoutUrl(slug: TierSlug, intakeId: string): string {
  const tier = TIERS[slug];
  const u = new URL(`https://checkout.luxmotionai.com/cart/${tier.variantId}:1`);
  u.searchParams.set("attributes[intake_id]", intakeId);
  return u.toString();
}
