"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Tier } from "@/lib/tiers";

export function OrderForm({ tier }: { tier: Tier }) {
  const [productUrl, setProductUrl] = useState("");
  const [brandName, setBrandName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [socialHandles, setSocialHandles] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/order-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: tier.slug,
          productUrl: productUrl.trim(),
          brandName: brandName.trim(),
          prompt: prompt.trim() || null,
          socialHandles: socialHandles.trim() || null,
          name: name.trim(),
          email: email.trim(),
        }),
      });
      const data = (await res.json()) as { checkoutUrl?: string; error?: string };
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error ?? "Couldn't save your order. Try again.");
      }
      // Redirect to Shopify checkout — intake_id is baked into the cart URL.
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
      setSubmitting(false);
    }
  }

  const headlineWithoutShortName = tier.label.replace(`${tier.shortName} — `, "");

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(80% 60% at 50% 0%, rgba(201, 168, 96, 0.10) 0%, rgba(201, 168, 96, 0) 60%), linear-gradient(180deg, #070707 0%, #0a0a0a 100%)",
        }}
      />
      <div aria-hidden className="grain -z-10" />

      <div className="mx-auto flex max-w-3xl flex-col px-6 pb-24 pt-16 md:pt-24 lg:px-10 lg:pb-32 lg:pt-28">
        <div className="mb-12 text-center">
          <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.42em] text-gold md:text-[12px]">
            — Order · {tier.shortName} —
          </p>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="font-heading text-gold-gradient text-balance text-[36px] leading-[1.04] tracking-tight sm:text-5xl md:text-[60px] lg:text-[68px]"
          >
            {headlineWithoutShortName}
          </motion.h1>

          <p className="font-serif-italic mt-6 text-xl text-bone/85 md:text-2xl">
            ${tier.price}
            <span className="text-base text-bone/65">{tier.priceSuffix}</span>
            <span className="mx-3 text-gold-dim">·</span>
            {tier.delivery} delivery
          </p>
        </div>

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
            placeholder={
              tier.showSocialHandlesField
                ? "https://yourbrand.com"
                : "https://yourstore.com/products/…"
            }
            required
          />

          {tier.showSocialHandlesField && (
            <Field
              label="Social handles (optional)"
              type="text"
              value={socialHandles}
              onChange={setSocialHandles}
              placeholder="@yourbrand on Instagram + TikTok"
            />
          )}

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
            maxLength={1000}
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

          {error && (
            <p className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-bone">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className={cn(
              "mt-3 inline-flex h-13 min-h-[52px] items-center justify-center rounded-full bg-gold px-9 text-[12px] font-semibold uppercase tracking-[0.26em] text-ink-deepest shadow-[0_8px_30px_-10px_rgba(201,168,96,0.55)] transition-all",
              submitting
                ? "cursor-wait opacity-70"
                : "hover:-translate-y-px hover:bg-gold-light hover:shadow-[0_10px_40px_-10px_rgba(240,220,160,0.65)]",
            )}
          >
            {submitting ? "Saving your details…" : "Continue to Checkout"}
          </button>

          <p className="mt-1 text-center text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Your details are saved before you pay · production starts automatically once payment clears
          </p>

          <p className="mt-6 text-center text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Need a different tier?{" "}
            <Link href="/#pricing" className="text-gold hover:text-gold-light">
              See all pricing
            </Link>
          </p>
        </motion.form>
      </div>
    </section>
  );
}

function Field({
  label,
  hint,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  maxLength,
}: {
  label: string;
  hint?: string;
  type?: "text" | "url" | "email";
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-gold-dim">*</span>}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="h-12 w-full rounded-md border border-border bg-ink-elevated px-4 text-[14px] text-bone placeholder:text-muted-foreground/70 transition-colors focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/30"
      />
      {hint && (
        <span className="text-[11.5px] leading-snug text-muted-foreground/85">
          {hint}
        </span>
      )}
    </label>
  );
}

function FieldArea({
  label,
  hint,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={4}
        className="w-full rounded-md border border-border bg-ink-elevated px-4 py-3 text-[14px] text-bone placeholder:text-muted-foreground/70 transition-colors focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/30"
      />
      {hint && (
        <span className="text-[11.5px] leading-snug text-muted-foreground/85">
          {hint}
        </span>
      )}
    </label>
  );
}
