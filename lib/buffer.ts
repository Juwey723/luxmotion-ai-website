// Thin wrapper around Buffer's v1 REST API. We call it server-side from
// /api/buffer-post (worker-triggered) and /api/buffer-channels (admin).
//
// Buffer's v1 API uses application/x-www-form-urlencoded for POST bodies and
// supports both `Authorization: Bearer <token>` and `?access_token=<token>`
// auth — we use the header form so the token never lands in URL logs.

const BUFFER_API_BASE = "https://api.bufferapp.com/1";

export interface BufferProfile {
  id: string;
  /** "instagram" | "tiktok" | "twitter" | "facebook" | "linkedin" | "pinterest" | etc. */
  service: string;
  formatted_username?: string;
  service_username?: string;
  avatar?: string;
  avatar_https?: string;
}

export interface BufferUpdate {
  id: string;
  profile_id: string;
  /** Buffer service, e.g. "instagram". */
  service?: string;
  text?: string;
  /** Unix timestamp when Buffer will post (set when `now: false`). */
  scheduled_at?: number;
  /** Unix timestamp Buffer expects the post to be due. */
  due_at?: number;
  status?: string;
}

interface CreateUpdateResponse {
  success?: boolean;
  message?: string;
  buffer_response?: { updates?: BufferUpdate[] };
  /** Errors come back in different shapes; capture loosely. */
  errors?: unknown;
  /** Buffer also returns a flat `updates` array sometimes. */
  updates?: BufferUpdate[];
}

function bufferToken(): string | null {
  return process.env.BUFFER_ACCESS_TOKEN ?? null;
}

export type BufferResult<T> =
  | { ok: true; value: T }
  | { ok: false; status: number; error: string };

export async function listBufferProfiles(): Promise<
  BufferResult<BufferProfile[]>
> {
  const token = bufferToken();
  if (!token) {
    return {
      ok: false,
      status: 500,
      error: "BUFFER_ACCESS_TOKEN not configured",
    };
  }

  let res: Response;
  try {
    res = await fetch(`${BUFFER_API_BASE}/profiles.json`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch (e) {
    return {
      ok: false,
      status: 502,
      error: `Buffer fetch threw: ${(e as Error).message}`,
    };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return {
      ok: false,
      status: res.status,
      error: `Buffer API ${res.status}: ${body.slice(0, 200)}`,
    };
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch (e) {
    return {
      ok: false,
      status: 502,
      error: `Buffer JSON parse failed: ${(e as Error).message}`,
    };
  }

  if (!Array.isArray(data)) {
    return {
      ok: false,
      status: 502,
      error: "Buffer profile list response wasn't an array",
    };
  }

  return { ok: true, value: data as BufferProfile[] };
}

export interface CreateUpdateArgs {
  profileIds: string[];
  /** Caption + hashtags joined into one string. */
  text: string;
  /** Public video URL (Vercel Blob). Buffer downloads + uploads to each network. */
  videoUrl: string;
  /** True = post immediately, false = enqueue at next slot per profile's schedule. */
  postNow?: boolean;
  /** Optional thumbnail URL (Buffer can synthesize one from the video). */
  thumbnailUrl?: string;
}

export async function createBufferUpdate(
  args: CreateUpdateArgs,
): Promise<BufferResult<BufferUpdate[]>> {
  const token = bufferToken();
  if (!token) {
    return {
      ok: false,
      status: 500,
      error: "BUFFER_ACCESS_TOKEN not configured",
    };
  }
  if (args.profileIds.length === 0) {
    return { ok: false, status: 400, error: "No profile IDs supplied" };
  }
  if (!args.text.trim()) {
    return { ok: false, status: 400, error: "Caption text is empty" };
  }

  // Buffer v1 wants form-encoded body, with `profile_ids[]` repeated and
  // `media[video]` for the video URL.
  const params = new URLSearchParams();
  for (const id of args.profileIds) params.append("profile_ids[]", id);
  params.set("text", args.text);
  params.set("media[video]", args.videoUrl);
  if (args.thumbnailUrl) params.set("media[thumbnail]", args.thumbnailUrl);
  params.set("now", args.postNow ? "true" : "false");

  let res: Response;
  try {
    res = await fetch(`${BUFFER_API_BASE}/updates/create.json`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: params.toString(),
    });
  } catch (e) {
    return {
      ok: false,
      status: 502,
      error: `Buffer fetch threw: ${(e as Error).message}`,
    };
  }

  let data: CreateUpdateResponse | null = null;
  try {
    data = (await res.json()) as CreateUpdateResponse;
  } catch {
    /* swallow — fall through to status check */
  }

  if (!res.ok) {
    const detail =
      (data?.message ?? "") ||
      (data?.errors ? JSON.stringify(data.errors).slice(0, 200) : "");
    return {
      ok: false,
      status: res.status,
      error: `Buffer API ${res.status}: ${detail || "(no detail)"}`,
    };
  }

  const updates =
    data?.buffer_response?.updates ?? data?.updates ?? [];
  if (data?.success === false || updates.length === 0) {
    return {
      ok: false,
      status: 502,
      error: data?.message ?? "Buffer accepted the request but returned no updates",
    };
  }

  return { ok: true, value: updates };
}
