import { FadeIn } from "@/components/site/fade-in";
import { SectionHeader } from "@/components/site/services";
import { STEPS } from "@/lib/constants";

export function How() {
  return (
    <FadeIn id="how" className="scroll-mt-nav border-t border-border/60">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
        <SectionHeader kicker="How it works" title="Four steps. One day." />

        <ol className="mt-14 grid gap-px overflow-hidden rounded-xl border border-border/60 bg-border/60 md:grid-cols-4">
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
