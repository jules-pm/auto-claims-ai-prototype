export type Persona = "agent" | "adjuster";

export type ClaimStatus =
  | "NEW"
  | "AGENT_REVIEW"
  | "ADJUSTER_REVIEW_AUTO_ROUTED"
  | "ADJUSTER_REVIEW_POST_AGENT"
  | "APPROVED"
  | "RETURNED"
  | "ESCALATED";

export type DamageFinding = {
  area: string;
  damageType: string;
  severity: 1 | 2 | 3 | 4 | 5;
  recommendation: "repair" | "replace";
  estimatedCost: number;
  confidence: number;
  supplementRisk: "low" | "medium" | "high";
  rationale: string;
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
