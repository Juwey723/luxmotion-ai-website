// TODO: when luxmotionai.com DNS is wired up, flip this constant AND
// metadataBase in app/layout.tsx to "https://luxmotionai.com".
export const SITE_URL = "https://luxmotion-ai-website.vercel.app";

// Shopify checkout URLs — direct add-to-cart links per pricing tier.
// Each opens Shopify checkout with the tier's variant pre-loaded.
export const ORDER_URL_BASIC =
  "https://checkout.luxmotionai.com/cart/48568804835545:1";
export const ORDER_URL_STANDARD =
  "https://checkout.luxmotionai.com/cart/48568806047961:1";
export const ORDER_URL_PREMIUM =
  "https://checkout.luxmotionai.com/cart/48568807096537:1";

// Generic "Order Now" CTAs (nav, hero, single-service card, final CTA)
// all point at Basic — entry price draws the click; buyers can upsell on the cart page.
export const ORDER_URL_DEFAULT = ORDER_URL_BASIC;

// TODO: replace with real contact (mailto / Instagram) once available.
export const COMING_SOON_HREF = "#";

// Anchor links use absolute "/" prefix so they work from non-home routes (e.g. /sample).
export const NAV_LINKS = [
  { label: "Services", href: "/#services" },
  { label: "Portfolio", href: "/#portfolio" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
] as const;

export type Service = {
  n: string;
  title: string;
  blurb: string;
  priceFrom: number;
  cta: { label: string; href: string; external: boolean };
  badge: string | null;
};

export const SERVICES: readonly Service[] = [
  {
    n: "01",
    title: "Hyper Motion Ads",
    blurb:
      "Cinematic product videos with hyper-realistic motion. 10–15 seconds, 1080P, 24-hour delivery.",
    priceFrom: 30,
    cta: { label: "Order from $30", href: ORDER_URL_BASIC, external: true },
    badge: null,
  },
  {
    n: "02",
    title: "AI UGC Creator Ads",
    blurb:
      "Human-looking AI creator filming your product, TikTok/Reels native format.",
    priceFrom: 75,
    // TODO: wire to real contact channel
    cta: {
      label: "Coming soon — DM us",
      href: COMING_SOON_HREF,
      external: false,
    },
    badge: "MOST POPULAR",
  },
  {
    n: "03",
    title: "AI Product Photography",
    blurb:
      "Editorial-grade AI product stills, hero shots and lifestyle variations.",
    priceFrom: 25,
    // TODO: wire to real contact channel
    cta: {
      label: "Coming soon — DM us",
      href: COMING_SOON_HREF,
      external: false,
    },
    badge: null,
  },
];

export const PORTFOLIO = [
  { src: "/portfolio/airpods.mp4", label: "AirPods Pro 2" },
  { src: "/portfolio/water.mp4", label: "Liquid Death" },
  { src: "/portfolio/soda.mp4", label: "Olipop Soda" },
  { src: "/portfolio/sneaker.mp4", label: "Allbirds Sneaker" },
  { src: "/portfolio/mattress.mp4", label: "Casper Mattress" },
  { src: "/portfolio/keyboard.mp4", label: "Ducky Keyboard" },
] as const;

export const STEPS = [
  {
    title: "Send your product link",
    body: "Just the URL and a sentence about your brand.",
  },
  {
    title: "We produce",
    body: "Custom script, cinematic motion, brand-matched aesthetic.",
  },
  {
    title: "You review",
    body: "Approve or send feedback. Revisions included at every tier.",
  },
  {
    title: "You ship",
    body: "MP4 delivered in 24 hours, licensed for commercial use.",
  },
] as const;

export type PricingTier = {
  tier: "Basic" | "Standard" | "Premium";
  name: string;
  price: number;
  features: readonly string[];
  popular: boolean;
  cartUrl: string;
};

export const PRICING: readonly PricingTier[] = [
  {
    tier: "Basic",
    name: "10-Second Hyper Motion Ad",
    price: 30,
    features: [
      "One 10-second video",
      "1080P resolution",
      "1 revision",
      "24-hour delivery",
      "Commercial use license",
    ],
    popular: false,
    cartUrl: ORDER_URL_BASIC,
  },
  {
    tier: "Standard",
    name: "15-Second Hyper Motion Ad",
    price: 60,
    features: [
      "One 15-second video",
      "1080P resolution",
      "2 revisions",
      "24-hour delivery",
      "Commercial use license",
    ],
    popular: true,
    cartUrl: ORDER_URL_STANDARD,
  },
  {
    tier: "Premium",
    name: "Multi-Video Package",
    price: 90,
    features: [
      "Three 10-second OR two 15-second videos",
      "1080P resolution",
      "3 revisions",
      "12-hour delivery",
      "Commercial use license",
    ],
    popular: false,
    cartUrl: ORDER_URL_PREMIUM,
  },
];

export const FAQS = [
  {
    q: "How do you make the videos?",
    a: "Using state-of-the-art AI motion generation paired with custom scripting tuned for luxury and e-commerce brands. Every output is licensed for commercial use — you own the final file outright.",
  },
  {
    q: "How do I pay?",
    a: "All orders are processed securely through Shopify checkout — credit card, Apple Pay, Google Pay, Shop Pay accepted. Once payment is complete, you'll receive a confirmation email and we'll start production within hours.",
  },
  {
    q: "Can you edit footage I already have?",
    a: "Not via our standard service — we generate new videos from your product link. If you need edits to existing footage, reach out before ordering.",
  },
  {
    q: "What kinds of products work best?",
    a: "Any physical product. We've produced videos for jewelry, fashion, skincare, accessories, home goods, tech, food and beverage. If you have a product, we can make it look cinematic.",
  },
] as const;

export const HERO_STRIP = [
  "1080P RESOLUTION",
  "24-HOUR DELIVERY",
  "HYPER MOTION",
  "COMMERCIAL USE LICENSED",
] as const;
