import { FadeIn } from "@/components/site/fade-in";
import { SectionHeader } from "@/components/site/services";

interface Row {
  feature: string;
  growth: string;
  scale: string;
  dominate: string;
}

const ROWS: readonly Row[] = [
  { feature: "Cinematic AI videos / month", growth: "30", scale: "60", dominate: "100+" },
  { feature: "Posting platforms", growth: "IG + TikTok", scale: "+ YouTube Shorts, Pinterest, Facebook", dominate: "All major (incl. X, LinkedIn)" },
  { feature: "Strategy calls", growth: "2× /month, 30 min", scale: "Weekly, 45 min", dominate: "2× /week, 60 min" },
  { feature: "Analytics cadence", growth: "Bi-weekly report", scale: "Weekly report", dominate: "Real-time + viral alerts" },
  { feature: "Ad management", growth: "$500/mo Meta", scale: "$1,500/mo Meta + TikTok", dominate: "$3,000/mo Meta + TikTok + Google" },
  { feature: "Custom landing pages", growth: "1, A/B tested", scale: "3, A/B tested", dominate: "Unlimited + A/B" },
  { feature: "Email automation", growth: "3 sequences", scale: "3 sequences", dominate: "6+ sequences + newsletter" },
  { feature: "SEO blog content", growth: "—", scale: "4 articles / month", dominate: "10 articles / month + transcripts" },
  { feature: "Influencer outreach", growth: "—", scale: "10 contacted / month", dominate: "3–5 fully managed / month" },
  { feature: "Competitor analysis", growth: "—", scale: "Monthly report", dominate: "Quarterly business review" },
  { feature: "Brand identity refinement", growth: "Voice + messaging doc", scale: "Voice + seasonal campaigns", dominate: "Logo, palette, full guidelines" },
  { feature: "CRO audit", growth: "—", scale: "—", dominate: "Monthly + implementation" },
  { feature: "Turnaround on assets", growth: "12-hour priority", scale: "6-hour priority", dominate: "1-hour emergency" },
  { feature: "Direct Slack / Discord channel", growth: "—", scale: "—", dominate: "✓" },
  { feature: "Performance guarantee", growth: "—", scale: "—", dominate: "30% follower growth or 20% more conversions in 90 days" },
];

export function FullSpectrumComparisonTable() {
  return (
    <FadeIn className="border-t border-border/60">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
        <SectionHeader
          kicker="Compare"
          title="What you get at each plan."
        />

        <div className="mt-14 -mx-6 overflow-x-auto px-6 lg:mx-0 lg:overflow-x-visible lg:px-0">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-gold/40">
                <th className="py-4 pr-4 text-[10.5px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  Feature
                </th>
                <th className="px-4 py-4 text-[11px] font-medium uppercase tracking-[0.22em] text-bone">
                  Growth
                  <br />
                  <span className="text-[10px] text-gold-dim">$2,000/mo</span>
                </th>
                <th className="px-4 py-4 text-[11px] font-medium uppercase tracking-[0.22em] text-gold-light">
                  Scale ★
                  <br />
                  <span className="text-[10px] text-gold-dim">$3,500/mo</span>
                </th>
                <th className="px-4 py-4 text-[11px] font-medium uppercase tracking-[0.22em] text-bone">
                  Dominate
                  <br />
                  <span className="text-[10px] text-gold-dim">$5,000/mo</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => (
                <tr
                  key={r.feature}
                  className={
                    i % 2 === 0 ? "bg-ink-base" : "bg-transparent"
                  }
                >
                  <td className="py-3.5 pr-4 align-top text-[13.5px] text-bone/90">
                    {r.feature}
                  </td>
                  <td className="px-4 py-3.5 align-top text-[13.5px] text-muted-foreground">
                    {r.growth}
                  </td>
                  <td className="px-4 py-3.5 align-top text-[13.5px] text-bone">
                    {r.scale}
                  </td>
                  <td className="px-4 py-3.5 align-top text-[13.5px] text-bone">
                    {r.dominate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-center text-[11px] uppercase tracking-[0.22em] text-muted-foreground lg:hidden">
          Scroll horizontally to see all columns →
        </p>
      </div>
    </FadeIn>
  );
}
