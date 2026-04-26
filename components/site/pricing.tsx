import Link from "next/link";
import { FadeIn } from "@/components/site/fade-in";
import { SectionHeader } from "@/components/site/services";
import { BUNDLE_TIERS, intakePath, SINGLE_TIERS, type Tier } from "@/lib/tiers";
import { cn } from "@/lib/utils";

export function Pricing() {
  return (
    <FadeIn id="pricing" className="scroll-mt-nav border-t border-border/60">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
        {/* Section A — Single-shot videos */}
        <SectionHeader
          kicker="Single Videos"
          title="Three tiers. Same cinematic standard."
        />

        <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-3">
          {SINGLE_TIERS.map((t) => (
            <TierCard key={t.slug} tier={t} />
          ))}
        </div>

        {/* Section B — Bundles & recurring service */}
        <div className="mt-24 lg:mt-32">
          <SectionHeader
            kicker="Bundles & Services"
            title="Higher-volume options."
          />

          <div className="mx-auto mt-14 grid max-w-5xl items-stretch gap-6 lg:grid-cols-2">
            {BUNDLE_TIERS.map((t) => (
              <TierCard key={t.slug} tier={t} />
            ))}
          </div>
        </div>

        <p className="mt-12 text-center text-xs uppercase tracking-[0.22em] text-muted-foreground">
          Secure Shopify checkout · 100% commercial-use license
        </p>
      </div>
    </FadeIn>
  );
}

function TierCard({ tier }: { tier: Tier }) {
  const isRecurring = tier.priceSuffix === "/mo";
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl border bg-card p-7 transition-colors lg:p-9",
        tier.popular
          ? "border-gold/55 ring-1 ring-gold/35 lg:scale-[1.015]"
          : "border-border hover:border-gold/40",
      )}
    >
      {tier.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-gold/55 bg-ink-deepest px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-gold-light">
          Most Popular
        </span>
      )}

      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          {tier.shortName}
        </span>
        <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-gold-dim">
          {tier.tagline}
        </span>
      </div>

      <h3 className="mt-4 font-heading text-2xl leading-snug text-bone lg:text-[26px]">
        {tier.label.replace(`${tier.shortName} — `, "")}
      </h3>

      <div className="mt-6 flex items-baseline gap-2">
        <span className="font-heading text-5xl text-gold-gradient lg:text-6xl">
          ${tier.price}
        </span>
        {tier.priceSuffix && (
          <span className="font-heading text-2xl text-gold-gradient">
            {tier.priceSuffix}
          </span>
        )}
        <span className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
          {isRecurring ? "recurring" : "flat"}
        </span>
      </div>

      <ul className="mt-7 flex flex-col gap-3 text-sm text-bone/85">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-3">
            <span
              aria-hidden
              className="mt-[7px] inline-block h-[5px] w-[5px] flex-none rounded-full bg-gold"
            />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <Link
        href={intakePath(tier.slug)}
        className={cn(
          "mt-9 inline-flex h-12 items-center justify-center rounded-full px-6 text-[12px] font-semibold uppercase tracking-[0.22em] transition-all",
          tier.popular
            ? "bg-gold text-ink-deepest hover:bg-gold-light hover:shadow-[0_8px_30px_-10px_rgba(240,220,160,0.55)]"
            : "border border-gold/40 text-bone hover:border-gold hover:bg-gold/[0.06]",
        )}
      >
        {isRecurring ? `Subscribe — ${tier.shortName}` : `Order ${tier.shortName}`}
      </Link>
    </div>
  );
}
