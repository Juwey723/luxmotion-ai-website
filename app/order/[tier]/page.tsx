import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { isTierSlug, TIERS, TIER_SLUGS, type TierSlug } from "@/lib/tiers";
import { SingleForm } from "./forms/single-form";
import { PremiumForm } from "./forms/premium-form";
import { ContentPackForm } from "./forms/content-pack-form";
import { ManagedSocialForm } from "./forms/managed-social-form";
import { FullSpectrumForm } from "./forms/full-spectrum-form";
import type { Tier } from "@/lib/tiers";
import type { ReactElement } from "react";

// Pre-generate one static shell per tier; tier-specific form is a client
// component dispatched by the slug.
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
    title: `Order ${t.shortName} — $${t.price.toLocaleString()}${t.priceSuffix}`,
    description: `${t.label}. ${t.delivery}. Tell us about your brand and we'll start production.`,
  };
}

function renderForm(slug: TierSlug, tier: Tier): ReactElement {
  switch (slug) {
    case "basic":
    case "standard":
      return <SingleForm tier={tier} />;
    case "premium":
      return <PremiumForm tier={tier} />;
    case "content-pack":
      return <ContentPackForm tier={tier} />;
    case "managed-social":
      return <ManagedSocialForm tier={tier} />;
    case "full-spectrum-growth":
    case "full-spectrum-scale":
    case "full-spectrum-dominate":
      return <FullSpectrumForm tier={tier} />;
  }
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
      <main>{renderForm(tier, TIERS[tier])}</main>
      <SiteFooter />
    </>
  );
}
