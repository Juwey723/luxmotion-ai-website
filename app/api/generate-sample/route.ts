import { fal } from "@fal-ai/client";
import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";

// Kling 2.1 standard takes 30–90s. Vercel Pro plan caps function duration at 300s.
export const runtime = "nodejs";
export const maxDuration = 300;

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FAL_MODEL = "fal-ai/kling-video/v2.1/standard/image-to-video";
const PROMPT =
  "Cinematic luxury product video, hyper-realistic motion, sparkling and glamorous, dark moody background with subtle bokeh, dramatic side-lighting, editorial magazine aesthetic, 4K detail, hero close-up shot";
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

async function scrapeOgImage(url: string): Promise<string | null> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    cache: "no-store",
    redirect: "follow",
  });
  if (!res.ok) return null;
  const html = await res.text();

  const og =
    html.match(
      /<meta[^>]+property=["']og:image(?::secure_url|:url)?["'][^>]+content=["']([^"']+)["']/i,
    ) ??
    html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url|:url)?["']/i,
    );
  if (og?.[1]) return abs(og[1], url);

  const tw =
    html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
  if (tw?.[1]) return abs(tw[1], url);

  return null;
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
  const dailyCap = Number(process.env.DAILY_GENERATION_CAP ?? "50");

  // 1. Has this email already used its free sample?
  const emailUsed = await kv.get(emailKey);
  if (emailUsed) {
    return NextResponse.json(
      { error: "You've already used your free sample. Order a paid version below." },
      { status: 429 },
    );
  }

  // 2. Per-IP abuse counter (incremented on every attempt, resets daily).
  const ipCount = (await kv.incr(ipKey)) as number;
  if (ipCount === 1) await kv.expire(ipKey, 60 * 60 * 24);
  if (ipCount > 5) {
    return NextResponse.json(
      { error: "Too many samples from your network today. Try again tomorrow or order direct." },
      { status: 429 },
    );
  }

  // 3. Global daily cap (read-only here; only incremented after a successful generation
  //    so failed scrapes / fal.ai errors don't burn the budget).
  const dailyCurrent = ((await kv.get(dailyKey)) as number | null) ?? 0;
  if (dailyCurrent >= dailyCap) {
    return NextResponse.json(
      { error: "Free samples maxed out for today. Order direct or come back tomorrow." },
      { status: 429 },
    );
  }

  // 4. Scrape OG image from the product page.
  let imageUrl: string | null = null;
  try {
    imageUrl = await scrapeOgImage(productUrl);
  } catch (e) {
    console.error("[generate-sample] OG scrape error:", e);
    return NextResponse.json(
      { error: "Couldn't reach your product page. Try a different URL or DM @luxmotionai." },
      { status: 400 },
    );
  }
  if (!imageUrl) {
    return NextResponse.json(
      { error: "Couldn't read your product image. Try a different URL or order direct." },
      { status: 400 },
    );
  }

  // 5. Generate the sample via fal.ai (Kling 2.1 standard, 5-second 9:16).
  let videoUrl = "";
  try {
    // @fal-ai/client's TS types map this endpoint to the v2-master input shape
    // (which omits `aspect_ratio`). The v2.1/standard endpoint does accept it
    // per fal.ai's published API, so we cast through `never` to bypass.
    const falInput = {
      image_url: imageUrl,
      prompt: PROMPT,
      duration: "5",
      aspect_ratio: "9:16",
    };
    const result = await fal.subscribe(FAL_MODEL, {
      input: falInput as never,
      logs: false,
    });
    const data = result.data as { video?: { url?: string } };
    videoUrl = data?.video?.url ?? "";
    if (!videoUrl) throw new Error("fal.ai returned no video URL");
  } catch (e: unknown) {
    const err = e as { message?: string; body?: unknown; status?: number };
    console.error(
      "[generate-sample] fal.ai error:",
      err.status ?? "",
      err.message ?? String(e),
      err.body ? JSON.stringify(err.body) : "",
    );
    return NextResponse.json(
      { error: "Generation failed. Try a different product image, or DM @luxmotionai for help." },
      { status: 502 },
    );
  }

  // 6. Commit success: increment daily counter, mark email as used, log entry.
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
      productImage: imageUrl,
      ts: new Date().toISOString(),
    }),
    { ex: 60 * 60 * 24 * 90 },
  );

  return NextResponse.json({ videoUrl, productImage: imageUrl });
}
