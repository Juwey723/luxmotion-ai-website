import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

// Outbound prospect-pitch endpoint. Caller supplies the recipient list — this
// route does NOT pull from any DB or scrape. Auth is the standard worker
// bearer so no Resend key leaks to anyone outside the worker process.
export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_RECIPIENTS = 100;
const DEFAULT_DELAY_SECONDS = 90;
// Leave 20s headroom under maxDuration so the response can return cleanly.
const TIME_BUDGET_SECONDS = 280;

const EMAIL_RX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const FROM = "James from LuxMotion AI <hello@luxmotionai.com>";
const REPLY_TO = "hello@luxmotionai.com";

const SUBJECT_TEMPLATES: readonly string[] = [
  "{brandName} — quick idea",
  "your {productName} deserves a Dior-level ad",
  "$90 cinematic for {brandName}?",
  "saw your {productName} — quick thought",
  "for the {brandName} team",
  "free 5-sec sample for {brandName}?",
];

interface RecipientInput {
  email: string;
  brandName: string;
  productName?: string;
  niche?: string;
}

interface SendResult {
  email: string;
  ok: boolean;
  resendId?: string;
  error?: string;
}

function authorized(req: NextRequest): boolean {
  const expected = process.env.WORKER_SECRET;
  if (!expected) return false;
  const auth = req.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(auth);
  if (!m) return false;
  const provided = m[1];
  if (provided.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  } catch {
    return false;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function pickSubject(brandName: string, productName: string): string {
  const tpl =
    SUBJECT_TEMPLATES[Math.floor(Math.random() * SUBJECT_TEMPLATES.length)];
  return tpl
    .replaceAll("{brandName}", brandName)
    .replaceAll("{productName}", productName);
}

function buildBody(brandName: string, productNameOrFeed: string): {
  text: string;
  html: string;
} {
  const text = `Hey ${brandName} team,

Quick one — saw your ${productNameOrFeed} and your products are gorgeous, but your video ad game looks mostly stills right now. We do AI-generated cinematic product videos that look like they were shot on a $40k camera setup — except they're $30-90 each, no minimum, 24-hour delivery.

Real example: https://www.luxmotionai.com (homepage has 4-5 examples we made for our portfolio brand).

Free 5-second sample if you want to vibe-check first: https://www.luxmotionai.com/sample

Worth 60 seconds of your time?

— James
LuxMotion AI · luxmotionai.com`;

  const safeBrand = escapeHtml(brandName);
  const safePN = escapeHtml(productNameOrFeed);
  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.55;color:#222;max-width:560px">
<p>Hey ${safeBrand} team,</p>
<p>Quick one — saw your ${safePN} and your products are gorgeous, but your video ad game looks mostly stills right now. We do AI-generated cinematic product videos that look like they were shot on a $40k camera setup — except they're $30-90 each, no minimum, 24-hour delivery.</p>
<p>Real example: <a href="https://www.luxmotionai.com">luxmotionai.com</a> (homepage has 4-5 examples we made for our portfolio brand).</p>
<p>Free 5-second sample if you want to vibe-check first: <a href="https://www.luxmotionai.com/sample">luxmotionai.com/sample</a></p>
<p>Worth 60 seconds of your time?</p>
<p>— James<br>LuxMotion AI · luxmotionai.com</p>
</div>`;

  return { text, html };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeRecipient(raw: unknown): RecipientInput | string {
  if (!raw || typeof raw !== "object") return "recipient_not_object";
  const r = raw as Record<string, unknown>;
  const email = String(r.email ?? "").trim().toLowerCase();
  const brandName = String(r.brandName ?? "").trim();
  if (!EMAIL_RX.test(email)) return "invalid_email";
  if (!brandName) return "missing_brandName";
  const productName =
    r.productName == null ? undefined : String(r.productName).trim() || undefined;
  const niche = r.niche == null ? undefined : String(r.niche).trim() || undefined;
  return { email, brandName, productName, niche };
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    recipients?: unknown;
    delaySeconds?: unknown;
    dryRun?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!Array.isArray(body.recipients)) {
    return NextResponse.json(
      { error: "recipients must be an array." },
      { status: 400 },
    );
  }
  if (body.recipients.length === 0) {
    return NextResponse.json(
      { error: "recipients is empty." },
      { status: 400 },
    );
  }
  if (body.recipients.length > MAX_RECIPIENTS) {
    return NextResponse.json(
      { error: `Too many recipients; max ${MAX_RECIPIENTS} per call.` },
      { status: 400 },
    );
  }

  const delaySeconds =
    body.delaySeconds == null
      ? DEFAULT_DELAY_SECONDS
      : Number(body.delaySeconds);
  if (
    !Number.isFinite(delaySeconds) ||
    delaySeconds < 0 ||
    delaySeconds > 600
  ) {
    return NextResponse.json(
      { error: "delaySeconds must be a number 0..600." },
      { status: 400 },
    );
  }

  const dryRun = body.dryRun === true;

  // Time-budget guard so a synchronous batch can actually finish before Vercel kills the function.
  const recipientCount = body.recipients.length;
  const projectedSeconds =
    Math.max(0, recipientCount - 1) * delaySeconds + recipientCount * 2;
  if (!dryRun && projectedSeconds > TIME_BUDGET_SECONDS) {
    return NextResponse.json(
      {
        error: `Batch would take ~${projectedSeconds}s and exceed the ${TIME_BUDGET_SECONDS}s budget. Reduce recipients or delaySeconds (e.g., split into smaller batches).`,
      },
      { status: 400 },
    );
  }

  if (!dryRun && !process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "RESEND_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  const results: SendResult[] = [];
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < body.recipients.length; i++) {
    const r = normalizeRecipient(body.recipients[i]);
    if (typeof r === "string") {
      const emailGuess =
        body.recipients[i] && typeof body.recipients[i] === "object"
          ? String(
              (body.recipients[i] as Record<string, unknown>).email ?? "",
            )
          : "";
      results.push({ email: emailGuess, ok: false, error: r });
      failed++;
      continue;
    }

    const productNameForBody = r.productName ?? "feed";
    const productNameForSubject = r.productName ?? "product";
    const subject = pickSubject(r.brandName, productNameForSubject);
    const { html, text } = buildBody(r.brandName, productNameForBody);

    if (dryRun) {
      console.log(
        `[cold-email][dryRun] would send to=${r.email} brand=${r.brandName} subject="${subject}"`,
      );
      results.push({ email: r.email, ok: true, resendId: "dry-run" });
      // No Resend call, no inter-send sleep needed.
      continue;
    }

    try {
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM,
          to: [r.email],
          reply_to: REPLY_TO,
          subject,
          html,
          text,
        }),
      });
      const json = (await resp.json().catch(() => ({}))) as {
        id?: string;
        message?: string;
        name?: string;
      };
      if (resp.ok && json.id) {
        results.push({ email: r.email, ok: true, resendId: json.id });
        sent++;
      } else {
        results.push({
          email: r.email,
          ok: false,
          error: json.message ?? json.name ?? `resend_http_${resp.status}`,
        });
        failed++;
      }
    } catch (e) {
      console.error(`[cold-email] send threw for ${r.email}:`, e);
      results.push({
        email: r.email,
        ok: false,
        error: e instanceof Error ? e.message : "send_threw",
      });
      failed++;
    }

    if (i < body.recipients.length - 1 && delaySeconds > 0) {
      await sleep(delaySeconds * 1000);
    }
  }

  return NextResponse.json({
    sent,
    failed,
    dryRun,
    results,
  });
}
