import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FadeIn } from "@/components/site/fade-in";
import { SectionHeader } from "@/components/site/services";
import { FAQS } from "@/lib/constants";

export function FAQ() {
  return (
    <FadeIn id="faq" className="scroll-mt-nav border-t border-border/60">
      <div className="mx-auto max-w-3xl px-6 py-24 lg:px-10 lg:py-32">
        <SectionHeader kicker="FAQ" title="The short version." />

        <Accordion className="mt-12 border-t border-border/60">
          {FAQS.map((f, i) => (
            <AccordionItem key={f.q} value={`item-${i}`} className="px-1">
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
