import { SiteNav } from "@/components/site/nav";
import { Hero } from "@/components/site/hero";
import { Services } from "@/components/site/services";
import { Portfolio } from "@/components/site/portfolio";
import { How } from "@/components/site/how";
import { Pricing } from "@/components/site/pricing";
import { FullSpectrumTeaser } from "@/components/site/full-spectrum-teaser";
import { FAQ } from "@/components/site/faq";
import { FinalCTA } from "@/components/site/cta";
import { SiteFooter } from "@/components/site/footer";

export default function Home() {
  return (
    <>
      <SiteNav />
      <main>
        <Hero />
        <Services />
        <Portfolio />
        <How />
        <Pricing />
        <FullSpectrumTeaser />
        <FAQ />
        <FinalCTA />
      </main>
      <SiteFooter />
    </>
  );
}
