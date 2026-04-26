"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  ErrorBox,
  Field,
  FieldArea,
  FormPageBackground,
  MarketingCard,
  Select,
  SubmitButton,
  TierHeader,
  TrustCopy,
  submitOrderIntake,
} from "./_shared";
import type { Tier } from "@/lib/tiers";
import {
  POSTING_FREQUENCY_LABELS,
  type PostingFrequency,
} from "@/lib/order-types";

const FREQUENCY_OPTIONS: ReadonlyArray<{
  value: PostingFrequency;
  label: string;
}> = [
  { value: "3xPerWeek", label: POSTING_FREQUENCY_LABELS["3xPerWeek"] },
  { value: "frontLoaded", label: POSTING_FREQUENCY_LABELS.frontLoaded },
  { value: "evenSpread", label: POSTING_FREQUENCY_LABELS.evenSpread },
  { value: "custom", label: "Custom (describe below)" },
];

/**
 * Managed Social ($600/mo) — concierge-tier monthly service. Form sells the
 * value prop hard up top, then captures the brand's social presence + voice
 * + audience so the worker (and future Buffer integration) has everything it
 * needs.
 */
export function ManagedSocialForm({ tier }: { tier: Tier }) {
  const [productUrl, setProductUrl] = useState("");
  const [brandName, setBrandName] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [tiktokHandle, setTiktokHandle] = useState("");
  const [otherSocials, setOtherSocials] = useState("");
  const [postingFrequency, setPostingFrequency] =
    useState<PostingFrequency>("3xPerWeek");
  const [postingFrequencyCustom, setPostingFrequencyCustom] = useState("");
  const [brandVoice, setBrandVoice] = useState("");
  const [audienceGoals, setAudienceGoals] = useState("");
  const [bufferEmail, setBufferEmail] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const ig = instagramHandle.trim();
    const tt = tiktokHandle.trim();
    if (!ig && !tt) {
      setError("Please provide at least one — Instagram or TikTok handle.");
      return;
    }
    if (postingFrequency === "custom" && !postingFrequencyCustom.trim()) {
      setError("Please describe your custom posting frequency.");
      return;
    }

    setSubmitting(true);
    try {
      const checkoutUrl = await submitOrderIntake({
        tier: tier.slug,
        productUrl: productUrl.trim(),
        brandName: brandName.trim(),
        instagramHandle: ig || null,
        tiktokHandle: tt || null,
        otherSocials: otherSocials.trim() || null,
        postingFrequency,
        postingFrequencyCustom:
          postingFrequency === "custom"
            ? postingFrequencyCustom.trim() || null
            : null,
        brandVoice: brandVoice.trim() || null,
        audienceGoals: audienceGoals.trim() || null,
        bufferEmail: bufferEmail.trim() || null,
        name: name.trim(),
        email: email.trim(),
      });
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
      setSubmitting(false);
    }
  }

  return (
    <section className="relative overflow-hidden">
      <FormPageBackground />
      <div className="mx-auto flex max-w-3xl flex-col px-6 pb-24 pt-16 md:pt-24 lg:px-10 lg:pb-32 lg:pt-28">
        <TierHeader tier={tier} />

        <MarketingCard>
          <p className="m-0 font-heading text-2xl leading-snug text-bone">
            You&apos;re hiring a content + posting team — without hiring anyone.
          </p>
          <p className="mb-0 mt-4 text-bone/85">
            Every month for $600, LuxMotion AI delivers:
          </p>
          <ul className="mb-0 mt-4 flex flex-col gap-2 text-[14px] text-bone/85">
            <li className="flex items-start gap-3">
              <span aria-hidden className="mt-[7px] inline-block h-[5px] w-[5px] flex-none rounded-full bg-gold" />
              <span>
                <strong className="text-gold">12 cinematic AI product videos</strong>{" "}
                in mixed styles (Hyper Motion, Soul, Cinema), brand-matched to your
                aesthetic
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span aria-hidden className="mt-[7px] inline-block h-[5px] w-[5px] flex-none rounded-full bg-gold" />
              <span>
                <strong className="text-gold">Posted on your Instagram + TikTok via Buffer</strong>{" "}
                — we handle the entire posting calendar so you don&apos;t lift a finger
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span aria-hidden className="mt-[7px] inline-block h-[5px] w-[5px] flex-none rounded-full bg-gold" />
              <span>
                <strong className="text-gold">Monthly analytics report</strong>{" "}
                delivered to your inbox: views, clicks, conversions, top-performing
                videos, recommendations
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span aria-hidden className="mt-[7px] inline-block h-[5px] w-[5px] flex-none rounded-full bg-gold" />
              <span>
                <strong className="text-gold">Cancel anytime, no minimum commitment</strong>{" "}
                — we earn your business every month
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span aria-hidden className="mt-[7px] inline-block h-[5px] w-[5px] flex-none rounded-full bg-gold" />
              <span>
                <strong className="text-gold">All videos are yours</strong> with full
                commercial use license
              </span>
            </li>
          </ul>
          <p className="mb-0 mt-5 text-[13px] text-bone/65">
            You connect your Instagram and TikTok accounts to Buffer (5-minute
            setup we walk you through after purchase). We schedule + post. You get
            monthly reports + finished videos to use however you want.
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
            label="Your brand's homepage URL"
            type="url"
            value={productUrl}
            onChange={setProductUrl}
            placeholder="https://yourbrand.com"
            required
          />

          <Field
            label="Brand name"
            hint="Will appear on every video's end-card in elegant cursive."
            type="text"
            value={brandName}
            onChange={setBrandName}
            placeholder="Your brand name"
            required
            maxLength={80}
          />

          <p className="-mb-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Social presence — at least one of Instagram / TikTok required
          </p>
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Instagram handle"
              type="text"
              value={instagramHandle}
              onChange={setInstagramHandle}
              placeholder="brandname"
              prefix="@"
              maxLength={40}
            />
            <Field
              label="TikTok handle"
              type="text"
              value={tiktokHandle}
              onChange={setTiktokHandle}
              placeholder="brandname"
              prefix="@"
              maxLength={40}
            />
          </div>

          <FieldArea
            label="Other social handles (optional)"
            hint="Twitter, YouTube, LinkedIn, Threads — anywhere else you'd like us to be aware of."
            value={otherSocials}
            onChange={setOtherSocials}
            placeholder="@yourbrand on Twitter; youtube.com/yourbrand"
            rows={2}
            maxLength={500}
          />

          <Select
            label="Posting frequency"
            value={postingFrequency}
            onChange={setPostingFrequency}
            options={FREQUENCY_OPTIONS}
            required
          />

          {postingFrequency === "custom" && (
            <FieldArea
              label="Describe your preferred posting cadence"
              value={postingFrequencyCustom}
              onChange={setPostingFrequencyCustom}
              placeholder="e.g. 4 posts the first week (Tue/Thu/Sat/Sun), 2 per week after; skip weekends"
              maxLength={500}
              rows={3}
              required
            />
          )}

          <FieldArea
            label="Brand voice / style preferences"
            hint="Describe the vibe — luxury, playful, energetic, minimalist, etc. The more specific, the better we match."
            value={brandVoice}
            onChange={setBrandVoice}
            placeholder="e.g. Quiet luxury. Soft palette. No gimmicks. Slow, intentional motion."
            maxLength={1000}
          />

          <FieldArea
            label="Target audience / goals"
            hint="Who are we creating for? What outcome do you want — followers, sales, engagement, brand awareness?"
            value={audienceGoals}
            onChange={setAudienceGoals}
            placeholder="e.g. Women 25–40, urban, design-conscious. Goal: drive Shopify product-detail-page views."
            maxLength={1000}
          />

          <Field
            label="Buffer account email (optional)"
            hint="Already on Buffer? Drop the email here. Otherwise we'll walk you through setting one up after purchase."
            type="email"
            value={bufferEmail}
            onChange={setBufferEmail}
            placeholder="you@buffer.com"
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
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@email.com"
              required
            />
          </div>

          {error && <ErrorBox message={error} />}

          <SubmitButton submitting={submitting} label="Subscribe — Continue to Checkout" />
          <TrustCopy />
        </motion.form>
      </div>
    </section>
  );
}
