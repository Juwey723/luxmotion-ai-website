import { FadeIn } from "@/components/site/fade-in";
import { SectionHeader } from "@/components/site/services";

const COLS = [
  {
    stat: "80% lower",
    label: "Cost vs. agencies",
    body: "Most agencies charge $5,000–$15,000/month for a fraction of this scope. We can offer this because AI handles 80% of production — we orchestrate, AI executes.",
  },
  {
    stat: "24 / 7",
    label: "Always-on",
    body: "AI doesn't sleep. While your competitors' creative team is offline, we're producing. Iteration loops are 10× faster than human teams.",
  },
  {
    stat: "0 hours",
    label: "Billed",
    body: "We don't bill by the hour. We deliver outcomes — videos shipped, ads optimized, conversions measured. Cancel anytime — we earn your business every month.",
  },
] as const;

export function FullSpectrumWhyThisWorks() {
  return (
    <FadeIn className="border-t border-border/60">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
        <SectionHeader
          kicker="Why this works"
          title="Three structural advantages an agency can't match."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {COLS.map((c) => (
            <article
              key={c.label}
              className="flex flex-col gap-4 rounded-xl border border-border bg-card p-7 lg:p-9"
            >
              <p className="font-heading text-gold-gradient text-5xl leading-none tracking-tight lg:text-6xl">
                {c.stat}
              </p>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-gold-dim">
                {c.label}
              </p>
              <p className="text-[14.5px] leading-relaxed text-bone/85">
                {c.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </FadeIn>
  );
}
