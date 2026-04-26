"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  ErrorBox,
  Field,
  FieldArea,
  FormPageBackground,
  SubmitButton,
  TierHeader,
  TrustCopy,
  submitOrderIntake,
} from "./_shared";
import type { Tier } from "@/lib/tiers";

/**
 * Form for Basic ($30) and Standard ($60). Both share the exact same intake
 * shape — a single product URL + brand name + optional notes + name + email.
 */
export function SingleForm({ tier }: { tier: Tier }) {
  const [productUrl, setProductUrl] = useState("");
  const [brandName, setBrandName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const checkoutUrl = await submitOrderIntake({
        tier: tier.slug,
        productUrl: productUrl.trim(),
        brandName: brandName.trim(),
        prompt: prompt.trim() || null,
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
            placeholder="e.g. Slow-motion macro shots, cool blue tones, no people, brand feels minimal Scandinavian."
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
