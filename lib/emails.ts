import { Resend } from "resend";
import { intakePath, SINGLE_TIERS, TIERS, type TierSlug } from "@/lib/tiers";
import {
  POSTING_FREQUENCY_LABELS,
  type PostingFrequency,
  type PremiumFormat,
  type StyleMix,
} from "@/lib/order-types";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Fall back to Resend's shared sandbox sender when no verified domain is set.
// For production deliverability set RESEND_FROM_EMAIL to a verified address,
// e.g. `LuxMotion AI <hello@luxmotionai.com>`.
const FROM = process.env.RESEND_FROM_EMAIL ?? "LuxMotion AI <onboarding@resend.dev>";

const ADMIN_EMAIL = "jawaduweyda2@gmail.com";
const SITE = "https://www.luxmotionai.com";
const PRICING_URL = `${SITE}/#pricing`;
const REVIEW_MAILTO = `mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent("Review: LuxMotion AI video")}`;
const BUFFER_SETUP_MAILTO = `mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent("Managed Social — Buffer setup help")}`;
const SUPPORT_MAILTO = `mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent("LuxMotion AI — Managed Social question")}`;

function intakeAbsoluteUrl(slug: TierSlug): string {
  return `${SITE}${intakePath(slug)}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function emailShell(content: string, preheader?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
  </head>
  <body style="margin:0;padding:0;background:#070707;color:#f5f0e6;font-family:'Helvetica Neue',Arial,sans-serif">
    ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;color:#070707">${escapeHtml(preheader)}</div>` : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#070707">
      <tr>
        <td align="center" style="padding:40px 20px">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;width:100%">
            <tr>
              <td style="padding:0 0 32px 0;text-align:left">
                <a href="${SITE}" style="text-decoration:none;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:28px;color:#c9a860">LuxMotion AI</a>
              </td>
            </tr>
            <tr>
              <td style="background:#0e0e0e;border:1px solid rgba(140,111,53,0.22);border-radius:12px;padding:40px;color:#f5f0e6;font-size:15px;line-height:1.6">
                ${content}
              </td>
            </tr>
            <tr>
              <td align="left" style="padding:32px 0 0 0;color:#8c6f35;font-size:11px;letter-spacing:0.22em;text-transform:uppercase">
                Cinematic AI Ad Studio · <a href="${SITE}" style="color:#8c6f35;text-decoration:none">luxmotionai.com</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function goldButton(href: string, label: string): string {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;background:#c9a860;color:#070707;text-decoration:none;padding:14px 28px;border-radius:9999px;font-weight:600;font-size:13px;letter-spacing:0.18em;text-transform:uppercase">${escapeHtml(label)}</a>`;
}

function ghostButton(href: string, label: string): string {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;border:1px solid rgba(201,168,96,0.5);color:#f5f0e6;text-decoration:none;padding:13px 26px;border-radius:9999px;font-weight:600;font-size:13px;letter-spacing:0.18em;text-transform:uppercase">${escapeHtml(label)}</a>`;
}

function tierMiniRow(): string {
  // Email upsell shows the 3 single-shot tiers — bundles + recurring service
  // are bigger commitments and don't make sense as one-line upsells.
  return SINGLE_TIERS.map(
    (t) =>
      `<a href="${escapeHtml(intakeAbsoluteUrl(t.slug))}" style="display:inline-block;margin:4px 6px 4px 0;padding:8px 14px;border:1px solid rgba(201,168,96,0.5);border-radius:9999px;color:#f5f0e6;text-decoration:none;font-size:12px;letter-spacing:0.16em;text-transform:uppercase">${escapeHtml(t.shortName)} · $${t.price}</a>`,
  ).join("");
}

function detailsTable(rows: Array<[string, string]>): string {
  const tableRows = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 12px 8px 0;color:#8c6f35;text-transform:uppercase;font-size:11px;letter-spacing:0.18em;vertical-align:top;white-space:nowrap">${escapeHtml(k)}</td><td style="padding:8px 0;color:#f5f0e6;word-break:break-all;font-size:14px;white-space:pre-wrap">${escapeHtml(v)}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%">${tableRows}</table>`;
}

function formatStyleMix(m: StyleMix): string {
  return `Hyper Motion ${m.hyperMotion} / Soul ${m.soul} / Cinema ${m.cinema}`;
}

function formatPremiumFormat(f: PremiumFormat): string {
  return f === "3x10s" ? "Three 10-second videos" : "Two 15-second videos";
}

function formatPostingFrequency(
  f: PostingFrequency,
  custom: string | null | undefined,
): string {
  const label = POSTING_FREQUENCY_LABELS[f];
  if (f === "custom" && custom) return `${label}\n  → ${custom}`;
  return label;
}

// ─── Sample-pipeline emails ───────────────────────────────────────────────

export async function sendCustomerConfirmation(args: {
  to: string;
  name: string;
  productUrl: string;
  notes: string | null;
}): Promise<boolean> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY missing, skipping customer confirmation");
    return false;
  }
  const productLink = escapeHtml(args.productUrl);
  const html = emailShell(
    `<h1 style="margin:0 0 24px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#c9a860">Hey ${escapeHtml(args.name)},</h1>
    <p style="margin:0 0 16px">We got your request for <a href="${productLink}" style="color:#c9a860;word-break:break-all">${productLink}</a>.</p>
    <p style="margin:0 0 16px">We're producing your free 5-second cinematic sample now. Expect it in your inbox in about <strong style="color:#c9a860">30 minutes</strong>.</p>
    ${args.notes ? `<p style="margin:24px 0;padding:12px 16px;border-left:2px solid #c9a860;color:#a89472;font-style:italic">"${escapeHtml(args.notes)}"</p>` : ""}
    <p style="margin:32px 0 0;color:#8c6f35;font-size:13px">— LuxMotion AI</p>`,
    "Your free LuxMotion AI sample is in production",
  );

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: args.to,
      subject: "Your LuxMotion AI sample is in production",
      html,
    });
    if (error) {
      console.warn("[email] customer confirmation Resend error:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[email] customer confirmation send failed:", e);
    return false;
  }
}

