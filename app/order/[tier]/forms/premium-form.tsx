"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  ErrorBox,
  Field,
  FieldArea,
  FormPageBackground,
  Radio,
  SubmitButton,
  TierHeader,
  TrustCopy,
  submitOrderIntake,
} from "./_shared";
import type { Tier } from "@/lib/tiers";
import type { PremiumFormat } from "@/lib/order-types";

const FORMAT_OPTIONS: ReadonlyArray<{
  value: PremiumFormat;
  label: string;
  description: string;
}> = [
  {
    value: "3x10s",
    label: "Three 10-second videos",
    description: "Best for variety / multiple angles. A/B-test what hooks.",
  },
  {
    value: "2x15s",
    label: "Two 15-second videos",
    description: "Best for longer narrative — room for setup, payoff, brand reveal.",
  },
];

/**
 * Premium ($90) — same single-shot shape as Basic/Standard, plus a format
 * selector so the customer picks how the multi-video pack is delivered.
 * Default to "3x10s" because variety beats length for paid social testing.
 */
export function PremiumForm({ tier }: { tier: Tier }) {
  const [productUrl, setProductUrl] = useState("");
  const [brandName, setBrandName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [premiumFormat, setPremiumFormat] = useState<PremiumFormat>("3x10s");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await submitOrderIntake({
        tier: tier.slug,
        productUrl: productUrl.trim(),
        brandName: brandName.trim(),
        prompt: prompt.trim() || null,
        name: name.trim(),
        email: email.trim(),
        premiumFormat,
      });
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        throw new Error("Checkout isn't ready for this tier yet.");
      }
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

        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          onSubmit={handleSubmit}
          className="flex flex-col gap-5"
        >
          <Field
            label={tier.urlFieldLabel}
            type="url"
            value={productUrl}
            onChange={setProductUrl}
            placeholder="https://yourstore.com/products/…"
            required
          />

          <Radio
            label="Choose your format"
            value={premiumFormat}
            onChange={setPremiumFormat}
            options={FORMAT_OPTIONS}
            required
          />

          <Field
            label="Brand name"
            hint="Will appear on the video end-card in elegant cursive."
            type="text"
            value={brandName}
            onChange={setBrandName}
            placeholder="Your brand name"
            required
            maxLength={80}
          />

          <FieldArea
            label="Style notes (optional)"
            hint="Vibe, references, what to avoid — anything that helps us nail the look."
            value={prompt}
            onChange={setPrompt}
            placeholder="e.g. Two angles — one product close-up, one lifestyle. Warm tones."
            maxLength={2000}
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

          <SubmitButton submitting={submitting} />
          <TrustCopy />
        </motion.form>
      </div>
    </section>
  );
}
