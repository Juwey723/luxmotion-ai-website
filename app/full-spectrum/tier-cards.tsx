import Link from "next/link";
import { FadeIn } from "@/components/site/fade-in";
import { SectionHeader } from "@/components/site/services";
import { FULL_SPECTRUM_TIERS, intakePath, type Tier } from "@/lib/tiers";
import { cn } from "@/lib/utils";

const FOR_LINE: Record<string, string> = {
  "full-spectrum-growth": "Early DTC brands ready to systematize content + ads.",
  "full-spectrum-scale":
    "Brands hitting $50k/mo+ ready to multiply through paid + organic.",
  "full-spectrum-dominate":
    "Established brands aiming for category leadership.",
};

export function FullSpectrumTierCards() {
  return (
    <FadeIn id="plans" className="scroll-mt-nav border-t border-border/60">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
        <SectionHeader
          kicker="The Offer"
          title="Three plans. Pick where you are right now."
        />

        <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-3">
          {FULL_SPECTRUM_TIERS.map((t) => (
            <BigTierCard key={t.slug} tier={t} />
          ))}
        </div>

        <p className="mt-12 text-center text-xs uppercase tracking-[0.22em] text-muted-foreground">
          Cancel anytime · No contracts · We earn your business every month
        </p>
      </div>
    </FadeIn>
  );
}

function BigTierCard({ tier }: { tier: Tier }) {
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
          Monthly
        </span>
      </div>

      <p className="mt-3 text-[12.5px] leading-snug text-bone/85">
        <span className="text-muted-foreground">For:</span>{" "}
        {FOR_LINE[tier.slug] ?? ""}
      </p>

      <div className="mt-6 flex items-baseline gap-2">
        <span className="font-heading text-5xl text-gold-gradient lg:text-[64px]">
          ${tier.price.toLocaleString()}
        </span>
        <span className="font-heading text-2xl text-gold-gradient">
          /mo
        </span>
      </div>

      <ul className="mt-7 flex flex-col gap-2.5 text-[13.5px] text-bone/85">
        {tier.features.map((f) => {
          const isHeader = f.startsWith("Everything in");
          return (
            <li
              key={f}
              className={cn(
                "flex items-start gap-3",
                isHeader && "mt-3 mb-1 text-[12px] uppercase tracking-[0.22em] text-gold-light",
              )}
            >
              {!isHeader && (
                <span
                  aria-hidden
                  className="mt-[7px] inline-block h-[5px] w-[5px] flex-none rounded-full bg-gold"
                />
              )}
              <span>{f}</span>
            </li>
          );
        })}
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
        Start {tier.shortName} — ${tier.price.toLocaleString()}/mo
      </Link>
    </div>
  );
}
