import type { Metadata } from "next";
import { Gloock, Instrument_Serif, Outfit } from "next/font/google";
import "./globals.css";

const gloock = Gloock({
  variable: "--font-gloock",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
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
  metadataBase: new URL("https://luxmotionai.com"),
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
  },
  twitter: {
    card: "summary_large_image",
    title: "LuxMotion AI — Cinematic AI Product Videos for Brands",
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${gloock.variable} ${instrumentSerifItalic.variable} ${outfit.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
