import type { Metadata } from "next";
import { Gloock, Instrument_Serif, Outfit } from "next/font/google";
import "./globals.css";
import { FAQS, FIVERR_URL, PRICING, SITE_URL } from "@/lib/constants";

// Gloock is the LCP-critical font (hero h1). preload + swap is already
// next/font's default — stating both explicitly so it's not silently
// regressed by a future edit.
const gloock = Gloock({
  variable: "--font-gloock",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  preload: true,
});

const instrumentSerifItalic = Instrument_Serif({
  variable: "--font-instrument-italic",
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const SITE_DESCRIPTION =
  "LuxMotion AI produces scroll-stopping product videos for any brand — e-commerce stores, physical shops, service companies, creators. 1080P, hyper-realistic motion, 24-hour delivery. All we need is your product link.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "LuxMotion AI — Cinematic AI Product Videos for Brands",
    template: "%s · LuxMotion AI",
  },
  description: SITE_DESCRIPTION,
  applicationName: "LuxMotion AI",
  keywords: [
    "cinematic AI ad studio",
    "AI product video",
    "luxury ad",
    "hyper motion",
    "brand video",
    "AI UGC",
    "AI product photography",
    "Fiverr",
  ],
  openGraph: {
    title: "LuxMotion AI — Cinematic AI Product Videos for Brands",
    description: SITE_DESCRIPTION,
    siteName: "LuxMotion AI",
    type: "website",
    locale: "en_US",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "LuxMotion AI — Cinematic AI Product Videos for Brands",
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

const orgLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "LuxMotion AI",
  url: SITE_URL,
  logo: `${SITE_URL}/icon.svg`,
  description: SITE_DESCRIPTION,
  sameAs: [FIVERR_URL],
};

const serviceLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Cinematic AI product video production",
  name: "LuxMotion AI Hyper Motion Ads",
  provider: { "@type": "Organization", name: "LuxMotion AI", url: SITE_URL },
  areaServed: "Worldwide",
  description: SITE_DESCRIPTION,
  offers: PRICING.map((p) => ({
    "@type": "Offer",
    name: p.name,
    price: String(p.price),
    priceCurrency: "USD",
    url: FIVERR_URL,
    availability: "https://schema.org/InStock",
  })),
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${gloock.variable} ${instrumentSerifItalic.variable} ${outfit.variable}`}
    >
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([orgLd, serviceLd, faqLd]),
          }}
        />
      </body>
    </html>
  );
}
