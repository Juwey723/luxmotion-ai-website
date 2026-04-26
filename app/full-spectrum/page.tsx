import type { Metadata } from "next";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { FullSpectrumHero } from "./hero";
import { FullSpectrumPillars } from "./pillars";
import { FullSpectrumTierCards } from "./tier-cards";
import { FullSpectrumComparisonTable } from "./comparison-table";
import { FullSpectrumHowItWorks } from "./how-it-works";
import { FullSpectrumWhyThisWorks } from "./why-this-works";
import { FullSpectrumFAQ } from "./faq";
import { FullSpectrumFinalCTA } from "./final-cta";

export const metadata: Metadata = {
  title: "Full Spectrum Marketing — Your AI Growth Team, End to End",
  description:
    "Replace your $200k/year marketing hire with a 24/7 AI-orchestrated team — for less than 1/3 the cost. From $2,000/mo. We orchestrate. AI executes. You scale.",
  openGraph: {
    title: "LuxMotion AI Full Spectrum — Your AI Growth Team",
    description:
      "Cinematic video production, multi-platform posting, paid ads, landing pages, email, SEO, influencer partnerships — all AI-orchestrated, fully managed.",
    type: "website",
  },
};

export default function FullSpectrumPage() {
  return (
    <>
      <SiteNav />
      <main>
        <FullSpectrumHero />
        <FullSpectrumPillars />
        <FullSpectrumTierCards />
        <FullSpectrumComparisonTable />
        <FullSpectrumHowItWorks />
        <FullSpectrumWhyThisWorks />
        <FullSpectrumFAQ />
        <FullSpectrumFinalCTA />
      </main>
      <SiteFooter />
    </>
  );
}
