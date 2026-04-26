"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";
import { intakePath, SINGLE_TIERS } from "@/lib/tiers";
import { cn } from "@/lib/utils";

type Status = "idle" | "submitting" | "success" | "error";

export function SampleForm() {
  const [productUrl, setProductUrl] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setStatus("submitting");

    try {
      const res = await fetch("/api/sample-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productUrl: productUrl.trim(),
          email: email.trim(),
          name: name.trim(),
          notes: notes.trim(),
        }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok) throw new Error(data?.error ?? "Something went wrong.");
      setSubmittedEmail(email.trim());
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Submission failed.");
      setStatus("error");
    }
  }

  function reset() {
    setStatus("idle");
    setErrorMsg(null);
  }

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

      <div className="mx-auto flex max-w-4xl flex-col items-center px-6 pb-24 pt-16 text-center md:pt-24 lg:px-10 lg:pb-32 lg:pt-28">
        <p className="mb-7 text-[11px] font-medium uppercase tracking-[0.42em] text-gold md:text-[12px]">
          — Free Sample —
        </p>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="font-heading text-gold-gradient text-balance text-[44px] leading-[1.02] tracking-tight sm:text-6xl md:text-[72px] lg:text-[80px]"
        >
          Try us free.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="font-serif-italic mt-6 max-w-3xl text-balance text-2xl text-bone/85 md:text-3xl"
        >
          Drop your product link, get a custom 5-second cinematic AI sample
          emailed to you in ~30 minutes.
        </motion.p>

        <p className="mt-7 max-w-2xl text-balance text-[15px] leading-relaxed text-muted-foreground md:text-base">
          No credit card. Real Higgsfield-quality output. Same pipeline our paid
          clients get.
        </p>

        <div className="mt-12 w-full">
          <AnimatePresence mode="wait">
            {(status === "idle" || status === "submitting") && (
              <FormPanel
                key="form"
                productUrl={productUrl}
                email={email}
                name={name}
                notes={notes}
                setProductUrl={setProductUrl}
                setEmail={setEmail}
                setName={setName}
                setNotes={setNotes}
                onSubmit={handleSubmit}
                submitting={status === "submitting"}
              />
            )}

            {status === "success" && (
              <SuccessPanel key="success" email={submittedEmail} />
            )}

            {status === "error" && (
              <ErrorPanel
                key="error"
                message={errorMsg ?? "Submission failed."}
                onRetry={reset}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function FormPanel({
  productUrl,
  email,
  name,
  notes,
  setProductUrl,
  setEmail,
  setName,
  setNotes,
  onSubmit,
  submitting,
}: {
  productUrl: string;
  email: string;
  name: string;
  notes: string;
  setProductUrl: (v: string) => void;
  setEmail: (v: string) => void;
  setName: (v: string) => void;
  setNotes: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
}) {
  const inputCls =
    "h-12 w-full rounded-full border border-border bg-ink-elevated px-5 text-[14px] text-bone placeholder:text-muted-foreground/70 transition-colors focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/30 disabled:opacity-60";

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4 }}
      onSubmit={onSubmit}
      className="mx-auto flex w-full max-w-2xl flex-col gap-3 text-left"
    >
      <input
        type="url"
        required
        disabled={submitting}
        value={productUrl}
        onChange={(e) => setProductUrl(e.target.value)}
        placeholder="https://yourstore.com/products/…"
        className={inputCls}
        aria-label="Product URL"
      />
      <div className="flex flex-col gap-3 md:flex-row">
        <input
          type="email"
          required
          disabled={submitting}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className={inputCls}
          aria-label="Your email"
        />
        <input
          type="text"
          required
          disabled={submitting}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className={inputCls}
          aria-label="Your name"
          maxLength={80}
        />
      </div>
      <textarea
        rows={3}
        disabled={submitting}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Any specific style preferences? (optional)"
        className="w-full resize-none rounded-2xl border border-border bg-ink-elevated px-5 py-4 text-[14px] text-bone placeholder:text-muted-foreground/70 transition-colors focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/30 disabled:opacity-60"
        aria-label="Notes"
        maxLength={1000}
      />
      <button
        type="submit"
        disabled={submitting}
        className="mx-auto mt-2 inline-flex h-13 min-h-[52px] w-full items-center justify-center gap-3 rounded-full bg-gold px-9 text-[12px] font-semibold uppercase tracking-[0.26em] text-ink-deepest shadow-[0_8px_30px_-10px_rgba(201,168,96,0.55)] transition-all hover:-translate-y-px hover:bg-gold-light hover:shadow-[0_10px_40px_-10px_rgba(240,220,160,0.65)] disabled:cursor-not-allowed disabled:opacity-80 disabled:hover:translate-y-0 sm:max-w-sm"
      >
        {submitting ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-deepest/30 border-t-ink-deepest" />
            Sending…
          </>
        ) : (
          "Request My Free Sample"
        )}
      </button>
      <p className="mt-3 text-center text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        One free sample per email · 30-minute typical turnaround
      </p>
    </motion.form>
  );
}