export async function sendAdminNotification(args: {
  requestId: string;
  email: string;
  name: string;
  productUrl: string;
  notes: string | null;
  ip: string;
  createdAt: string;
}): Promise<boolean> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY missing, skipping admin notification");
    return false;
  }
  const rows: Array<[string, string]> = [
    ["Request ID", args.requestId],
    ["Email", args.email],
    ["Name", args.name],
    ["Product URL", args.productUrl],
    ["Notes", args.notes ?? "(none)"],
    ["IP", args.ip],
    ["Created", args.createdAt],
  ];
  const html = emailShell(
    `<h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;color:#c9a860">New sample request</h1>
    ${detailsTable(rows)}`,
    `New sample request from ${args.email}`,
  );

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `[LuxMotion AI] New sample request from ${args.email}`,
      html,
    });
    if (error) {
      console.warn("[email] admin notification Resend error:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[email] admin notification send failed:", e);
    return false;
  }
}

export async function sendCustomerFulfillment(args: {
  to: string;
  name: string;
  videoUrl: string;
}): Promise<boolean> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY missing, skipping fulfillment email");
    return false;
  }
  const html = emailShell(
    `<h1 style="margin:0 0 24px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#c9a860">Hey ${escapeHtml(args.name)},</h1>
    <p style="margin:0 0 24px">Your sample is done.</p>
    <p style="margin:0 0 28px">${goldButton(args.videoUrl, "Watch your sample")}</p>
    <p style="margin:0 0 12px;color:#a89472">If you like it, the polished 10 or 15-second version — with custom script and brand-matched aesthetic — is from $30:</p>
    <p style="margin:8px 0 24px">${tierMiniRow()}</p>
    <p style="margin:0 0 8px"><a href="${PRICING_URL}" style="color:#c9a860">See full pricing →</a></p>
    <p style="margin:32px 0 0;color:#8c6f35;font-size:13px">— LuxMotion AI</p>`,
    "Your free LuxMotion AI sample is ready",
  );

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: args.to,
      subject: "Your free LuxMotion AI sample is ready",
      html,
    });
    if (error) {
      console.warn("[email] fulfillment Resend error:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[email] fulfillment send failed:", e);
    return false;
  }
}

// ─── Paid-order emails ────────────────────────────────────────────────────

