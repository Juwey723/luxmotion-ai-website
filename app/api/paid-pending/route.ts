import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import type { PaidOrderRecord } from "@/lib/order-types";

// Worker GET endpoint — same auth pattern as /api/sample-pending. Returns up
// to 5 oldest pending paid orders, each carrying the full denormalized intake
// payload so the worker can render the customer's brand on the end-card.
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

  // LPUSH'd to head, so the tail of the list is the oldest. Pull the last 5,
  // then reverse for oldest-first iteration.
  const tail =
    ((await kv.lrange<string>("paid-queue:pending", -5, -1)) as string[]) ?? [];
  const ids = [...tail].reverse();

  const orders: PaidOrderRecord[] = [];
  for (const id of ids) {
    const rec = await kv.get<PaidOrderRecord>(`paid-order:${id}`);
    if (!rec) continue;
    if (rec.status === "pending") orders.push(rec);
  }

  return NextResponse.json({ orders });
}
