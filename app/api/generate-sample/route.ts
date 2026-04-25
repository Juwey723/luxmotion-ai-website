import { fal } from "@fal-ai/client";
import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";

// Pipeline: scrape OG -> Flux dev image-to-image (relight) -> Kling 2.1 Master.
// Master can take 60–120s; Flux adds 5–15s. Vercel Pro caps function duration at 300s.
export const runtime = "nodejs";
export const maxDuration = 300;

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Try Master first; fall back to Pro on plan/access errors. Pro supports the
// same input shape (5/10s duration, 9:16 aspect) and produces decent output at
// ~1/3 the cost.
const VIDEO_MODELS = [
  "fal-ai/kling-video/v2.1/master/image-to-video",
  "fal-ai/kling-video/v2.1/pro/image-to-video",
] as const;

// Flux dev image-to-image is the right tool for relighting a product photo
// while preserving the product itself (controlled by `strength`). The brief
// suggested `flux-pro/v1.1-ultra`, but that endpoint is text-to-image only —
// it has no image input, so it can't be used here.
const FLUX_MODEL = "fal-ai/flux/dev/image-to-image";

const VIDEO_PROMPT =
  "Cinematic luxury product video, hyper-realistic motion, sparkling and glamorous, dark moody background with subtle bokeh, dramatic side-lighting, editorial magazine aesthetic, 4K detail, hero close-up shot";

function fluxPrompt(productPhrase: string): string {
  const ofPart = productPhrase ? ` of ${productPhrase}` : "";
  return `Cinematic luxury product photography${ofPart}, dramatic studio lighting, dark moody background with subtle gradient, premium editorial aesthetic, hyper-realistic, sharp focus, professional brand-shot quality, hero composition`;
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

if (process.env.FAL_KEY) {
  fal.config({ credentials: process.env.FAL_KEY });
}

function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function abs(maybeRel: string, base: string): string {
  try {
    return new URL(maybeRel, base).toString();
  } catch {
    return maybeRel;
  }
}

async function scrapeProductMeta(
  url: string,
): Promise<{ imageUrl: string | null; title: string | null }> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    cache: "no-store",
    redirect: "follow",
  });
  if (!res.ok) return { imageUrl: null, title: null };
  const html = await res.text();

  let imageUrl: string | null = null;
  const ogImg =
    html.match(
      /<meta[^>]+property=["']og:image(?::secure_url|:url)?["'][^>]+content=["']([^"']+)["']/i,
    ) ??
    html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url|:url)?["']/i,
    );
  if (ogImg?.[1]) imageUrl = abs(ogImg[1], url);
  if (!imageUrl) {
    const tw =
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
    if (tw?.[1]) imageUrl = abs(tw[1], url);
  }

  let title: string | null = null;
  const ogTitle =
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
  if (ogTitle?.[1]) title = ogTitle[1];
  if (!title) {
    const t = html.match(/<title>([^<]+)<\/title>/i);
    if (t?.[1]) title = t[1].trim();
  }
  if (title) {
    title = title
      .replace(/&amp;/g, "&")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, " ")
      .trim();
    // Skip noisy long titles (whole-page tagline) — keep short product names.
    if (title.length === 0 || title.length > 80) title = null;
  }

  return { imageUrl, title };
}

async function preprocessImage(
  imageUrl: string,
  productTitle: string | null,
): Promise<string> {
  const input = {
    image_url: imageUrl,
    prompt: fluxPrompt(productTitle ?? ""),
    strength: 0.65, // preserve product silhouette while relighting + restyling
    num_inference_steps: 30,
    guidance_scale: 4.5,
  };
  const result = await fal.subscribe(FLUX_MODEL, {
    input: input as never,
    logs: false,
  });
  const data = result.data as { images?: { url?: string }[] };
  const out = data?.images?.[0]?.url;
  if (!out) throw new Error("Flux preprocessing returned no image URL");
  return out;
}

async function generateVideo(imageUrl: string): Promise<string> {
  let lastErr: unknown = null;
  for (const model of VIDEO_MODELS) {
    try {
      const result = await fal.subscribe(model, {
        // duration "5" works on both Master and Pro; the brief specified
        // "default to 5 for the free sample" since paid tiers offer 10/15s.
        input: {
          image_url: imageUrl,
          prompt: VIDEO_PROMPT,
          duration: "5",
        } as never,
        logs: false,
      });
      const data = result.data as { video?: { url?: string } };
      const out = data?.video?.url;
      if (!out) throw new Error("Kling returned no video URL");
      return out;
    } catch (e: unknown) {
      lastErr = e;
      const err = e as { message?: string; status?: number; body?: unknown };
      const msg = String(err.message ?? "").toLowerCase();
      const planError =
        err.status === 403 ||
        msg.includes("plan") ||
        msg.includes("access denied") ||
        msg.includes("forbidden") ||
        msg.includes("not enabled") ||
        msg.includes("not authorized") ||
        msg.includes("subscription");
      if (model.includes("master") && planError) {
        console.warn(
          "[generate-sample] Master tier unavailable, falling back to Pro:",
          err.message ?? String(e),
        );
        continue;
      }
      throw e;
    }
  }
  throw lastErr ?? new Error("All video models failed");
}