export async function sendCustomerOrderFulfillment(args: {
  to: string;
  name: string;
  brandName: string;
  tier: TierSlug;
  videoUrl: string;
}): Promise<boolean> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY missing, skipping order fulfillment");
    return false;
  }
  const tier = TIERS[args.tier];
  const html = emailShell(
    `<h1 style="margin:0 0 24px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#c9a860">Hey ${escapeHtml(args.name)},</h1>
    <p style="margin:0 0 16px">Your <strong style="color:#c9a860">${escapeHtml(tier.shortName)}</strong> order is complete — branded for <strong style="color:#c9a860">${escapeHtml(args.brandName)}</strong>.</p>
    <p style="margin:0 0 28px">${goldButton(args.videoUrl, "Watch + download")}</p>
    <p style="margin:0 0 16px">Direct download link if you need it:<br/><a href="${escapeHtml(args.videoUrl)}" style="color:#c9a860;word-break:break-all;font-size:13px">${escapeHtml(args.videoUrl)}</a></p>
    <p style="margin:32px 0 24px;color:#a89472">Thanks for ordering with LuxMotion AI. If this hit, leaving a quick line of feedback helps a lot:</p>
    <p style="margin:0 0 24px">${ghostButton(REVIEW_MAILTO, "Leave a review")}</p>
    <p style="margin:32px 0 0;color:#8c6f35;font-size:13px">— LuxMotion AI</p>`,
    `Your LuxMotion AI ${tier.shortName} video is ready`,
  );

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: args.to,
      subject: "Your LuxMotion AI video is ready",
      html,
    });
    if (error) {
      console.warn("[email] order fulfillment Resend error:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[email] order fulfillment send failed:", e);
    return false;
  }
}

export interface AdminOrderArgs {
  orderId: string;
  intakeId: string;
  tier: TierSlug;
  brandName: string;
  productUrl: string;
  productUrls?: string[];
  prompt: string | null;
  customerName: string;
  customerEmail: string;
  ip: string;
  shopifyOrderId: string;
  shopifyOrderName?: string;
  shopifyAmount?: string;
  shopifyCurrency?: string;
  paidAt: string;
  // Premium:
  premiumFormat?: PremiumFormat;
  // Content Pack:
  styleMix?: StyleMix;
  postingPlan?: string | null;
  // Managed Social:
  instagramHandle?: string | null;
  tiktokHandle?: string | null;
  otherSocials?: string | null;
  postingFrequency?: PostingFrequency;
  postingFrequencyCustom?: string | null;
  brandVoice?: string | null;
  audienceGoals?: string | null;
  bufferEmail?: string | null;
  socialHandles?: string | null; // legacy
}

export async function sendAdminOrderNotification(
  args: AdminOrderArgs,
): Promise<boolean> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY missing, skipping admin order notification");
    return false;
  }
  const tier = TIERS[args.tier];
  const amountStr =
    args.shopifyAmount && args.shopifyCurrency
      ? `${args.shopifyAmount} ${args.shopifyCurrency}`
      : `$${tier.price}${tier.priceSuffix}`;

  const rows: Array<[string, string]> = [
    ["Tier", tier.label],
    ["Amount", amountStr],
    ["Brand", args.brandName],
    ["Customer", `${args.customerName} <${args.customerEmail}>`],
  ];

  // Tier-specific rows ──────────────────────────────────────────────────
  if (args.tier === "premium" && args.premiumFormat) {
    rows.push(["Premium Format", formatPremiumFormat(args.premiumFormat)]);
  }

  if (args.tier === "content-pack") {
    if (args.productUrls && args.productUrls.length > 0) {
      rows.push([
        `Product URLs (${args.productUrls.length})`,
        args.productUrls.map((u, i) => `${i + 1}. ${u}`).join("\n"),
      ]);
    } else {
      rows.push(["Product URL", args.productUrl]);
    }
    if (args.styleMix) {
      rows.push(["Style Mix", formatStyleMix(args.styleMix)]);
    }
    if (args.postingPlan) {
      rows.push(["Posting Plan", args.postingPlan]);
    }
  } else {
    rows.push(["Product URL", args.productUrl]);
  }

  if (args.tier === "managed-social") {
    if (args.instagramHandle) rows.push(["Instagram", args.instagramHandle]);
    if (args.tiktokHandle) rows.push(["TikTok", args.tiktokHandle]);
    if (args.otherSocials) rows.push(["Other Socials", args.otherSocials]);
    if (args.postingFrequency) {
      rows.push([
        "Posting Frequency",
        formatPostingFrequency(args.postingFrequency, args.postingFrequencyCustom),
      ]);
    }
    if (args.brandVoice) rows.push(["Brand Voice", args.brandVoice]);
    if (args.audienceGoals) rows.push(["Audience / Goals", args.audienceGoals]);
    if (args.bufferEmail) rows.push(["Buffer Email", args.bufferEmail]);
  }

  rows.push(["Prompt / Notes", args.prompt ?? "(none)"]);
  rows.push(["Order ID", args.orderId]);
  rows.push(["Intake ID", args.intakeId]);
  rows.push(["Shopify Order", args.shopifyOrderName ?? args.shopifyOrderId]);
  rows.push(["IP", args.ip]);
  rows.push(["Paid At", args.paidAt]);

  const html = emailShell(
    `<h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;color:#c9a860">PAID order — ${escapeHtml(tier.shortName)}</h1>
    ${detailsTable(rows)}`,
    `PAID order: ${tier.shortName} from ${args.customerEmail}`,
  );

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `[LuxMotion AI] PAID order: ${tier.shortName} from ${args.customerEmail}`,
      html,
    });
    if (error) {
      console.warn("[email] admin order notification Resend error:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[email] admin order notification send failed:", e);
    return false;
  }
}

