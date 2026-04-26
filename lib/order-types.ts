import type { TierSlug } from "@/lib/tiers";

export type IntakeStatus = "intake" | "consumed";

export interface IntakeRecord {
  id: string; // UUID
  tier: TierSlug;
  productUrl: string;
  brandName: string;
  prompt: string | null;
  socialHandles: string | null; // managed-social only
  name: string;
  email: string;
  ip: string;
  createdAt: string; // ISO 8601
  status: IntakeStatus;
}

export type PaidOrderStatus = "pending" | "fulfilled" | "failed";

export interface PaidOrderRecord {
  /** Same UUID as the intake — we use it as the order ID end-to-end. */
  id: string;
  intakeId: string;
  tier: TierSlug;
  // Denormalized intake data so the worker only needs to read one key:
  productUrl: string;
  brandName: string;
  prompt: string | null;
  socialHandles: string | null;
  name: string;
  email: string;
  ip: string;
  // Shopify metadata captured by the webhook:
  shopifyOrderId: string;
  shopifyOrderName?: string;
  shopifyOrderNumber?: number;
  shopifyAmount?: string;
  shopifyCurrency?: string;
  paidAt: string; // ISO 8601
  // Fulfillment metadata, set by /api/order-fulfill:
  status: PaidOrderStatus;
  videoUrl?: string;
  fileSizeMb?: number;
  fulfilledAt?: string;
  fulfillmentEmailSent?: boolean;
  // Bookkeeping:
  createdAt: string; // mirrors intake.createdAt for sorting
}
