"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const STRATEGY_CALL_MAILTO =
  "mailto:jawaduweyda2@gmail.com?subject=" +
  encodeURIComponent("Full Spectrum — strategy call");

export function FullSpectrumHero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(80% 60% at 50% 0%, rgba(201, 168, 96, 0.13) 0%, rgba(201, 168, 96, 0) 60%), linear-gradient(180deg, #070707 0%, #0a0a0a 100%)",
        }}
      />
      <div aria-hidden className="grain -z-10" />

      <div className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-24 pt-20 text-center md:pt-28 lg:px-10 lg:pb-28 lg:pt-36">
        <p className="mb-7 text-[11px] font-medium uppercase tracking-[0.42em] text-gold md:text-[12px]">
          — For brands ready to dominate —
        </p>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="font-heading text-gold-gradient text-balance text-[44px] leading-[1.02] tracking-tight sm:text-6xl md:text-[76px] lg:text-[92px]"
        >
          Your full-stack growth team.
          <br />
          Powered by AI.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="font-serif-italic mt-7 max-w-3xl text-balance text-2xl text-bone/85 md:text-3xl lg:text-[34px]"
        >
          Replace your $200k/year marketing hire with a 24/7 AI-orchestrated team —
          for less than 1/3 the cost.
        </motion.p>

        <p className="mt-7 max-w-2xl text-balance text-[15px] leading-relaxed text-muted-foreground md:text-base">
          Most brands hire a marketing manager, a content team, an ads agency, and
          a data analyst — paying $20k+ per month combined. LuxMotion AI Full
          Spectrum gives you all of it, AI-powered, fully managed, starting at
          $2,000/month. We orchestrate. AI executes. You scale.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href="#plans"
            className="inline-flex h-12 items-center justify-center rounded-full bg-gold px-7 text-[12px] font-semibold uppercase tracking-[0.22em] text-ink-deepest shadow-[0_8px_30px_-10px_rgba(201,168,96,0.55)] transition-all hover:-translate-y-px hover:bg-gold-light hover:shadow-[0_10px_40px_-10px_rgba(240,220,160,0.65)] sm:min-w-[200px]"
          >
            See plans
          </Link>
          <a
            href={STRATEGY_CALL_MAILTO}
            className="inline-flex h-12 items-center justify-center rounded-full border border-gold/40 bg-transparent px-7 text-[12px] font-semibold uppercase tracking-[0.22em] text-bone transition-all hover:border-gold hover:bg-gold/[0.06] sm:min-w-[200px]"
          >
            Book strategy call
          </a>
        </div>

        <ul className="mt-14 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[10.5px] font-medium uppercase tracking-[0.28em] text-muted-foreground md:text-[11px]">
          {[
            "Always-on production",
            "Performance-driven",
            "No contracts",
            "Cancel anytime",
          ].map((item, i) => (
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
    </section>
  );
}
