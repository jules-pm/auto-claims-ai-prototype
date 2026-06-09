import type { Claim } from "./types";

// Pre-loaded claim records with pre-computed AI assessments.
// These represent the production state: AI ran on claim arrival; results are
// already populated when a human (agent or adjuster) opens the case.
// The "Upload New Claim" flow triggers a live Claude Sonnet vision call.

export const seedClaims: Claim[] = [
  {
    id: "CLM-2026-0605-A",
    policyNumber: "POL-1985234",
    claimantName: "Sarah Chen",
    vehicle: {
      year: 2021,
      make: "Honda",
      model: "Civic",
      trim: "LX",
      acv: 19500,
    },
    accident: {
      date: "2026-06-05",
      location: "Brooklyn, NY",
      description:
        "Rear-ended at stop sign at low speed. Driver and passenger uninjured. Vehicle driven from scene.",
    },
    photos: ["/placeholder-rear-damage.svg"],
    status: "AGENT_REVIEW",
    receivedAt: "2026-06-05T14:32:00Z",
    assessment: {
      findings: [
        {
          area: "Rear bumper cover",
          damageType: "Dent + paint scratch",
          severity: 3,
          recommendation: "replace",
          estimatedCost: 1420,
          confidence: 0.91,
          supplementRisk: "medium",
          rationale:
            "Visible deformation across bumper cover with paint transfer. Replace recommended over repair given depth.",
        },
        {
          area: "Rear quarter panel (driver side)",
          damageType: "Possible crumple-zone displacement",
          severity: 2,
          recommendation: "repair",
          estimatedCost: 680,
          confidence: 0.62,
          supplementRisk: "high",
          rationale:
            "Photo angle is partially obstructed. Visible surface dent, but internal frame deformation cannot be ruled out from photos alone.",
        },
        {
          area: "Trunk lid",
          damageType: "Minor surface scratches",
          severity: 1,
          recommendation: "repair",
          estimatedCost: 290,
          confidence: 0.88,
          supplementRisk: "low",
          rationale: "Surface-only scratches consistent with light contact.",
        },
      ],
      totalEstimate: 2390,
      overallConfidence: 0.74,
      repairToAcvRatio: 0.12,
      potentialTotalLoss: false,
      fraudAdvisory: { triggered: false },
      recommendedRoute: "AGENT_REVIEW",
      routeRationale:
        "Overall confidence 74% (below 85% high-confidence threshold). Rear quarter panel finding flagged HIGH supplement risk due to photo obstruction. Recommend claims agent review before sending to adjuster — agent may request additional photos of driver-side rear area.",
      rationale:
        "Three damage areas detected. Bumper cover replacement is straightforward. Quarter panel area is the uncertainty: photos do not clearly show whether the dent extends into structural components. Agent should either accept the conservative estimate, request additional photos angled at the driver-side rear quarter, or escalate to in-person inspection.",
    },
    decisionHistory: [
      {
        by: "system",
        action: "AI assessment completed",
        at: "2026-06-05T14:33:12Z",
      },
      {
        by: "system",
        action: "Routed to AGENT_REVIEW (medium confidence + supplement risk)",
        at: "2026-06-05T14:33:12Z",
      },
    ],
  },
  {
    id: "CLM-2026-0604-B",
    policyNumber: "POL-2143789",
    claimantName: "Marcus Williams",
    vehicle: {
      year: 2018,
      make: "Toyota",
      model: "Camry",
      trim: "SE",
      acv: 14200,
    },
    accident: {
      date: "2026-06-04",
      location: "Queens, NY (Whole Foods parking lot)",
      description:
        "Driver-side mirror knocked off by passing vehicle in parking lot. Other driver left a note with insurance info.",
    },
    photos: ["/placeholder-mirror-damage.svg"],
    status: "ADJUSTER_REVIEW_AUTO_ROUTED",
    receivedAt: "2026-06-04T09:14:00Z",
    assessment: {
      findings: [
        {
          area: "Driver-side mirror assembly",
          damageType: "Complete detachment",
          severity: 3,
          recommendation: "replace",
          estimatedCost: 380,
          confidence: 0.96,
          supplementRisk: "low",
          rationale:
            "Mirror assembly is fully detached with mounting point fractured. Standard OEM replacement part with labor.",
        },
        {
          area: "Driver-side door",
          damageType: "Light surface scuff",
          severity: 1,
          recommendation: "repair",
          estimatedCost: 145,
          confidence: 0.93,
          supplementRisk: "low",
          rationale:
            "Minor paint transfer near mirror mount. Localized polish + touch-up.",
        },
      ],
      totalEstimate: 525,
      overallConfidence: 0.94,
      repairToAcvRatio: 0.04,
      potentialTotalLoss: false,
      fraudAdvisory: { triggered: false },
      recommendedRoute: "ADJUSTER_REVIEW_AUTO_ROUTED",
      routeRationale:
        "High confidence (94%), low dollar value ($525), no supplement risk, no fraud indicators. Auto-routed to senior adjuster fast-track approve queue — agent review step skipped.",
      rationale:
        "Clean, contained damage with high-confidence photo evidence. Mirror replacement is a standard, well-understood line item. No edge cases.",
    },
    decisionHistory: [
      {
        by: "system",
        action: "AI assessment completed",
        at: "2026-06-04T09:14:38Z",
      },
      {
        by: "system",
        action:
          "Auto-routed to ADJUSTER_REVIEW (high confidence, low $, no flags) — agent review bypassed",
        at: "2026-06-04T09:14:38Z",
      },
    ],
  },
  {
    id: "CLM-2026-0604-C",
    policyNumber: "POL-3398124",
    claimantName: "David Lee",
    vehicle: {
      year: 2017,
      make: "Nissan",
      model: "Sentra",
      trim: "SV",
      acv: 9500,
    },
    accident: {
      date: "2026-06-04",
      location: "Long Island, NY (Sunrise Hwy)",
      description:
        "Front-end collision with tree after swerving to avoid deer. Airbags deployed. Vehicle towed from scene.",
    },
    photos: ["/placeholder-frontend-damage.svg"],
    status: "ADJUSTER_REVIEW_AUTO_ROUTED",
    receivedAt: "2026-06-04T16:48:00Z",
    assessment: {
      findings: [
        {
          area: "Front bumper assembly",
          damageType: "Severe crush + fragmentation",
          severity: 5,
          recommendation: "replace",
          estimatedCost: 1850,
          confidence: 0.95,
          supplementRisk: "medium",
          rationale:
            "Complete loss of bumper structure. Replacement assembly + brackets.",
        },
        {
          area: "Hood",
          damageType: "Major buckling, leading edge deformed",
          severity: 4,
          recommendation: "replace",
          estimatedCost: 1200,
          confidence: 0.93,
          supplementRisk: "low",
          rationale:
            "Hood buckled along entire leading edge. Replace + paint.",
        },
        {
          area: "Radiator support / core support",
          damageType: "Visible deformation",
          severity: 4,
          recommendation: "replace",
          estimatedCost: 1450,
          confidence: 0.84,
          supplementRisk: "high",
          rationale:
            "Front structural member shows deformation behind bumper. Likely radiator damage; cooling system inspection required.",
        },
        {
          area: "Driver + passenger airbags",
          damageType: "Deployed",
          severity: 5,
          recommendation: "replace",
          estimatedCost: 2200,
          confidence: 0.97,
          supplementRisk: "low",
          rationale:
            "Both front airbags deployed per claimant report and visible in interior photo. Replacement + module reset.",
        },
        {
          area: "Windshield",
          damageType: "Cracked (likely from airbag deployment)",
          severity: 4,
          recommendation: "replace",
          estimatedCost: 750,
          confidence: 0.88,
          supplementRisk: "low",
          rationale: "Spiderweb cracking on passenger side, consistent with airbag deployment pattern.",
        },
        {
          area: "Hidden / structural (advisory)",
          damageType: "Probable frame stress",
          severity: 4,
          recommendation: "repair",
          estimatedCost: 1300,
          confidence: 0.58,
          supplementRisk: "high",
          rationale:
            "Front-impact at sufficient force to deploy airbags typically transmits load into unibody rails. Pre-repair frame measurement required.",
        },
      ],
      totalEstimate: 8750,
      overallConfidence: 0.86,
      repairToAcvRatio: 0.92,
      potentialTotalLoss: true,
      fraudAdvisory: { triggered: false },
      recommendedRoute: "ADJUSTER_REVIEW_POTENTIAL_TOTAL_LOSS",
      routeRationale:
        "Estimated repair cost $8,750 vs. vehicle ACV $9,500 = 92% ratio. Exceeds typical state total-loss threshold (70-80%). Recommend senior adjuster review for total-loss determination. Full total-loss valuation (market data) handled in v2 system.",
      rationale:
        "Severe front-end impact with airbag deployment. Multiple high-confidence findings on visible damage. Two HIGH supplement-risk items (radiator support, suspected frame stress) suggest the $8,750 estimate is a floor, not a ceiling. Combined with the 92% repair-to-ACV ratio, this claim almost certainly settles as a total loss. Adjuster decides.",
    },
    decisionHistory: [
      {
        by: "system",
        action: "AI assessment completed",
        at: "2026-06-04T16:49:23Z",
      },
      {
        by: "system",
        action:
          "Routed to ADJUSTER_REVIEW (potential total loss: 92% repair-to-ACV)",
        at: "2026-06-04T16:49:23Z",
      },
    ],
  },
  {
    id: "CLM-2026-0603-D",
    policyNumber: "POL-5512892",
    claimantName: "Robert Garcia",
    vehicle: {
      year: 2020,
      make: "Chevrolet",
      model: "Malibu",
      trim: "LT",
      acv: 17800,
    },
    accident: {
      date: "2026-06-03",
      location: "Manhattan, NY (claimed location: W 42nd St)",
      description:
        "Hit-and-run while parked overnight. Returned to vehicle to find passenger-side damage. No witnesses, no police report filed.",
    },
    photos: ["/placeholder-suspicious-damage.svg"],
    status: "ADJUSTER_REVIEW_AUTO_ROUTED",
    receivedAt: "2026-06-03T11:02:00Z",
    assessment: {
      findings: [
        {
          area: "Passenger-side rear door",
          damageType: "Long horizontal scrape + dent",
          severity: 3,
          recommendation: "repair",
          estimatedCost: 1180,
          confidence: 0.89,
          supplementRisk: "low",
          rationale: "Horizontal scrape ~60cm with shallow dent. Body repair + repaint.",
        },
        {
          area: "Passenger-side quarter panel",
          damageType: "Surface scratches, partially rusted",
          severity: 2,
          recommendation: "repair",
          estimatedCost: 540,
          confidence: 0.71,
          supplementRisk: "low",
          rationale:
            "Scratches present but show signs of oxidation/rust at edges, inconsistent with a 24-hour-old incident.",
        },
      ],
      totalEstimate: 1720,
      overallConfidence: 0.81,
      repairToAcvRatio: 0.1,
      potentialTotalLoss: false,
      fraudAdvisory: {
        triggered: true,
        reason:
          "Quarter panel scratches show edge oxidation inconsistent with a fresh hit-and-run. Damage pattern (long horizontal scrape) does not match described scenario (parked vehicle struck overnight). No police report filed. Recommend SIU review.",
      },
      recommendedRoute: "ADJUSTER_REVIEW_FRAUD_FLAGGED",
      routeRationale:
        "Damage assessment is otherwise straightforward, but two fraud advisories: (1) rust on quarter-panel scratches inconsistent with 24-hour timeline, (2) damage pattern inconsistent with described mechanism (parked-overnight strike), (3) no police report. Advisory only — senior adjuster reviews and decides on SIU referral. AI does not initiate SIU referral.",
      rationale:
        "Repair scope itself is well-bounded ($1,720) and high-confidence. The flag is on the claim's authenticity, not the damage estimate. Senior adjuster reviews the fraud indicators and decides whether to approve, request additional documentation (claimant statement, photos), or refer to Special Investigations Unit.",
    },
    decisionHistory: [
      {
        by: "system",
        action: "AI assessment completed",
        at: "2026-06-03T11:02:44Z",
      },
      {
        by: "system",
        action: "Fraud advisory triggered (image inconsistency + pattern mismatch)",
        at: "2026-06-03T11:02:44Z",
      },
      {
        by: "system",
        action: "Routed to ADJUSTER_REVIEW (fraud-flagged)",
        at: "2026-06-03T11:02:44Z",
      },
    ],
  },
];