/**
 * Concierge-tier post-payment email for Managed Social customers ($600/mo).
 *
 * Fired from /api/order-paid right after the admin notification, only for
 * `managed-social` orders. Walks the customer through Buffer setup so they
 * know what to do between checkout completion and the first video going up.
 */
export async function sendManagedSocialPostPayment(args: {
  to: string;
  name: string;
  brandName: string;
  instagramHandle: string | null;
  tiktokHandle: string | null;
}): Promise<boolean> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY missing, skipping managed-social welcome");
    return false;
  }
  const handlesLine: string[] = [];
  if (args.instagramHandle) handlesLine.push(`Instagram <strong style="color:#c9a860">${escapeHtml(args.instagramHandle)}</strong>`);
  if (args.tiktokHandle) handlesLine.push(`TikTok <strong style="color:#c9a860">${escapeHtml(args.tiktokHandle)}</strong>`);
  const handles = handlesLine.length ? handlesLine.join(" and ") : "your social accounts";

  const html = emailShell(
    `<h1 style="margin:0 0 24px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#c9a860">Welcome, ${escapeHtml(args.name)}.</h1>

    <p style="margin:0 0 16px">You're in. We're producing your first month of content for <strong style="color:#c9a860">${escapeHtml(args.brandName)}</strong> right now — 12 cinematic AI videos in mixed styles, posted on ${handles} via Buffer.</p>

    <h2 style="margin:32px 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:400;color:#c9a860">Two things to do this week</h2>

    <p style="margin:0 0 12px"><strong style="color:#f0dca0">1. Connect your IG + TikTok to Buffer</strong></p>
    <p style="margin:0 0 20px;color:#a89472">We'll handle posting from there. Hit the button below and we'll walk you through the 5-minute setup.</p>
    <p style="margin:0 0 28px">${goldButton(BUFFER_SETUP_MAILTO, "Buffer setup help")}</p>

    <p style="margin:0 0 12px"><strong style="color:#f0dca0">2. Watch your inbox</strong></p>
    <p style="margin:0 0 24px;color:#a89472">We'll begin posting within 24 hours of Buffer connection. End-of-month, you'll get an analytics report — views, clicks, conversions, top performers, and what we recommend doubling down on.</p>

    <p style="margin:32px 0 16px;padding:14px 16px;border-left:2px solid #c9a860;color:#a89472;font-style:italic">All 12 videos are yours with full commercial use license. Cancel anytime — no minimum commitment.</p>

    <p style="margin:32px 0 24px;color:#a89472">Questions? Just reply to this email or hit the button:</p>
    <p style="margin:0 0 24px">${ghostButton(SUPPORT_MAILTO, "Talk to us")}</p>

    <p style="margin:32px 0 0;color:#8c6f35;font-size:13px">— LuxMotion AI</p>`,
    "Welcome to Managed Social — set up Buffer to start posting",
  );

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: args.to,
      subject: "Welcome to Managed Social — set up Buffer to start posting",
      html,
    });
    if (error) {
      console.warn("[email] managed-social welcome Resend error:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[email] managed-social welcome send failed:", e);
    return false;
  }
}
