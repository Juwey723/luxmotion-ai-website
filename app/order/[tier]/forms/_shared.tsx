"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Tier } from "@/lib/tiers";
import { cn } from "@/lib/utils";

export interface IntakeResult {
  intakeId: string;
  /** Present when the tier's Shopify variant is wired — redirect the customer here. */
  checkoutUrl?: string;
  /** Present when the tier's Shopify variant is still TODO — show a "we'll be in touch" panel instead of redirecting. */
  pendingSetup?: boolean;
  message?: string;
}

/**
 * POSTs an intake payload, throws on non-OK, otherwise returns the structured
 * result. Most tiers have real Shopify variants and the caller redirects to
 * `result.checkoutUrl`. Full Spectrum tiers (variant ID = TODO_*) come back
 * with `pendingSetup: true` instead.
 */
export async function submitOrderIntake(
  payload: Record<string, unknown>,
): Promise<IntakeResult> {
  const res = await fetch("/api/order-intake", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as IntakeResult & { error?: string };
  if (!res.ok) {
    throw new Error(data?.error ?? "Couldn't save your order. Try again.");
  }
  if (!data.checkoutUrl && !data.pendingSetup) {
    throw new Error("Server returned an unexpected response. Try again.");
  }
  return data;
}

export function FormPageBackground() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(80% 60% at 50% 0%, rgba(201, 168, 96, 0.10) 0%, rgba(201, 168, 96, 0) 60%), linear-gradient(180deg, #070707 0%, #0a0a0a 100%)",
        }}
      />
      <div aria-hidden className="grain -z-10" />
    </>
  );
}

export function TierHeader({ tier }: { tier: Tier }) {
  const headlineWithoutShortName = tier.label.replace(`${tier.shortName} — `, "");
  return (
    <div className="mb-10 text-center">
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
        ${tier.price.toLocaleString()}
        <span className="text-base text-bone/65">{tier.priceSuffix}</span>
        <span className="mx-3 text-gold-dim">·</span>
        {tier.delivery}
      </p>
    </div>
  );
}

export function MarketingCard({ children }: { children: ReactNode }) {
  return (
    <div className="mb-10 rounded-xl border border-gold/35 bg-card/70 p-6 lg:p-7 text-[14.5px] leading-relaxed text-bone/85">
      {children}
    </div>
  );
}

export function SubmitButton({
  submitting,
  label = "Continue to Checkout",
  submittingLabel = "Saving your details…",
}: {
  submitting: boolean;
  label?: string;
  submittingLabel?: string;
}) {
  return (
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
      {submitting ? submittingLabel : label}
    </button>
  );
}

export function TrustCopy() {
  return (
    <>
      <p className="mt-1 text-center text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        Your details are saved before you pay · production starts automatically once payment clears
      </p>
      <p className="mt-6 text-center text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        Need a different tier?{" "}
        <Link href="/#pricing" className="text-gold hover:text-gold-light">
          See all pricing
        </Link>
      </p>
    </>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <p className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-bone">
      {message}
    </p>
  );
}

/**
 * Shown on Full Spectrum forms after a successful intake submit. Replaces the
 * checkout redirect because variant IDs aren't live yet — the customer needs
 * to know we'll personally call them, not that the form silently failed.
 */
export function PendingSetupPanel({
  email,
  tierShortName,
}: {
  email: string;
  tierShortName: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto mt-8 flex w-full max-w-xl flex-col items-center gap-6 rounded-2xl border border-gold/55 bg-card p-8 text-center shadow-[0_20px_60px_-30px_rgba(201,168,96,0.4)]"
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.42em] text-gold">
        — Got it —
      </p>
      <h2 className="font-heading text-gold-gradient text-balance text-3xl tracking-tight md:text-4xl">
        We&apos;ll call you within 24 hours.
      </h2>
      <p className="max-w-md text-balance text-[15px] leading-relaxed text-bone/85">
        Your <strong className="text-gold">{tierShortName}</strong> request landed.
        We&apos;ve sent a confirmation to <span className="text-gold">{email}</span>{" "}
        and we&apos;ll personally reach out within 24 hours to schedule your
        onboarding call. No payment moves until we&apos;ve talked.
      </p>
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        Check your spam folder if it doesn&apos;t arrive.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex h-11 items-center justify-center rounded-full border border-gold/45 bg-transparent px-6 text-[12px] font-semibold uppercase tracking-[0.22em] text-bone transition-all hover:border-gold hover:bg-gold/[0.06]"
      >
        Back to home
      </Link>
    </motion.div>
  );
}

// ─── Form-field primitives ────────────────────────────────────────────────

export function Field({
  label,
  hint,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  maxLength,
  prefix,
}: {
  label: string;
  hint?: string;
  type?: "text" | "url" | "email" | "tel";
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  prefix?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-gold-dim">*</span>}
      </span>
      <div className="flex h-12 w-full items-center rounded-md border border-border bg-ink-elevated transition-colors focus-within:border-gold/60 focus-within:ring-2 focus-within:ring-gold/30">
        {prefix && (
          <span className="pl-4 pr-1 text-[14px] text-muted-foreground select-none">
            {prefix}
          </span>
        )}
        <input
          type={type}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className={cn(
            "h-full w-full bg-transparent text-[14px] text-bone placeholder:text-muted-foreground/70 focus:outline-none",
            prefix ? "pl-1 pr-4" : "px-4",
          )}
        />
      </div>
      {hint && (
        <span className="text-[11.5px] leading-snug text-muted-foreground/85">
          {hint}
        </span>
      )}
    </label>
  );
}

export function FieldArea({
  label,
  hint,
  value,
  onChange,
  placeholder,
  maxLength,
  rows = 4,
  required = false,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-gold-dim">*</span>}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        required={required}
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

export function Select<T extends string>({
  label,
  hint,
  value,
  onChange,
  options,
  required = false,
}: {
  label: string;
  hint?: string;
  value: T;
  onChange: (v: T) => void;
  options: ReadonlyArray<{ value: T; label: string }>;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-gold-dim">*</span>}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-12 w-full rounded-md border border-border bg-ink-elevated px-4 text-[14px] text-bone transition-colors focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/30"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-ink-elevated text-bone">
            {o.label}
          </option>
        ))}
      </select>
      {hint && (
        <span className="text-[11.5px] leading-snug text-muted-foreground/85">
          {hint}
        </span>
      )}
    </label>
  );
}

export function Radio<T extends string>({
  label,
  value,
  onChange,
  options,
  required = false,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: ReadonlyArray<{ value: T; label: string; description?: string }>;
  required?: boolean;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-gold-dim">*</span>}
      </legend>
      <div className="flex flex-col gap-3">
        {options.map((o) => {
          const checked = value === o.value;
          return (
            <label
              key={o.value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-md border bg-ink-elevated px-4 py-3 transition-colors",
                checked
                  ? "border-gold/55 ring-1 ring-gold/30"
                  : "border-border hover:border-gold/40",
              )}
            >
              <input
                type="radio"
                value={o.value}
                checked={checked}
                onChange={() => onChange(o.value)}
                className="mt-1 h-4 w-4 shrink-0 accent-gold"
              />
              <span className="flex flex-1 flex-col gap-1">
                <span className="text-[14px] font-medium text-bone">{o.label}</span>
                {o.description && (
                  <span className="text-[12.5px] leading-snug text-muted-foreground">
                    {o.description}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
