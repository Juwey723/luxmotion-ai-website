import { FadeIn } from "@/components/site/fade-in";
import { FIVERR_URL } from "@/lib/constants";

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
          Place an order through our Fiverr gig — secure payment, 24-hour
          turnaround, fully licensed output.
        </p>
        <a
          href={FIVERR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-10 inline-flex h-14 items-center justify-center rounded-full bg-gold px-9 text-[13px] font-semibold uppercase tracking-[0.26em] text-ink-deepest shadow-[0_12px_40px_-10px_rgba(201,168,96,0.6)] transition-all hover:-translate-y-px hover:bg-gold-light hover:shadow-[0_16px_50px_-10px_rgba(240,220,160,0.7)]"
        >
          Order on Fiverr
        </a>
      </div>
    </FadeIn>
  );
}
