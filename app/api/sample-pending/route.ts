import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import type { SampleRequestRecord } from "@/lib/sample-types";

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

  // Items are LPUSH'd to the head, so the tail of the list is the oldest.
  // LRANGE -5 -1 returns the last 5 entries; reverse for absolute-oldest-first.
  const tail =
    ((await kv.lrange<string>("sample-queue:pending", -5, -1)) as string[]) ?? [];
  const ids = [...tail].reverse();

  const records: SampleRequestRecord[] = [];
  for (const id of ids) {
    const rec = await kv.get<SampleRequestRecord>(`sample-request:${id}`);
    if (!rec) continue;
    if (rec.status === "pending") records.push(rec);
  }

  return NextResponse.json({ requests: records });
}
