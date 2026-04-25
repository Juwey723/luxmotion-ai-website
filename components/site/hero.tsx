import Link from "next/link";
import { HERO_STRIP, ORDER_URL_DEFAULT } from "@/lib/constants";
import { FadeIn } from "@/components/site/fade-in";

export function Hero() {
  return (
    <FadeIn id="top" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(80% 60% at 50% 0%, rgba(201, 168, 96, 0.10) 0%, rgba(201, 168, 96, 0) 60%), linear-gradient(180deg, #070707 0%, #0a0a0a 100%)",
        }}
      />
      <div aria-hidden className="grain -z-10" />

      <div className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-24 pt-20 text-center md:pt-28 lg:px-10 lg:pb-32 lg:pt-36">
        <p className="mb-7 text-[11px] font-medium uppercase tracking-[0.42em] text-gold md:text-[12px]">
          — Cinematic AI Ad Studio —
        </p>

        <h1 className="font-heading text-gold-gradient text-balance text-[44px] leading-[1.02] tracking-tight sm:text-6xl md:text-[76px] lg:text-[88px]">
          Stop scrolling past
          <br />
          your own products.
        </h1>

        <p className="font-serif-italic mt-7 text-2xl text-bone/85 md:text-3xl lg:text-[34px]">
          Cinematic product videos, generated in minutes.
        </p>

        <p className="mt-7 max-w-2xl text-balance text-[15px] leading-relaxed text-muted-foreground md:text-base">
          LuxMotion AI produces scroll-stopping product videos for any brand —
          e-commerce stores, physical shops, service companies, creators. 1080P,
          hyper-realistic motion, 24-hour delivery. All we need is your product
          link.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          <a
            href={ORDER_URL_DEFAULT}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center rounded-full bg-gold px-7 text-[12px] font-semibold uppercase tracking-[0.22em] text-ink-deepest shadow-[0_8px_30px_-10px_rgba(201,168,96,0.55)] transition-all hover:-translate-y-px hover:bg-gold-light hover:shadow-[0_10px_40px_-10px_rgba(240,220,160,0.65)] sm:min-w-[200px]"
          >
            Order from $30
          </a>
          <Link
            href="#portfolio"
            className="inline-flex h-12 items-center justify-center rounded-full border border-gold/40 bg-transparent px-7 text-[12px] font-semibold uppercase tracking-[0.22em] text-bone transition-all hover:border-gold hover:bg-gold/[0.06] sm:min-w-[200px]"
          >
            See the work
          </Link>
        </div>

        <ul className="mt-14 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[10.5px] font-medium uppercase tracking-[0.28em] text-muted-foreground md:text-[11px]">
          {HERO_STRIP.map((item, i) => (
            <li key={item} className="flex items-center gap-x-6">
              {i > 0 && (
                <span aria-hidden className="hidden text-gold-dim md:inline">
                  ·
                </span>
              )}
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </FadeIn>
  );
}
