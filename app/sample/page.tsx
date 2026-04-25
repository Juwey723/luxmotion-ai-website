import type { Metadata } from "next";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { SampleClient } from "./sample-client";

export const metadata: Metadata = {
  title: "Free 5-Second AI Sample",
  description:
    "Drop your product link, get a 5-second cinematic AI sample in under a minute. No credit card.",
  openGraph: {
    title: "Free 5-Second AI Sample · LuxMotion AI",
    description:
      "Drop your product link, get a 5-second cinematic AI sample in under a minute. No credit card.",
    type: "website",
  },
};

export default function SamplePage() {
  return (
    <>
      <SiteNav />
      <main>
        <SampleClient />
      </main>
      <SiteFooter />
    </>
  );
}
