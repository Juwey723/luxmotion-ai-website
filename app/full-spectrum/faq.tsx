import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FadeIn } from "@/components/site/fade-in";
import { SectionHeader } from "@/components/site/services";

const FAQS = [
  {
    q: "Do I need to provide creative direction?",
    a: "No, but we work better with it. The onboarding call captures your brand voice and goals; we execute against that. The more direction you give us, the more dialed-in the output — but a vague brief still gets you a real strategy doc and real production.",
  },
  {
    q: "What if I want to bring my own video assets?",
    a: "We can mix AI-generated and human-shot assets. Just send us what you have — we'll integrate, edit, repurpose, and supplement with AI where it makes sense.",
  },
  {
    q: "Do I get to keep the videos and ad creative?",
    a: "Yes. All assets are yours with full commercial use license, in perpetuity. If you cancel, the work you've already paid for is yours forever — no clawbacks.",
  },
  {
    q: "Can I upgrade or downgrade between tiers?",
    a: "Yes, monthly. Just message us 7 days before your renewal and we'll switch you on the next billing cycle. No fees, no penalties.",
  },
  {
    q: "What if my industry is regulated (alcohol, supplements, etc.)?",
    a: "We work with regulated industries. Tell us your platform's ad rules and content restrictions and we'll tailor accordingly — including avoiding specific claims, age-gating where needed, and using compliant creative formats.",
  },
  {
    q: "Is there a contract?",
    a: "No. Cancel anytime, no questions asked. We earn your business every month — that's a structural choice on our end. Long-term contracts let agencies coast; we don't want that incentive.",
  },
  {
    q: "What happens to my paid ad budget?",
    a: "The ad spend amounts listed (e.g. $500/month on Growth) are INCLUDED in your monthly fee. We run that spend on your platforms with your accounts (or set up new ones if needed). You don't pay anything extra to Meta / TikTok / Google beyond the tier price.",
  },
] as const;

export function FullSpectrumFAQ() {
  return (
    <FadeIn id="faq" className="scroll-mt-nav border-t border-border/60">
      <div className="mx-auto max-w-3xl px-6 py-24 lg:px-10 lg:py-32">
        <SectionHeader kicker="FAQ" title="The honest answers." />

        <Accordion className="mt-12 border-t border-border/60">
          {FAQS.map((f, i) => (
            <AccordionItem key={f.q} value={`fs-faq-${i}`} className="px-1">
              <AccordionTrigger className="py-5 text-left font-heading text-lg text-bone lg:text-xl">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="pb-6 pr-6 text-[15px] leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </FadeIn>
  );
}
