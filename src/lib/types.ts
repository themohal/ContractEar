export type PlanTier = "none" | "single" | "basic" | "pro";

export interface PlanConfig {
  name: string;
  tier: PlanTier;
  price: number;
  analyses: number;
  pricePerAnalysis: string;
  description: string;
  features: string[];
  popular?: boolean;
}

export const PLANS: PlanConfig[] = [
  {
    name: "Pay Per Use",
    tier: "single",
    price: 3.99,
    analyses: 1,
    pricePerAnalysis: "$3.99",
    description: "Perfect for one-off analysis",
    features: [
      "1 audio analysis",
      "Full AI transcription",
      "Commitment extraction",
      "Red flag detection",
      "Risk score & action items",
    ],
  },
  {
    name: "Basic",
    tier: "basic",
    price: 29,
    analyses: 20,
    pricePerAnalysis: "$1.45",
    description: "For professionals & small teams",
    features: [
      "20 analyses / month",
      "Full AI transcription",
      "Commitment extraction",
      "Red flag detection",
      "Risk score & action items",
      "PDF download",
      "Analysis history dashboard",
      "Priority processing",
    ],
    popular: true,
  },
  {
    name: "Pro",
    tier: "pro",
    price: 79,
    analyses: 50,
    pricePerAnalysis: "$1.58",
    description: "For teams & heavy users",
    features: [
      "50 analyses / month",
      "Full AI transcription",
      "Commitment extraction",
      "Red flag detection",
      "Risk score & action items",
      "PDF download",
      "Analysis history dashboard",
      "Priority processing",
    ],
  },
];

export interface AnalysisResult {
  summary: string;
  parties: { name: string; role: string }[];
  commitments: {
    speaker: string;
    commitment: string;
    quote: string;
    timestamp?: string;
  }[];
  deadlines: { description: string; date: string; speaker: string }[];
  financialTerms: {
    description: string;
    amount?: string;
    speaker: string;
  }[];
  liabilityStatements: {
    speaker: string;
    statement: string;
    quote: string;
  }[];
  redFlags: {
    issue: string;
    severity: "low" | "medium" | "high";
    quote?: string;
  }[];
  ambiguousTerms: {
    term: string;
    interpretation1: string;
    interpretation2: string;
  }[];
  actionItems: {
    action: string;
    assignedTo: string;
    deadline?: string;
  }[];
  riskScore: number;
  riskExplanation: string;
  duration: string;
  wordCount: number;
}

export interface AnalysisRow {
  id: string;
  user_id: string;
  file_name: string;
  audio_path: string;
  source_type: "upload" | "url";
  duration_seconds: number | null;
  status: "pending" | "paid" | "processing" | "completed" | "error";
  transcript: string | null;
  result: AnalysisResult | null;
  processing_error: string | null;
  paddle_transaction_id: string | null;
  tier: PlanTier;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  plan: PlanTier;
  analyses_used: number;
  analyses_limit: number;
  billing_cycle_start: string;
  paddle_subscription_id: string | null;
  paddle_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillingRecord {
  id: string;
  user_id: string;
  event_type: "subscription_created" | "subscription_renewed" | "subscription_canceled" | "single_payment";
  plan_tier: PlanTier;
  amount: number;
  currency: string;
  paddle_transaction_id: string | null;
  paddle_customer_id: string | null;
  paddle_subscription_id: string | null;
  status: "completed" | "refunded";
  created_at: string;
}

export interface UsageLog {
  id: string;
  user_id: string;
  analysis_id: string;
  plan_at_time: PlanTier;
  created_at: string;
}
