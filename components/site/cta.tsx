import Link from "next/link";
import { FadeIn } from "@/components/site/fade-in";

export function FinalCTA() {
  return (
    <FadeIn className="relative overflow-hidden border-t border-border/60">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 80% at 50% 50%, rgba(201, 168, 96, 0.13) 0%, rgba(201, 168, 96, 0) 70%), #070707",
        }}
      />
      <div aria-hidden className="grain -z-10" />

      <div className="mx-auto flex max-w-4xl flex-col items-center px-6 py-28 text-center lg:px-10 lg:py-36">
        <h2 className="font-heading text-gold-gradient text-balance text-4xl leading-[1.04] tracking-tight md:text-6xl lg:text-[76px]">
          Your next scroll-stopping ad,
          <br />
          by tomorrow.
        </h2>
        <p className="mt-7 max-w-xl text-balance text-base leading-relaxed text-muted-foreground md:text-lg">
          Tell us about your product, pay through secure Shopify checkout, and
          your finished video lands in your inbox within 24 hours.
        </p>
        <Link
          href="/order/basic"
          className="mt-10 inline-flex h-14 items-center justify-center rounded-full bg-gold px-9 text-[13px] font-semibold uppercase tracking-[0.26em] text-ink-deepest shadow-[0_12px_40px_-10px_rgba(201,168,96,0.6)] transition-all hover:-translate-y-px hover:bg-gold-light hover:shadow-[0_16px_50px_-10px_rgba(240,220,160,0.7)]"
        >
          Order Now
        </Link>
      </div>
    </FadeIn>
  );
}
