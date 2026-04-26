// TODO: when luxmotionai.com DNS is wired up, flip this constant AND
// metadataBase in app/layout.tsx to "https://luxmotionai.com".
export const SITE_URL = "https://luxmotion-ai-website.vercel.app";

// Pricing tier data has moved to lib/tiers.ts (single source of truth for the
// 5 tiers + Shopify variant IDs + intake-form metadata).

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
    // Internal route now — customer fills the intake form before checkout.
    cta: { label: "Order from $30", href: "/order/basic", external: false },
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
