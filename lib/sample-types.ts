export type SampleStatus = "pending" | "fulfilled" | "failed";

export interface SampleRequestRecord {
  id: string;
  productUrl: string;
  email: string;
  name: string;
  notes: string | null;
  status: SampleStatus;
  createdAt: string;
  fulfilledAt?: string;
  videoUrl?: string;
  durationSeconds?: number;
  fileSizeMb?: number;
  ip: string;
  emailSent?: boolean;
  fulfillmentEmailSent?: boolean;
}
