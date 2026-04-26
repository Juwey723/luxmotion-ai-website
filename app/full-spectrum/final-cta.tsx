import Link from "next/link";
import { FadeIn } from "@/components/site/fade-in";

const STRATEGY_CALL_MAILTO =
  "mailto:jawaduweyda2@gmail.com?subject=" +
  encodeURIComponent("Full Spectrum — strategy call");

export function FullSpectrumFinalCTA() {
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
          Stop hiring.
          <br />
          Start dominating.
        </h2>
        <p className="mt-7 max-w-xl text-balance text-base leading-relaxed text-muted-foreground md:text-lg">
          Talk to us — we&apos;ll show you exactly what 90 days looks like for your
          brand. No deck, no pitch, no fluff. Just a sharp plan you can use even
          if you don&apos;t hire us.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          <a
            href={STRATEGY_CALL_MAILTO}
            className="inline-flex h-14 items-center justify-center rounded-full bg-gold px-9 text-[13px] font-semibold uppercase tracking-[0.26em] text-ink-deepest shadow-[0_12px_40px_-10px_rgba(201,168,96,0.6)] transition-all hover:-translate-y-px hover:bg-gold-light hover:shadow-[0_16px_50px_-10px_rgba(240,220,160,0.7)]"
          >
            Book strategy call
          </a>
          <Link
            href="/order/full-spectrum-growth"
            className="inline-flex h-14 items-center justify-center rounded-full border border-gold/45 bg-transparent px-9 text-[13px] font-semibold uppercase tracking-[0.26em] text-bone transition-all hover:border-gold hover:bg-gold/[0.06]"
          >
            Start Growth →
          </Link>
        </div>
      </div>
    </FadeIn>
  );
}
