import { FadeIn } from "@/components/site/fade-in";
import { SectionHeader } from "@/components/site/services";

interface Pillar {
  n: string;
  title: string;
  body: string;
}

const PILLARS: readonly Pillar[] = [
  {
    n: "01",
    title: "Cinematic video production",
    body: "Up to 100+ AI videos per month across Hyper Motion, Soul, and Cinema styles. Brand-matched, end-card licensed for commercial use.",
  },
  {
    n: "02",
    title: "Multi-platform auto-posting",
    body: "Posted on Instagram, TikTok, YouTube Shorts, Pinterest, Facebook, X, and LinkedIn via Buffer. You don't lift a finger.",
  },
  {
    n: "03",
    title: "Paid ads management",
    body: "We run and optimize Meta, TikTok, and Google ad campaigns on your behalf — budget allocation, audience targeting, creative iteration.",
  },
  {
    n: "04",
    title: "Custom landing pages",
    body: "Built in Framer / Webflow. A/B tested. Conversion-optimized for your specific funnel.",
  },
  {
    n: "05",
    title: "Email marketing engine",
    body: "Automated sequences (welcome, abandoned cart, post-purchase, win-back), monthly newsletters, list segmentation.",
  },
  {
    n: "06",
    title: "SEO content",
    body: "4–10 blog articles per month, plus video transcripts SEO-optimized for your niche keywords.",
  },
  {
    n: "07",
    title: "Influencer + UGC partnerships",
    body: "Outreach, negotiation, content management for 3–10 partnerships per month, fully orchestrated.",
  },
  {
    n: "08",
    title: "Real-time analytics dashboard",
    body: "Live performance metrics at luxmotionai.com/clients/[your-brand]. Views, clicks, conversions, ad ROAS, top performers.",
  },
  {
    n: "09",
    title: "Direct strategy access",
    body: "Weekly or 2× weekly strategy calls. Direct Slack / Discord channel for emergencies.",
  },
];

export function FullSpectrumPillars() {
  return (
    <FadeIn className="border-t border-border/60">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
        <SectionHeader
          kicker="What's inside"
          title="Nine pillars. One growth engine."
        />

        <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-border/60 bg-border/60 md:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p) => (
            <article
              key={p.n}
              className="flex flex-col gap-4 bg-ink-base p-7 lg:p-8"
            >
              <span className="font-serif-italic text-3xl text-gold-dim lg:text-[34px]">
                {p.n}
              </span>
              <h3 className="font-heading text-xl text-bone lg:text-[22px]">
                {p.title}
              </h3>
              <p className="text-[14.5px] leading-relaxed text-muted-foreground">
                {p.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </FadeIn>
  );
}
