export type Persona = "agent" | "adjuster";

export type ClaimStatus =
  | "NEW"
  | "AGENT_REVIEW"
  | "ADJUSTER_REVIEW_AUTO_ROUTED"
  | "ADJUSTER_REVIEW_POST_AGENT"
  | "APPROVED"
  | "RETURNED"
  | "ESCALATED";

// Line-item cost breakdown — mirrors how a claims agent builds an estimate
// against a standardized repair-cost database (Mitchell / CCC / Audatex).
export type CostBreakdown = {
  partType: "OEM" | "aftermarket" | "n/a";
  partsCost: number;
  laborHours: number;
  laborRate: number; // regional $/hr
  costSource: string; // e.g. "Mitchell APD line-item", "CCC ONE", "carrier rate sheet"
};

// Human feedback on a single AI finding. This is the disagreement-capture
// signal — every confirmation and correction becomes labeled data for model eval.
export type FindingFeedback = {
  state: "confirmed" | "adjusted";
  by: Persona;
  at: string;
  // populated when state === "adjusted"
  newCost?: number;
  newRecommendation?: "repair" | "replace";
  reason?: string;
};

export type DamageFinding = {
  area: string;
  damageType: string;
  severity: 1 | 2 | 3 | 4 | 5;
  recommendation: "repair" | "replace";
  estimatedCost: number;
  confidence: number;
  supplementRisk: "low" | "medium" | "high";
  rationale: string;
  costBreakdown: CostBreakdown;
  feedback?: FindingFeedback;
};

export type AIAssessment = {
  findings: DamageFinding[];
  totalEstimate: number;
  overallConfidence: number;
  repairToAcvRatio: number;
  potentialTotalLoss: boolean;
  fraudAdvisory: {
    triggered: boolean;
    reason?: string;
  };
  recommendedRoute:
    | "AGENT_REVIEW"
    | "ADJUSTER_REVIEW_AUTO_ROUTED"
    | "ADJUSTER_REVIEW_POTENTIAL_TOTAL_LOSS"
    | "ADJUSTER_REVIEW_FRAUD_FLAGGED";
  routeRationale: string;
  rationale: string;
};

export type Claim = {
  id: string;
  policyNumber: string;
  claimantName: string;
  vehicle: {
    year: number;
    make: string;
    model: string;
    trim: string;
    acv: number;
  };
  accident: {
    date: string;
    location: string;
    description: string;
  };
  photos: string[];
  status: ClaimStatus;
  receivedAt: string;
  assessment: AIAssessment | null;
  decisionHistory: Array<{
    by: Persona | "system";
    action: string;
    at: string;
    note?: string;
  }>;
};
