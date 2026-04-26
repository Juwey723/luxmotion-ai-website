import { FadeIn } from "@/components/site/fade-in";
import { SectionHeader } from "@/components/site/services";

const STEPS = [
  {
    title: "Onboarding call",
    body: "Free 60 minutes. Tell us about your brand, products, audience, and goals. We listen, take notes, ask sharp questions.",
  },
  {
    title: "Strategy doc",
    body: "Within 5 days we deliver your custom 90-day growth plan — videos, ads, landing pages, email, posting cadence.",
  },
  {
    title: "Production starts",
    body: "Videos go live across your channels by week 2. Ads + landing pages active by week 3. The engine is on.",
  },
  {
    title: "Iterate weekly",
    body: "We meet weekly (or 2× weekly on Dominate), review metrics, double down on what works, kill what doesn't.",
  },
] as const;

export function FullSpectrumHowItWorks() {
  return (
    <FadeIn className="border-t border-border/60">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
        <SectionHeader kicker="How it works" title="Four steps. Always-on after that." />

        <ol className="mt-14 grid gap-px overflow-hidden rounded-xl border border-border/60 bg-border/60 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              className="relative flex flex-col gap-5 bg-ink-base p-7 lg:p-9"
            >
              <span className="font-serif-italic text-4xl text-gold-dim md:text-[42px]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-heading text-xl text-bone lg:text-[22px]">
                  {s.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </FadeIn>
  );
}
