import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";
import {
  sendAdminNotification,
  sendCustomerConfirmation,
} from "@/lib/emails";
import type { SampleRequestRecord } from "@/lib/sample-types";

export const runtime = "nodejs";
export const maxDuration = 30;

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: NextRequest) {
  let body: {
    productUrl?: unknown;
    email?: unknown;
    name?: unknown;
    notes?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const productUrl = String(body.productUrl ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const name = String(body.name ?? "").trim();
  const notesRaw = String(body.notes ?? "").trim();
  const notes = notesRaw ? notesRaw.slice(0, 1000) : null;

  if (!EMAIL_RX.test(email) || email.length > 254) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }
  if (name.length < 2 || name.length > 80) {
    return NextResponse.json(
      { error: "Please enter your name (at least 2 characters)." },
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
  const emailKey = `email-sample:${email}`;
  const ipKey = `ip-sample:${ip}`;

  const emailUsed = await kv.get(emailKey);
  if (emailUsed) {
    return NextResponse.json(
      { error: "You've already requested a free sample. Order a paid version below." },
      { status: 429 },
    );
  }

  const ipCount = (await kv.incr(ipKey)) as number;
  if (ipCount === 1) await kv.expire(ipKey, 60 * 60 * 24);
  if (ipCount > 3) {
    return NextResponse.json(
      { error: "Too many sample requests from your network today. Try again tomorrow or order direct." },
      { status: 429 },
    );
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const record: SampleRequestRecord = {
    id,
    productUrl,
    email,
    name,
    notes,
    status: "pending",
    createdAt,
    ip,
  };

  // Persist for 60 days; refreshed on fulfillment.
  await kv.set(`sample-request:${id}`, record, { ex: 60 * 60 * 24 * 60 });
  // Push to head; worker reads tail (oldest) via /api/sample-pending.
  await kv.lpush("sample-queue:pending", id);
  // Per-email lock: 7 days per brief.
  await kv.set(emailKey, id, { ex: 60 * 60 * 24 * 7 });

  // Email sends are non-blocking — log and continue if Resend isn't ready.
  const customerEmailed = await sendCustomerConfirmation({
    to: email,
    name,
    productUrl,
    notes,
  });
  await sendAdminNotification({
    requestId: id,
    email,
    name,
    productUrl,
    notes,
    ip,
    createdAt,
  });

  if (customerEmailed) {
    record.emailSent = true;
    await kv.set(`sample-request:${id}`, record, { ex: 60 * 60 * 24 * 60 });
  }

  return NextResponse.json({ success: true, requestId: id });
}
