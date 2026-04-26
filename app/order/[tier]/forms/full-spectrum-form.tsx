"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  ErrorBox,
  Field,
  FieldArea,
  FormPageBackground,
  MarketingCard,
  PendingSetupPanel,
  Select,
  SubmitButton,
  TierHeader,
  TrustCopy,
  submitOrderIntake,
} from "./_shared";
import {
  AD_SPEND_RANGES,
  GROWTH_GOAL_OPTIONS,
  INDUSTRY_OPTIONS,
  REVENUE_RANGES,
  type AdSpendRangeValue,
  type GrowthGoalValue,
  type IndustryValue,
  type RevenueRangeValue,
  type Tier,
} from "@/lib/tiers";

type Status = "idle" | "submitting" | "submitted-pending" | "error";

/**
 * Full Spectrum intake — Growth / Scale / Dominate share the same deep form.
 * Captures everything we need to make a real call: socials across all major
 * platforms, industry + revenue + ad spend ranges, top competitors, primary
 * growth goal, brand voice, audience, onboarding-call availability, phone.
 *
 * While Shopify variants are still TODO, /api/order-intake responds with
 * `pendingSetup: true` and we render the PendingSetupPanel instead of
 * redirecting to a broken cart. Once variants are wired, this becomes a
 * normal Shopify redirect with no further code changes needed.
 */
