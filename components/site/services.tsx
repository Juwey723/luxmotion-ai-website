import { Card, CardContent } from "@/components/ui/card";
import { FadeIn } from "@/components/site/fade-in";
import { SERVICES } from "@/lib/constants";

export function Services() {
  return (
    <FadeIn id="services" className="scroll-mt-nav border-t border-border/60">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
        <SectionHeader
          kicker="Services"
          title="Three ways to put your product on screen."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {SERVICES.map((s) => (
            <Card
              key={s.n}
              className="relative flex flex-col gap-0 overflow-hidden bg-card p-0 ring-1 ring-border transition-colors hover:ring-gold/55"
            >
              {s.badge && (
                <span className="absolute right-5 top-5 rounded-full border border-gold/45 bg-gold/10 px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.22em] text-gold-light">
                  {s.badge}
                </span>
              )}
              <CardContent className="flex flex-1 flex-col gap-6 p-7 lg:p-9">
                <span className="font-serif-italic text-3xl text-gold-dim">
                  {s.n}
                </span>
                <div>
                  <h3 className="font-heading text-2xl text-bone lg:text-[26px]">
                    {s.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {s.blurb}
                  </p>
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-5">
                  <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    From <span className="text-bone">${s.priceFrom}</span>
                  </span>
                  <a
                    href={s.cta.href}
                    {...(s.cta.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold transition-colors hover:text-gold-light"
                  >
                    {s.cta.label} →
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </FadeIn>
  );
}

export function SectionHeader({
  kicker,
  title,
}: {
  kicker: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-[11px] font-medium uppercase tracking-[0.42em] text-gold">
        — {kicker} —
      </p>
      <h2 className="font-heading text-balance text-4xl leading-[1.05] tracking-tight text-bone md:text-5xl lg:text-[56px]">
        {title}
      </h2>
    </div>
  );
}
