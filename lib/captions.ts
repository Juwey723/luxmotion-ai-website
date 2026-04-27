import Anthropic from "@anthropic-ai/sdk";

// AI-generated social captions for Buffer posts. Falls back to a brand-aware
// template if ANTHROPIC_API_KEY isn't set or Claude returns malformed JSON.

export interface Caption {
  caption: string;
  hashtags: string[];
}

const FALLBACK_HASHTAGS = [
  "#newproduct",
  "#brandlaunch",
  "#aigenerated",
  "#trending",
  "#fyp",
];

const MAX_CAPTION_LENGTH = 200;
const MAX_HASHTAGS = 8;
const MIN_HASHTAGS = 5;

function templateCaption(args: {
  brandName: string;
  productName?: string | null;
}): Caption {
  const product = args.productName?.trim() || "our latest";
  const brand = args.brandName.trim() || "us";
  return {
    caption: `Introducing ${product} from ${brand}. ✨`.slice(0, MAX_CAPTION_LENGTH),
    hashtags: FALLBACK_HASHTAGS,
  };
}

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const MODEL = "claude-sonnet-4-6";

function stripJsonFences(text: string): string {
  // Claude sometimes wraps JSON in ```json ... ``` despite a JSON-only system
  // prompt. Strip that defensively before parsing.
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  }
  return t;
}

function sanitizeHashtag(h: unknown): string | null {
  if (typeof h !== "string") return null;
  const trimmed = h.trim().replace(/\s+/g, "");
  if (!trimmed) return null;
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

export async function generateCaptionAndHashtags(args: {
  brandName: string;
  productName?: string | null;
  niche?: string | null;
  audienceGoals?: string | null;
}): Promise<Caption> {
  if (!anthropic) {
    console.warn(
      "[captions] ANTHROPIC_API_KEY not configured — using template fallback",
    );
    return templateCaption(args);
  }

  const productPart = args.productName
    ? `about ${args.productName}`
    : "featuring a product";
  const nichePart = args.niche ? ` Brand niche / industry: ${args.niche}.` : "";
  const goalsPart = args.audienceGoals
    ? ` Target audience / goal: ${args.audienceGoals}.`
    : "";

  const userMsg = `Generate a punchy social media caption (under ${MAX_CAPTION_LENGTH} characters) and ${MIN_HASHTAGS}–${MAX_HASHTAGS} relevant hashtags for a short-form vertical video ${productPart} from ${args.brandName}.${nichePart}${goalsPart}

The caption should hook viewers in the first 8 words, sound human (not corporate), and avoid hard sales language. Hashtags should mix broad-reach tags (#fyp, #trending) with niche/brand-relevant ones.

Return ONLY a JSON object with this exact shape:
{"caption": "the caption text", "hashtags": ["#tag1", "#tag2", "..."]}

No markdown, no commentary, just the JSON.`;

  try {
    const resp = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 400,
      system:
        "You produce JSON-only responses. No markdown, no commentary, just the requested JSON object.",
      messages: [{ role: "user", content: userMsg }],
    });

    const block = resp.content[0];
    if (!block || block.type !== "text") {
      throw new Error("Claude returned non-text content");
    }

    const text = stripJsonFences(block.text);
    const parsed = JSON.parse(text) as {
      caption?: unknown;
      hashtags?: unknown;
    };

    if (typeof parsed.caption !== "string" || !Array.isArray(parsed.hashtags)) {
      throw new Error("Missing caption or hashtags in Claude response");
    }

    const caption = parsed.caption.trim().slice(0, MAX_CAPTION_LENGTH + 20);
    const hashtags = parsed.hashtags
      .map(sanitizeHashtag)
      .filter((h): h is string => h !== null)
      .slice(0, MAX_HASHTAGS);

    if (!caption || hashtags.length < MIN_HASHTAGS) {
      throw new Error("Caption too short or hashtags insufficient");
    }

    return { caption, hashtags };
  } catch (e) {
    console.warn(
      "[captions] Claude generation failed, using template fallback:",
      e instanceof Error ? e.message : String(e),
    );
    return templateCaption(args);
  }
}

/** Joins caption + hashtags into a single string Buffer accepts in `text`. */
export function captionToText(c: Caption): string {
  return `${c.caption}\n\n${c.hashtags.join(" ")}`;
}
