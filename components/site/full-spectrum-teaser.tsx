import Link from "next/link";
import { FadeIn } from "@/components/site/fade-in";

export function FullSpectrumTeaser() {
  return (
    <FadeIn className="border-t border-border/60">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-24">
        <div
          className="relative overflow-hidden rounded-2xl border border-gold/45 bg-card p-8 text-center shadow-[0_30px_80px_-30px_rgba(201,168,96,0.45)] lg:p-14"
          style={{
            background:
              "radial-gradient(70% 100% at 50% 0%, rgba(201, 168, 96, 0.10) 0%, rgba(201, 168, 96, 0) 70%), #0e0e0e",
          }}
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.42em] text-gold md:text-[12px]">
            — Full Spectrum Marketing —
          </p>

          <h2 className="font-heading text-gold-gradient text-balance mt-5 text-3xl leading-[1.05] tracking-tight md:text-5xl lg:text-[60px]">
            Ready to dominate?
          </h2>

          <p className="font-serif-italic mt-5 max-w-2xl mx-auto text-balance text-xl text-bone/85 md:text-2xl">
            Your AI growth team, end to end. From $2,000/mo.
          </p>

          <p className="mt-6 max-w-xl mx-auto text-balance text-[14.5px] leading-relaxed text-muted-foreground md:text-base">
            Cinematic video at scale, multi-platform posting, paid ads, landing
            pages, email, SEO, influencer partnerships — all AI-orchestrated,
            fully managed. We orchestrate. AI executes. You scale.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <Link
              href="/full-spectrum"
              className="inline-flex h-12 items-center justify-center rounded-full bg-gold px-8 text-[12px] font-semibold uppercase tracking-[0.22em] text-ink-deepest shadow-[0_8px_30px_-10px_rgba(201,168,96,0.55)] transition-all hover:-translate-y-px hover:bg-gold-light hover:shadow-[0_10px_40px_-10px_rgba(240,220,160,0.65)]"
            >
              Explore Full Spectrum →
            </Link>
            <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Growth · Scale · Dominate · $2k–$5k / mo
            </span>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}
