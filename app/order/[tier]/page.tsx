import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { isTierSlug, TIERS, TIER_SLUGS } from "@/lib/tiers";
import { OrderForm } from "./order-form";

// Pre-generate one static shell per tier; the form itself is a client component.
export function generateStaticParams() {
  return TIER_SLUGS.map((tier) => ({ tier }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tier: string }>;
}): Promise<Metadata> {
  const { tier } = await params;
  if (!isTierSlug(tier)) return { title: "Order" };
  const t = TIERS[tier];
  return {
    title: `Order ${t.shortName} — $${t.price}${t.priceSuffix}`,
    description: `${t.label}. ${t.delivery} delivery. Tell us about your product, pay through secure Shopify checkout, your video lands in your inbox.`,
  };
}

export default async function OrderTierPage({
  params,
}: {
  params: Promise<{ tier: string }>;
}) {
  const { tier } = await params;
  if (!isTierSlug(tier)) notFound();
  return (
    <>
      <SiteNav />
      <main>
        <OrderForm tier={TIERS[tier]} />
      </main>
      <SiteFooter />
    </>
  );
}
