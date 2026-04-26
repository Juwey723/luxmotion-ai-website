import Link from "next/link";
import { FadeIn } from "@/components/site/fade-in";
import { SectionHeader } from "@/components/site/services";
import {
  BUNDLE_TIERS,
  intakePath,
  SINGLE_TIERS,
  type Tier,
} from "@/lib/tiers";
import { cn } from "@/lib/utils";

// One unified pricing section with all 5 tiers in a single 6-column grid:
//
//   row 1 (lg):  [Basic 1-2] [Standard 3-4] [Premium 5-6]
//   row 2 (lg):              [Content Pack 2-3] [Managed Social 4-5]
//
// Bottom row is centered with empty col-1 and col-6, so it reads as a natural
// extension of the top row at the same visual altitude rather than a separate
// "section". Mobile collapses to a single stack.
const BOTTOM_ROW_START = ["lg:col-start-2", "lg:col-start-4"] as const;

export function Pricing() {
  return (
    <FadeIn id="pricing" className="scroll-mt-nav border-t border-border/60">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
        <SectionHeader
          kicker="Pricing"
          title="Five ways to put your brand on screen."
        />

        <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-6">
          {SINGLE_TIERS.map((t) => (
            <TierCard key={t.slug} tier={t} className="lg:col-span-2" />
          ))}
          {BUNDLE_TIERS.map((t, i) => (
            <TierCard
              key={t.slug}
              tier={t}
              className={cn("lg:col-span-2", BOTTOM_ROW_START[i])}
            />
          ))}
        </div>

        <p className="mt-12 text-center text-xs uppercase tracking-[0.22em] text-muted-foreground">
          Secure Shopify checkout · 100% commercial-use license
        </p>
      </div>
    </FadeIn>
  );
}

function TierCard({ tier, className }: { tier: Tier; className?: string }) {
  const isRecurring = tier.priceSuffix === "/mo";
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl border bg-card p-7 transition-colors lg:p-9",
        tier.popular
          ? "border-gold/55 ring-1 ring-gold/35 lg:scale-[1.015]"
          : "border-border hover:border-gold/40",
        className,
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
