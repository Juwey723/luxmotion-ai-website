"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ORDER_URL_BASIC,
  ORDER_URL_DEFAULT,
  ORDER_URL_PREMIUM,
  ORDER_URL_STANDARD,
  PRICING,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

const LOADING_MESSAGES = [
  "Reading your product page…",
  "Analyzing the product image…",
  "Generating cinematic motion…",
  "Polishing the final cut…",
] as const;

const TIER_URLS: Record<"Basic" | "Standard" | "Premium", string> = {
  Basic: ORDER_URL_BASIC,
  Standard: ORDER_URL_STANDARD,
  Premium: ORDER_URL_PREMIUM,
};

type Status = "idle" | "loading" | "result" | "error";

export function SampleClient() {
  const [productUrl, setProductUrl] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [progress, setProgress] = useState(0);
  const [messageIdx, setMessageIdx] = useState(0);
  const startedAt = useRef(0);

  // Drive fake-progress + cycling messages while a real request is in flight.
  // Master tier + Flux preprocessing pipeline empirically runs 90–200s on
  // ponydilusso jewelry inputs; bias the bar toward the longer end so it
  // doesn't cap-and-plateau too long on slow generations.
  useEffect(() => {
    if (status !== "loading") return;
    const expectedSec = 140;
    const id = setInterval(() => {
      const elapsed = (Date.now() - startedAt.current) / 1000;
      setProgress(Math.min(95, (elapsed / expectedSec) * 100));
      setMessageIdx(
        Math.min(LOADING_MESSAGES.length - 1, Math.floor(elapsed / 32)),
      );
    }, 400);
    return () => clearInterval(id);
  }, [status]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setVideoUrl(null);
    setStatus("loading");
    setProgress(0);
    setMessageIdx(0);
    startedAt.current = Date.now();

    try {
      const res = await fetch("/api/generate-sample", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productUrl: productUrl.trim(),
          email: email.trim(),
        }),
      });
      const data = (await res.json()) as { videoUrl?: string; error?: string };
      if (!res.ok) {
        throw new Error(data?.error ?? "Something went wrong.");
      }
      setProgress(100);
      setVideoUrl(data.videoUrl ?? null);
      setElapsedSec(Math.round((Date.now() - startedAt.current) / 1000));
      setStatus("result");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed.";
      setErrorMsg(msg);
      setStatus("error");
    }
  }

  function reset() {
    setStatus("idle");
    setErrorMsg(null);
    setVideoUrl(null);
    setProgress(0);
    setMessageIdx(0);
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
          Drop your product link, get a 5-second cinematic AI sample in under a
          minute.
        </motion.p>

        <p className="mt-7 max-w-2xl text-balance text-[15px] leading-relaxed text-muted-foreground md:text-base">
          No credit card. No signup beyond your email. See LuxMotion AI quality
          applied to YOUR product before you buy.
        </p>

        <div className="mt-12 w-full">
          <AnimatePresence mode="wait">
            {status === "idle" && (
              <FormPanel
                key="form"
                productUrl={productUrl}
                email={email}
                setProductUrl={setProductUrl}
                setEmail={setEmail}
                onSubmit={handleSubmit}
              />
            )}

            {status === "loading" && (
              <LoadingPanel
                key="loading"
                progress={progress}
                messageIdx={messageIdx}
              />
            )}

            {status === "result" && videoUrl && (
              <ResultPanel
                key="result"
                videoUrl={videoUrl}
                elapsedSec={elapsedSec}
                onReset={reset}
              />
            )}

            {status === "error" && (
              <ErrorPanel
                key="error"
                message={errorMsg ?? "Generation failed."}
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
  setProductUrl,
  setEmail,
  onSubmit,
}: {
  productUrl: string;
  email: string;
  setProductUrl: (v: string) => void;
  setEmail: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4 }}
      onSubmit={onSubmit}
      className="mx-auto flex w-full max-w-2xl flex-col gap-3"
    >
      <div className="flex flex-col gap-3 md:flex-row">
        <input
          type="url"
          required
          value={productUrl}
          onChange={(e) => setProductUrl(e.target.value)}
          placeholder="https://yourstore.com/products/…"
          className="h-12 flex-1 rounded-full border border-border bg-ink-elevated px-5 text-[14px] text-bone placeholder:text-muted-foreground/70 transition-colors focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/30"
          aria-label="Product URL"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="h-12 flex-1 rounded-full border border-border bg-ink-elevated px-5 text-[14px] text-bone placeholder:text-muted-foreground/70 transition-colors focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/30 md:max-w-[260px]"
          aria-label="Your email"
        />
      </div>
      <button
        type="submit"
        className="mx-auto mt-2 inline-flex h-13 min-h-[52px] w-full items-center justify-center rounded-full bg-gold px-9 text-[12px] font-semibold uppercase tracking-[0.26em] text-ink-deepest shadow-[0_8px_30px_-10px_rgba(201,168,96,0.55)] transition-all hover:-translate-y-px hover:bg-gold-light hover:shadow-[0_10px_40px_-10px_rgba(240,220,160,0.65)] sm:max-w-sm"
      >
        Generate My Sample
      </button>
      <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        One free sample per email · Capped at 50 generations per day
      </p>
    </motion.form>
  );
}

