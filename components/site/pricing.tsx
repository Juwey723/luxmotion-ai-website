import { FadeIn } from "@/components/site/fade-in";
import { SectionHeader } from "@/components/site/services";
import { PRICING } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Pricing() {
  return (
    <FadeIn id="pricing" className="scroll-mt-nav border-t border-border/60">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
        <SectionHeader
          kicker="Pricing"
          title="Three tiers. Same cinematic standard."
        />

        <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-3">
          {PRICING.map((p) => (
            <div
              key={p.tier}
              className={cn(
                "relative flex flex-col rounded-xl border bg-card p-7 transition-colors lg:p-9",
                p.popular
                  ? "border-gold/55 ring-1 ring-gold/35 lg:scale-[1.015]"
                  : "border-border hover:border-gold/40",
              )}
            >
              {p.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-gold/55 bg-ink-deepest px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-gold-light">
                  Most Popular
                </span>
              )}

              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  {p.tier}
                </span>
                <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-gold-dim">
                  {p.tier === "Premium" ? "Multi-video" : "Single video"}
                </span>
              </div>

              <h3 className="mt-4 font-heading text-2xl leading-snug text-bone lg:text-[26px]">
                {p.name}
              </h3>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-heading text-5xl text-gold-gradient lg:text-6xl">
                  ${p.price}
                </span>
                <span className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  flat
                </span>
              </div>

              <ul className="mt-7 flex flex-col gap-3 text-sm text-bone/85">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className="mt-[7px] inline-block h-[5px] w-[5px] flex-none rounded-full bg-gold"
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href={p.cartUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "mt-9 inline-flex h-12 items-center justify-center rounded-full px-6 text-[12px] font-semibold uppercase tracking-[0.22em] transition-all",
                  p.popular
                    ? "bg-gold text-ink-deepest hover:bg-gold-light hover:shadow-[0_8px_30px_-10px_rgba(240,220,160,0.55)]"
                    : "border border-gold/40 text-bone hover:border-gold hover:bg-gold/[0.06]",
                )}
              >
                Order {p.tier}
              </a>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs uppercase tracking-[0.22em] text-muted-foreground">
          Secure Shopify checkout · 100% commercial-use license
        </p>
      </div>
    </FadeIn>
  );
}
