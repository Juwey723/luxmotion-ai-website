// TODO: when luxmotionai.com DNS is wired up, flip this constant AND
// metadataBase in app/layout.tsx to "https://luxmotionai.com".
export const SITE_URL = "https://luxmotion-ai-website.vercel.app";

export const FIVERR_URL =
  "https://www.fiverr.com/luxmotionai/create-cinematic-ai-product-videos-and-ads-for-your-brand-ef2d";

// TODO: replace with real contact (mailto / Instagram) once available.
export const COMING_SOON_HREF = "#";

export const NAV_LINKS = [
  { label: "Services", href: "#services" },
  { label: "Portfolio", href: "#portfolio" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
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
    cta: { label: "Order from $30", href: FIVERR_URL, external: true },
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
  { src: "/portfolio/tennis-bracelet.mp4", label: "Tennis Bracelet" },
  { src: "/portfolio/cuban-chain.mp4", label: "Cuban Chain" },
  { src: "/portfolio/halo-earrings.mp4", label: "Halo Earrings" },
  { src: "/portfolio/tennis-chain.mp4", label: "Tennis Chain" },
  { src: "/portfolio/moissanite-stud.mp4", label: "Moissanite Stud" },
  { src: "/portfolio/heart-bracelet.mp4", label: "Heart Bracelet" },
  { src: "/portfolio/star-stud.mp4", label: "Star Stud" },
  { src: "/portfolio/infinity-cuban.mp4", label: "Infinity Cuban" },
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
  },
];

export const FAQS = [
  {
    q: "How do you make the videos?",
    a: "Using state-of-the-art AI motion generation paired with custom scripting tuned for luxury and e-commerce brands. Every output is licensed for commercial use — you own the final file outright.",
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
