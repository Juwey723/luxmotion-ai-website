import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";

export const metadata: Metadata = {
  title: "Thanks — your order is in production",
  description:
    "Your LuxMotion AI order is in production. You'll receive your finished video by email shortly.",
  // Don't index this page — only customers should see it post-purchase.
  robots: { index: false, follow: false },
};

export default function ThankYouPage() {
  return (
    <>
      <SiteNav />
      <main>
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(80% 60% at 50% 0%, rgba(201, 168, 96, 0.13) 0%, rgba(201, 168, 96, 0) 60%), linear-gradient(180deg, #070707 0%, #0a0a0a 100%)",
            }}
          />
          <div aria-hidden className="grain -z-10" />

          <div className="mx-auto flex max-w-3xl flex-col items-center px-6 pb-32 pt-20 text-center md:pt-28 lg:px-10 lg:pt-32">
            <p className="mb-7 text-[11px] font-medium uppercase tracking-[0.42em] text-gold md:text-[12px]">
              — Order Received —
            </p>

            <h1 className="font-heading text-gold-gradient text-balance text-[44px] leading-[1.02] tracking-tight sm:text-6xl md:text-[76px] lg:text-[88px]">
              Thanks!
            </h1>

            <p className="font-serif-italic mt-7 text-2xl text-bone/85 md:text-3xl">
              We've got it. We're producing your video now.
            </p>

            <p className="mt-7 max-w-xl text-balance text-[15px] leading-relaxed text-muted-foreground md:text-base">
              You'll get an email with the finished video at the address you
              provided. Single videos and Premium packs deliver within 24 hours;
              Content Packs within 48. Check your spam folder if it doesn't
              arrive.
            </p>

            <div className="mt-12 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/#portfolio"
                className="inline-flex h-12 items-center justify-center rounded-full border border-gold/40 bg-transparent px-7 text-[12px] font-semibold uppercase tracking-[0.22em] text-bone transition-all hover:border-gold hover:bg-gold/[0.06]"
              >
                Browse the portfolio
              </Link>
              <Link
                href="/"
                className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-gold"
              >
                Back to home
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
