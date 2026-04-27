import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { listBufferProfiles } from "@/lib/buffer";

// Admin helper: list all channels currently connected to our Buffer account.
// Used during customer onboarding — the admin connects the customer's IG /
// TikTok / etc inside Buffer's UI, then hits this endpoint to get the new
// profile IDs and writes them onto the customer's `paid-order:<id>.bufferProfileIds`.
//
// Same WORKER_SECRET bearer as the rest of the worker-side endpoints.
export const runtime = "nodejs";

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

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.BUFFER_ACCESS_TOKEN) {
    return NextResponse.json(
      { error: "BUFFER_ACCESS_TOKEN not configured" },
      { status: 500 },
    );
  }

  const result = await listBufferProfiles();
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  // Return a tight projection — id + service + handle is all the admin needs
  // to map a channel onto a customer's order.
  const channels = result.value.map((p) => ({
    id: p.id,
    service: p.service,
    handle: p.formatted_username ?? p.service_username ?? null,
    avatar: p.avatar_https ?? p.avatar ?? null,
  }));

  return NextResponse.json({ count: channels.length, channels });
}