export function FullSpectrumForm({ tier }: { tier: Tier }) {
  const [productUrl, setProductUrl] = useState("");
  const [brandName, setBrandName] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [tiktokHandle, setTiktokHandle] = useState("");
  const [youtubeChannel, setYoutubeChannel] = useState("");
  const [otherSocials, setOtherSocials] = useState("");
  const [industry, setIndustry] = useState<IndustryValue>("fashion");
  const [industryOther, setIndustryOther] = useState("");
  const [monthlyRevenue, setMonthlyRevenue] =
    useState<RevenueRangeValue>("private");
  const [adSpend, setAdSpend] = useState<AdSpendRangeValue>("private");
  const [competitors, setCompetitors] = useState("");
  const [growthGoal, setGrowthGoal] = useState<GrowthGoalValue>("conversions");
  const [growthGoalOther, setGrowthGoalOther] = useState("");
  const [brandVoice, setBrandVoice] = useState("");
  const [audienceGoals, setAudienceGoals] = useState("");
  const [prompt, setPrompt] = useState("");
  const [onboardingPreference, setOnboardingPreference] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const ig = instagramHandle.trim();
    const tt = tiktokHandle.trim();
    const yt = youtubeChannel.trim();
    if (!ig && !tt && !yt) {
      setError(
        "Please share at least one social channel — Instagram, TikTok, or YouTube.",
      );
      return;
    }
    if (industry === "other" && !industryOther.trim()) {
      setError("Please describe your industry.");
      return;
    }
    if (growthGoal === "other" && !growthGoalOther.trim()) {
      setError("Please describe your growth goal.");
      return;
    }
    if (phone.trim().length < 7) {
      setError("Please enter a phone number we can call you back on.");
      return;
    }

    setStatus("submitting");
    try {
      const result = await submitOrderIntake({
        tier: tier.slug,
        productUrl: productUrl.trim(),
        brandName: brandName.trim(),
        instagramHandle: ig || null,
        tiktokHandle: tt || null,
        youtubeChannel: yt || null,
        otherSocials: otherSocials.trim() || null,
        industry,
        industryOther:
          industry === "other" ? industryOther.trim() || null : null,
        monthlyRevenue,
        adSpend,
        competitors: competitors.trim() || null,
        growthGoal,
        growthGoalOther:
          growthGoal === "other" ? growthGoalOther.trim() || null : null,
        brandVoice: brandVoice.trim() || null,
        audienceGoals: audienceGoals.trim() || null,
        prompt: prompt.trim() || null,
        onboardingPreference: onboardingPreference.trim() || null,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      if (result.pendingSetup) {
        setStatus("submitted-pending");
        return;
      }
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      throw new Error("Server returned an unexpected response. Try again.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
      setStatus("error");
    }
  }

  if (status === "submitted-pending") {
    return (
      <section className="relative overflow-hidden">
        <FormPageBackground />
        <div className="mx-auto flex max-w-3xl flex-col px-6 pb-24 pt-16 md:pt-24 lg:px-10 lg:pb-32 lg:pt-28">
          <TierHeader tier={tier} />
          <PendingSetupPanel
            email={email.trim()}
            tierShortName={tier.shortName}
          />
        </div>
      </section>
    );
  }

  const submitting = status === "submitting";

  return (
    <section className="relative overflow-hidden">
      <FormPageBackground />
      <div className="mx-auto flex max-w-3xl flex-col px-6 pb-24 pt-16 md:pt-24 lg:px-10 lg:pb-32 lg:pt-28">
        <TierHeader tier={tier} />

        <MarketingCard>
          <p className="m-0 font-heading text-2xl leading-snug text-bone">
            Tell us about your brand. We&apos;ll call you within 24 hours.
          </p>
          <p className="mb-0 mt-3 text-bone/85">
            Full Spectrum is a real partnership — we orchestrate, AI executes,
            you scale. Before any payment moves, we want a 60-minute onboarding
            call to understand your brand, audience, and goals. The deeper your
            answers below, the faster we can move on day one.
          </p>
        </MarketingCard>

        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          onSubmit={handleSubmit}
          className="flex flex-col gap-5"
        >
          <Field
            label="Brand homepage URL"
            type="url"
            value={productUrl}
            onChange={setProductUrl}
            placeholder="https://yourbrand.com"
            required
          />

          <Field
            label="Brand name"
            type="text"
            value={brandName}
            onChange={setBrandName}
            placeholder="Your brand name"
            required
            maxLength={80}
          />

          <p className="-mb-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Social presence — at least one of IG / TikTok / YouTube required
          </p>
          <div className="grid gap-5 md:grid-cols-3">
            <Field
              label="Instagram"
              type="text"
              value={instagramHandle}
              onChange={setInstagramHandle}
              placeholder="brandname"
              prefix="@"
              maxLength={40}
            />
            <Field
              label="TikTok"
              type="text"
              value={tiktokHandle}
              onChange={setTiktokHandle}
              placeholder="brandname"
              prefix="@"
              maxLength={40}
            />
            <Field
              label="YouTube channel"
              type="text"
              value={youtubeChannel}
              onChange={setYoutubeChannel}
              placeholder="@yourbrand or channel URL"
              maxLength={120}
            />
          </div>

          <FieldArea
            label="Other social handles (optional)"
            hint="Twitter/X, LinkedIn, Pinterest, Threads — anywhere else we should be aware of."
            value={otherSocials}
            onChange={setOtherSocials}
            placeholder="@yourbrand on X; linkedin.com/company/yourbrand"
            rows={2}
            maxLength={500}
          />

          <Select
            label="Industry / niche"
            value={industry}
            onChange={setIndustry}
            options={INDUSTRY_OPTIONS}
            required
          />

          {industry === "other" && (
            <Field
              label="Specify your industry"
              type="text"
              value={industryOther}
              onChange={setIndustryOther}
              placeholder="e.g. Pet products, B2B SaaS, etc."
              maxLength={80}
              required
            />
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <Select
              label="Current monthly revenue"
              hint="Rough range — for capacity planning. We won't share or store this."
              value={monthlyRevenue}
              onChange={setMonthlyRevenue}
              options={REVENUE_RANGES}
              required
            />
            <Select
              label="Current ad spend"
              hint="If you're already running ads, give us a sense of scale."
              value={adSpend}
              onChange={setAdSpend}
              options={AD_SPEND_RANGES}
              required
            />
          </div>

          <FieldArea
            label="Top 3 competitors"
            hint="Brand names + websites if you have them. Helps us run competitive analysis."
            value={competitors}
            onChange={setCompetitors}
            placeholder={
              "1. Brand A — brand-a.com\n2. Brand B — brand-b.com\n3. Brand C — brand-c.com"
            }
            rows={4}
            maxLength={1000}
          />

          <Select
            label="Primary growth goal"
            value={growthGoal}
            onChange={setGrowthGoal}
            options={GROWTH_GOAL_OPTIONS}
            required
          />

          {growthGoal === "other" && (
            <FieldArea
              label="Describe your growth goal"
              value={growthGoalOther}
              onChange={setGrowthGoalOther}
              placeholder="e.g. Drive 30% more PDP traffic from paid social over the next 90 days."
              rows={2}
              maxLength={500}
              required
            />
          )}

          <FieldArea
            label="Brand voice description"
            hint="The vibe — luxury, playful, edgy, minimalist, etc. The more specific, the better we match."
            value={brandVoice}
            onChange={setBrandVoice}
            placeholder="e.g. Quiet luxury. Soft palette. No gimmicks. Slow, intentional motion."
            maxLength={1500}
          />

          <FieldArea
            label="Target audience description"
            hint="Who are we creating for? Demographics, psychographics, where they spend their time."
            value={audienceGoals}
            onChange={setAudienceGoals}
            placeholder="e.g. Women 25–40, urban, design-conscious. High-AOV shoppers. IG + Pinterest natives."
            maxLength={1500}
          />

          <FieldArea
            label="Anything else we should know (optional)"
            hint="Constraints, sensitivities, products to avoid featuring, regulatory considerations, anything."
            value={prompt}
            onChange={setPrompt}
            placeholder="e.g. We're FDA-regulated; can't make any health claims. Avoid showing the product being consumed."
            maxLength={2000}
          />

          <Field
            label="Best time for our 60-min onboarding call"
            hint="A day + time window in your timezone, or 'we'll email to coordinate'."
            type="text"
            value={onboardingPreference}
            onChange={setOnboardingPreference}
            placeholder="e.g. Tuesdays before noon ET, or we'll email to coordinate"
            maxLength={200}
          />

          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Your name"
              type="text"
              value={name}
              onChange={setName}
              required
              maxLength={80}
            />
            <Field
              label="Phone (we'll call you)"
              type="tel"
              value={phone}
              onChange={setPhone}
              placeholder="+1 555 123 4567"
              required
              maxLength={30}
            />
          </div>

          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@email.com"
            required
          />

          {error && <ErrorBox message={error} />}

          <SubmitButton
            submitting={submitting}
            label={`Apply for ${tier.shortName} — we'll call within 24h`}
            submittingLabel="Sending your application…"
          />
          <TrustCopy />
        </motion.form>
      </div>
    </section>
  );
}