export async function POST(req: NextRequest) {
  if (!process.env.FAL_KEY) {
    console.error("[generate-sample] FAL_KEY missing in env");
    return NextResponse.json(
      { error: "Sample tool isn't configured. DM @luxmotionai." },
      { status: 500 },
    );
  }

  let body: { productUrl?: unknown; email?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const productUrl = String(body.productUrl ?? "").trim();

  if (!EMAIL_RX.test(email) || email.length > 254) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  try {
    const parsed = new URL(productUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("bad protocol");
    }
  } catch {
    return NextResponse.json(
      { error: "Please enter a valid product URL (must start with http:// or https://)." },
      { status: 400 },
    );
  }

  const ip = clientIp(req);
  const emailKey = `email:${email}`;
  const ipKey = `ip:${ip}`;
  const dailyKey = `daily-count:${todayKey()}`;
  // Master + Flux pipeline costs ~$1.45/sample. Default cap 20/day = ~$29/day
  // ceiling. Override via DAILY_GENERATION_CAP env var if you want to flex.
  const dailyCap = Number(process.env.DAILY_GENERATION_CAP ?? "20");

  const emailUsed = await kv.get(emailKey);
  if (emailUsed) {
    return NextResponse.json(
      { error: "You've already used your free sample. Order a paid version below." },
      { status: 429 },
    );
  }

  const ipCount = (await kv.incr(ipKey)) as number;
  if (ipCount === 1) await kv.expire(ipKey, 60 * 60 * 24);
  if (ipCount > 5) {
    return NextResponse.json(
      { error: "Too many samples from your network today. Try again tomorrow or order direct." },
      { status: 429 },
    );
  }

  const dailyCurrent = ((await kv.get(dailyKey)) as number | null) ?? 0;
  if (dailyCurrent >= dailyCap) {
    return NextResponse.json(
      { error: "Free samples maxed out for today. Order direct or come back tomorrow." },
      { status: 429 },
    );
  }

  // 1. Scrape OG image + title
  let scrapedImage: string | null;
  let productTitle: string | null;
  try {
    const meta = await scrapeProductMeta(productUrl);
    scrapedImage = meta.imageUrl;
    productTitle = meta.title;
  } catch (e) {
    console.error("[generate-sample] OG scrape error:", e);
    return NextResponse.json(
      { error: "Couldn't reach your product page. Try a different URL or DM @luxmotionai." },
      { status: 400 },
    );
  }
  if (!scrapedImage) {
    return NextResponse.json(
      { error: "Couldn't read your product image. Try a different URL or order direct." },
      { status: 400 },
    );
  }

  // 2. Pre-process via Flux. Fall back to the raw image if Flux fails so the
  //    user still gets a video — quality just steps down a notch.
  let processedImage: string;
  let preprocessed = false;
  try {
    processedImage = await preprocessImage(scrapedImage, productTitle);
    preprocessed = true;
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.warn(
      "[generate-sample] Flux preprocessing failed, using raw image:",
      err.message ?? String(e),
    );
    processedImage = scrapedImage;
  }

  // 3. Generate video via Kling Master (with Pro fallback on plan errors)
  let videoUrl: string;
  try {
    videoUrl = await generateVideo(processedImage);
  } catch (e: unknown) {
    const err = e as { message?: string; status?: number; body?: unknown };
    console.error(
      "[generate-sample] video generation failed:",
      err.status ?? "",
      err.message ?? String(e),
      err.body ? JSON.stringify(err.body).slice(0, 500) : "",
    );
    return NextResponse.json(
      { error: "Generation failed. Try a different product image, or DM @luxmotionai for help." },
      { status: 502 },
    );
  }

  // 4. Commit success
  const newDaily = (await kv.incr(dailyKey)) as number;
  if (newDaily === 1) await kv.expire(dailyKey, 60 * 60 * 30);
  await kv.set(emailKey, "1", { ex: 60 * 60 * 24 * 30 });
  await kv.set(
    `sample-log:${Date.now()}`,
    JSON.stringify({
      email,
      productUrl,
      ip,
      videoUrl,
      scrapedImage,
      processedImage,
      preprocessed,
      productTitle,
      ts: new Date().toISOString(),
    }),
    { ex: 60 * 60 * 24 * 90 },
  );

  return NextResponse.json({ videoUrl, productImage: processedImage });
}