function LoadingPanel({
  progress,
  messageIdx,
}: {
  progress: number;
  messageIdx: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4 }}
      className="mx-auto flex w-full max-w-xl flex-col items-center gap-6"
    >
      <div className="relative aspect-[9/16] w-full max-w-[260px] overflow-hidden rounded-md bg-ink-elevated ring-1 ring-border">
        <motion.div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(201,168,96,0.06) 0%, rgba(240,220,160,0.18) 50%, rgba(201,168,96,0.06) 100%)",
          }}
          animate={{ backgroundPositionX: ["0%", "200%"] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
        </div>
      </div>

      <div className="w-full">
        <div className="h-[3px] w-full overflow-hidden rounded-full bg-border">
          <motion.div
            className="h-full bg-gradient-to-r from-gold-dim via-gold to-gold-light"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        <p className="mt-4 text-center font-serif-italic text-lg text-bone/85 md:text-xl">
          <AnimatePresence mode="wait">
            <motion.span
              key={messageIdx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.4 }}
            >
              {LOADING_MESSAGES[messageIdx]}
            </motion.span>
          </AnimatePresence>
        </p>
        <p className="mt-2 text-center text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          Usually 1–3 minutes
        </p>
      </div>
    </motion.div>
  );
}

function ResultPanel({
  videoUrl,
  elapsedSec,
  onReset,
}: {
  videoUrl: string;
  elapsedSec: number;
  onReset: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.5 }}
      className="mx-auto flex w-full max-w-3xl flex-col items-center gap-7"
    >
      <video
        src={videoUrl}
        autoPlay
        muted
        loop
        playsInline
        controls
        className="aspect-[9/16] w-full max-w-[320px] rounded-md bg-black ring-1 ring-gold/40 shadow-[0_20px_60px_-20px_rgba(201,168,96,0.45)]"
      />

      <div className="flex flex-col items-center gap-4">
        <p className="text-[11px] uppercase tracking-[0.28em] text-gold">
          Your free sample · generated in {elapsedSec}s
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href={videoUrl}
            download="luxmotion-sample.mp4"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center rounded-full border border-gold/45 bg-transparent px-6 text-[12px] font-semibold uppercase tracking-[0.22em] text-bone transition-all hover:border-gold hover:bg-gold/[0.06]"
          >
            Download MP4
          </a>
          <button
            type="button"
            onClick={onReset}
            className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-gold"
          >
            Generate another?
          </button>
        </div>
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
          — Like the sample? —
        </p>
        <h2 className="mt-4 font-heading text-3xl text-balance leading-tight text-bone md:text-4xl">
          The full version is even better.
        </h2>
        <p className="mt-3 max-w-xl mx-auto text-sm leading-relaxed text-muted-foreground">
          Order a polished 10 or 15-second video, custom-scripted to your brand,
          with up to 3 revisions and 24-hour delivery — from $30.
        </p>
      </div>

      <div className="mt-9 grid gap-4 md:grid-cols-3">
        {PRICING.map((p) => (
          <div
            key={p.tier}
            className={cn(
              "flex flex-col items-start gap-3 rounded-xl border bg-ink-elevated/80 p-5 transition-colors",
              p.popular
                ? "border-gold/55 ring-1 ring-gold/30"
                : "border-border hover:border-gold/40",
            )}
          >
            <div className="flex w-full items-baseline justify-between">
              <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                {p.tier}
              </span>
              <span className="font-heading text-2xl text-gold-gradient">
                ${p.price}
              </span>
            </div>
            <p className="text-[13px] leading-snug text-bone/85">{p.name}</p>
            <a
              href={TIER_URLS[p.tier]}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "mt-auto inline-flex h-10 w-full items-center justify-center rounded-full px-4 text-[11px] font-semibold uppercase tracking-[0.22em] transition-all",
                p.popular
                  ? "bg-gold text-ink-deepest hover:bg-gold-light"
                  : "border border-gold/40 text-bone hover:border-gold hover:bg-gold/[0.06]",
              )}
            >
              Order {p.tier}
            </a>
          </div>
        ))}
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
        <a
          href={ORDER_URL_DEFAULT}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center justify-center rounded-full bg-gold px-6 text-[12px] font-semibold uppercase tracking-[0.22em] text-ink-deepest transition-all hover:bg-gold-light"
        >
          Order direct from $30
        </a>
      </div>
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        Or DM us @luxmotionai
      </p>
    </motion.div>
  );
}
