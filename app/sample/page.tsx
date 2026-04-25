import type { Metadata } from "next";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { SampleForm } from "./sample-form";

export const metadata: Metadata = {
  title: "Free 5-Second AI Sample",
  description:
    "Drop your product link, get a custom 5-second cinematic AI sample emailed to you in ~30 minutes. Real Higgsfield-quality output. Same pipeline our paid clients get.",
  openGraph: {
    title: "Free 5-Second AI Sample · LuxMotion AI",
    description:
      "Drop your product link, get a custom 5-second cinematic AI sample emailed to you in ~30 minutes.",
    type: "website",
  },
};

export default function SamplePage() {
  return (
    <>
      <SiteNav />
      <main>
        <SampleForm />
      </main>
      <SiteFooter />
    </>
  );
}