function SuccessPanel({ email }: { email: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.5 }}
      className="mx-auto flex w-full max-w-3xl flex-col items-center gap-7"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.45 }}
        className="flex h-20 w-20 items-center justify-center rounded-full border border-gold/55 bg-gold/10"
      >
        <Check className="h-10 w-10 text-gold-light" strokeWidth={2} />
      </motion.div>

      <div className="flex flex-col items-center gap-4">
        <h2 className="font-heading text-gold-gradient text-balance text-5xl tracking-tight md:text-6xl">
          On it.
        </h2>
        <p className="max-w-xl text-balance text-base leading-relaxed text-bone/85 md:text-lg">
          We&apos;re producing your sample now. You&apos;ll get an email at{" "}
          <span className="text-gold">{email}</span> within 30 minutes with the
          finished video. Check your spam folder if it doesn&apos;t arrive.
        </p>
      </div>

      <UpsellCard />
    </motion.div>
  );
}

function UpsellCard() {
  return (
    <div className="mt-6 w-full overflow-hidden rounded-2xl border border-gold/55 bg-card p-7 shadow-[0_20px_60px_-30px_rgba(201,168,96,0.4)] lg:p-9">
      <div className="text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.42em] text-gold">
          — Don&apos;t want to wait? —
        </p>
        <h2 className="mt-4 font-heading text-3xl text-balance leading-tight text-bone md:text-4xl">
          Skip the queue.
        </h2>
        <p className="mt-3 mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground">
          Order a polished 10 or 15-second video, custom-scripted to your brand,
          with up to 3 revisions and 24-hour delivery — from $30.
        </p>
      </div>

      <div className="mt-9 grid gap-4 md:grid-cols-3">
        {SINGLE_TIERS.map((t) => {
          const productLine = t.label.replace(`${t.shortName} — `, "");
          return (
            <div
              key={t.slug}
              className={cn(
                "flex flex-col items-start gap-3 rounded-xl border bg-ink-elevated/80 p-5 transition-colors",
                t.popular
                  ? "border-gold/55 ring-1 ring-gold/30"
                  : "border-border hover:border-gold/40",
              )}
            >
              <div className="flex w-full items-baseline justify-between">
                <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  {t.shortName}
                </span>
                <span className="font-heading text-2xl text-gold-gradient">
                  ${t.price}
                </span>
              </div>
              <p className="text-[13px] leading-snug text-bone/85">{productLine}</p>
              <Link
                href={intakePath(t.slug)}
                className={cn(
                  "mt-auto inline-flex h-10 w-full items-center justify-center rounded-full px-4 text-[11px] font-semibold uppercase tracking-[0.22em] transition-all",
                  t.popular
                    ? "bg-gold text-ink-deepest hover:bg-gold-light"
                    : "border border-gold/40 text-bone hover:border-gold hover:bg-gold/[0.06]",
                )}
              >
                Order {t.shortName}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ErrorPanel({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4 }}
      className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 rounded-2xl border border-border bg-card p-8 text-center"
    >
      <p className="text-[11px] uppercase tracking-[0.28em] text-gold-dim">
        — Something stopped us —
      </p>
      <p className="font-serif-italic text-2xl text-bone/90 md:text-[26px]">
        {message}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-11 items-center justify-center rounded-full border border-gold/45 bg-transparent px-6 text-[12px] font-semibold uppercase tracking-[0.22em] text-bone transition-all hover:border-gold hover:bg-gold/[0.06]"
        >
          Try again
        </button>
        <Link
          href="/order/basic"
          className="inline-flex h-11 items-center justify-center rounded-full bg-gold px-6 text-[12px] font-semibold uppercase tracking-[0.22em] text-ink-deepest transition-all hover:bg-gold-light"
        >
          Order direct from $30
        </Link>
      </div>
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        Or DM us @luxmotionai
      </p>
    </motion.div>
  );
}
