export type LeadStatus = "new" | "contacted" | "interested" | "closed";
export type DeliveryChannel = "sms" | "email";
export type DeliveryStatus = "pending" | "sent" | "failed";
export type CampaignStatus = "draft" | "sent" | "partial";
export type SalesmanTone = "aggressive" | "consultative" | "friendly" | "urgent";

export interface Lead {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  company?: string | null;
  industry?: string | null;
  tags: string[];
  status: LeadStatus;
  notes?: string | null;
  source?: string | null;
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  industry?: string | null;
  originalPrompt: string;
  enhancedPrompt: string;
  subject?: string | null;
  status: CampaignStatus;
  sentAt?: string | null;
  createdAt: string;
  deliveries?: Delivery[];
  _count?: { deliveries: number };
}

export interface Delivery {
  id: string;
  leadId: string;
  campaignId: string;
  channel: DeliveryChannel;
  status: DeliveryStatus;
  error?: string | null;
  sentAt?: string | null;
  lead?: Lead;
}

export interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface EnhanceResult {
  smsMessage: string;
  emailMessage: string;
  subject: string;
  callToAction: string;
}

export interface GeneratedLead {
  name: string;
  company: string;
  phone?: string;
  email?: string;
  website?: string;
  notes?: string;
}
