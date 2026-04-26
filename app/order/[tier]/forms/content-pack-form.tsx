"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  ErrorBox,
  Field,
  FieldArea,
  FormPageBackground,
  MarketingCard,
  SubmitButton,
  TierHeader,
  TrustCopy,
  submitOrderIntake,
} from "./_shared";
import type { Tier } from "@/lib/tiers";
import { DEFAULT_STYLE_MIX, type StyleMix } from "@/lib/order-types";
import { cn } from "@/lib/utils";

const STYLE_LABELS: ReadonlyArray<{
  key: keyof StyleMix;
  label: string;
  description: string;
}> = [
  {
    key: "hyperMotion",
    label: "Hyper Motion",
    description: "Cinematic luxury, dramatic motion",
  },
  {
    key: "soul",
    label: "Soul",
    description: "Artistic, dreamy, mood-driven",
  },
  {
    key: "cinema",
    label: "Cinema",
    description: "Clean, editorial, brand-shot",
  },
];

/**
 * Content Pack ($250) — 10 cinematic AI videos across 3 styles.
 *
 *   - Up to 10 product URLs (textarea, one per line, validated server-side)
 *   - Style mix: 3 integer inputs that must sum to 10 (default 3/3/4)
 *   - Posting plan / context (informational, helps formatting decisions)
 *   - Custom prompts / notes
 */
export function ContentPackForm({ tier }: { tier: Tier }) {
  const [productUrls, setProductUrls] = useState("");
  const [brandName, setBrandName] = useState("");
  const [styleMix, setStyleMix] = useState<StyleMix>(DEFAULT_STYLE_MIX);
  const [postingPlan, setPostingPlan] = useState("");
  const [prompt, setPrompt] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const urlCount = useMemo(
    () =>
      productUrls
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0).length,
    [productUrls],
  );

  const styleTotal =
    styleMix.hyperMotion + styleMix.soul + styleMix.cinema;
  const mixValid = styleTotal === 10;

  function setStyleField(key: keyof StyleMix, raw: string) {
    const n = raw === "" ? 0 : Math.max(0, Math.min(10, Math.floor(Number(raw))));
    if (Number.isNaN(n)) return;
    setStyleMix({ ...styleMix, [key]: n });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (urlCount === 0) {
      setError("Please enter at least one product URL.");
      return;
    }
    if (urlCount > 10) {
      setError(
        `Content Pack supports up to 10 product URLs (you entered ${urlCount}).`,
      );
      return;
    }
    if (!mixValid) {
      setError(
        `Style mix must total exactly 10 videos (currently ${styleTotal}).`,
      );
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitOrderIntake({
        tier: tier.slug,
        productUrls: productUrls.trim(),
        brandName: brandName.trim(),
        styleMix,
        postingPlan: postingPlan.trim() || null,
        prompt: prompt.trim() || null,
        name: name.trim(),
        email: email.trim(),
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

        <MarketingCard>
          <p className="m-0">
            Get <strong className="text-gold">10 cinematic AI product videos</strong>{" "}
            in 3 different visual styles —{" "}
            <span className="text-gold-light">Hyper Motion</span>,{" "}
            <span className="text-gold-light">Soul</span>, and{" "}
            <span className="text-gold-light">Cinema</span>. Perfect for A/B testing
            what resonates with your audience.
          </p>
          <p className="mb-0 mt-3 text-bone/75">
            Delivered in 48 hours, all 1080P, all licensed for commercial use.
            Each video runs 10–15 seconds, ready to drop into Instagram Reels,
            TikTok, or your Shopify product pages.
          </p>
        </MarketingCard>

        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          onSubmit={handleSubmit}
          className="flex flex-col gap-5"
        >
          <FieldArea
            label="Product URLs (up to 10, one per line)"
            hint="The 10 videos can feature anywhere from 1 to 10 different products — your call. Just paste each URL on its own line."
            value={productUrls}
            onChange={setProductUrls}
            placeholder={
              "https://yourstore.com/products/widget-one\nhttps://yourstore.com/products/widget-two\n…"
            }
            rows={6}
            required
          />
          <p className="-mt-3 text-[11.5px] uppercase tracking-[0.22em] text-muted-foreground">
            <span className={urlCount > 10 ? "text-destructive" : "text-gold-dim"}>
              {urlCount} / 10
            </span>{" "}
            URLs entered
          </p>

          <Field
            label="Brand name"
            hint="Single brand name — appears on every video's end-card in elegant cursive."
            type="text"
            value={brandName}
            onChange={setBrandName}
            placeholder="Your brand name"
            required
            maxLength={80}
          />

          {/* Style mix */}
          <fieldset className="flex flex-col gap-4 rounded-md border border-border bg-ink-elevated/40 p-5">
            <legend className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Style mix
              <span className="ml-1 text-gold-dim">*</span>
            </legend>
            <p className="text-[12.5px] leading-snug text-muted-foreground">
              Distribute your 10 videos across the 3 styles. Default is{" "}
              <button
                type="button"
                onClick={() => setStyleMix(DEFAULT_STYLE_MIX)}
                className="underline-offset-4 hover:text-gold hover:underline"
              >
                3 / 3 / 4 (reset)
              </button>
              .
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {STYLE_LABELS.map((s) => (
                <label key={s.key} className="flex flex-col gap-2">
                  <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-bone">
                    {s.label}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={styleMix[s.key]}
                    onChange={(e) => setStyleField(s.key, e.target.value)}
                    className="h-12 w-full rounded-md border border-border bg-ink-elevated px-4 text-center text-[18px] font-medium text-bone transition-colors focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/30"
                  />
                  <span className="text-[11px] text-muted-foreground">
                    {s.description}
                  </span>
                </label>
              ))}
            </div>
            <p
              className={cn(
                "mt-1 text-[12px] uppercase tracking-[0.22em]",
                mixValid ? "text-gold-dim" : "text-destructive",
              )}
            >
              Total: {styleTotal} / 10
              {!mixValid && " — must equal 10"}
            </p>
          </fieldset>

          <FieldArea
            label="Posting plan / context (optional)"
            hint="How do you plan to use these videos? Instagram Reels, TikTok, Shopify product pages, paid ads — helps us optimize formatting for each."
            value={postingPlan}
            onChange={setPostingPlan}
            placeholder="e.g. 3 for Reels organic, 4 for paid Meta ads, 3 for product detail pages."
            maxLength={2000}
          />

          <FieldArea
            label="Custom prompts or notes (optional)"
            hint="Vibe references, things to avoid, brand mood, color palette."
            value={prompt}
            onChange={setPrompt}
            placeholder="e.g. Stay minimal Scandi. Cool blues + warm grays. Avoid people in shot."
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
