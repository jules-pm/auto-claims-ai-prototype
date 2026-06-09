import type { Claim } from "./types";

// Seed claim records — pre-loaded with assessments already computed,
// representing the in-flight state of the queue at any moment. New claims
// (and the live AI assessment) enter via the "Report a claim" intake flow.
// Photos are real (Wikimedia Commons) and metadata honestly matches each photo.

export const seedClaims: Claim[] = [
  {
    id: "CLM-2026-0607-H",
    policyNumber: "POL-9921345",
    claimantName: "Theo Brennan",
    vehicle: {
      year: 2021,
      make: "Honda",
      model: "Accord",
      trim: "EX-L",
      acv: 26500,
    },
    accident: {
      date: "2026-06-07",
      location: "Bronx, NY (Bruckner Blvd)",
      description:
        "Guardrail intrusion through windshield after losing control on wet road. Driver sustained minor injuries. Vehicle towed.",
    },
    photos: ["/damage/wreck-side.jpg"],
    status: "ADJUSTER_REVIEW_POST_AGENT",
    receivedAt: "2026-06-07T15:12:00Z",
    assessment: {
      findings: [
        {
          area: "Windshield + cowl",
          damageType: "Full shatter from object intrusion",
          severity: 5,
          recommendation: "replace",
          estimatedCost: 1150,
          confidence: 0.94,
          supplementRisk: "low",
          rationale:
            "Windshield fully destroyed by guardrail intrusion; cowl trim damaged.",
          costBreakdown: {
            partType: "OEM",
            partsCost: 780,
            laborHours: 6,
            laborRate: 60,
            costSource: "Mitchell APD line-item",
          },
        },
        {
          area: "Dashboard + instrument panel",
          damageType: "Crush + penetration",
          severity: 4,
          recommendation: "replace",
          estimatedCost: 2900,
          confidence: 0.8,
          supplementRisk: "high",
          rationale:
            "Dash structure penetrated; HVAC and wiring behind panel likely affected and need teardown.",
          costBreakdown: {
            partType: "OEM",
            partsCost: 1850,
            laborHours: 17.5,
            laborRate: 60,
            costSource: "Mitchell APD line-item",
          },
        },
        {
          area: "Passenger-side A-pillar",
          damageType: "Structural deformation",
          severity: 4,
          recommendation: "repair",
          estimatedCost: 2400,
          confidence: 0.72,
          supplementRisk: "high",
          rationale:
            "A-pillar shows stress from intrusion; structural pull and measurement required before authorization.",
          costBreakdown: {
            partType: "n/a",
            partsCost: 0,
            laborHours: 40,
            laborRate: 60,
            costSource: "carrier rate sheet",
          },
        },
        {
          area: "Steering column + airbag module",
          damageType: "Possible deployment-related damage",
          severity: 4,
          recommendation: "replace",
          estimatedCost: 1800,
          confidence: 0.7,
          supplementRisk: "medium",
          rationale:
            "Intrusion path passes near steering column; module integrity must be verified.",
          costBreakdown: {
            partType: "OEM",
            partsCost: 1350,
            laborHours: 7.5,
            laborRate: 60,
            costSource: "CCC ONE",
          },
        },
      ],
      totalEstimate: 8250,
      overallConfidence: 0.79,
      repairToAcvRatio: 0.31,
      potentialTotalLoss: false,
      fraudAdvisory: { triggered: false },
      recommendedRoute: "AGENT_REVIEW",
      routeRationale:
        "Severe structural damage with three HIGH/MEDIUM supplement-risk items. Agent reviewed, confirmed scope, and routed to senior adjuster for final authorization given the dollar amount.",
      rationale:
        "Severe but repairable (31% repair-to-ACV). Agent confirmed the structural findings warrant a shop teardown before authorization; routed up for adjuster sign-off.",
    },
    decisionHistory: [
      {
        by: "system",
        action: "AI assessment completed",
        at: "2026-06-07T15:13:08Z",
      },
      {
        by: "system",
        action: "Routed to AGENT_REVIEW (severe structural + supplement risk)",
        at: "2026-06-07T15:13:08Z",
      },
      {
        by: "agent",
        action: "Approved estimate and routed to senior adjuster",
        at: "2026-06-07T16:42:00Z",
        note: "Confirmed A-pillar and dash intrusion scope; teardown authorized at shop.",
      },
    ],
  },
  {
    id: "CLM-2026-0606-A",
    policyNumber: "POL-1985234",
    claimantName: "Sarah Chen",
    vehicle: {
      year: 2015,
      make: "Nissan",
      model: "Maxima",
      trim: "SV",
      acv: 11000,
    },
    accident: {
      date: "2026-06-06",
      location: "Brooklyn, NY (Atlantic Ave)",
      description:
        "T-bone at intersection — struck on front-right while turning. Front bumper and passenger-side doors damaged. Vehicle drivable.",
    },
    photos: ["/damage/maxima-front.jpg"],
    status: "AGENT_REVIEW",
    receivedAt: "2026-06-06T11:24:00Z",
    assessment: {
      findings: [
        {
          area: "Front bumper + right headlight",
          damageType: "Severe crush, fragmentation, lamp destroyed",
          severity: 4,
          recommendation: "replace",
          estimatedCost: 1650,
          confidence: 0.88,
          supplementRisk: "medium",
          rationale:
            "Front bumper assembly destroyed and right headlamp shattered; replace both.",
          costBreakdown: {
            partType: "OEM",
            partsCost: 1100,
            laborHours: 9.2,
            laborRate: 60,
            costSource: "CCC ONE",
          },
        },
        {
          area: "Right front fender + wheel area",
          damageType: "Deformation, possible suspension contact",
          severity: 4,
          recommendation: "replace",
          estimatedCost: 1400,
          confidence: 0.64,
          supplementRisk: "high",
          rationale:
            "Fender crushed into wheel well; suspension/alignment damage cannot be ruled out from photo.",
          costBreakdown: {
            partType: "aftermarket",
            partsCost: 720,
            laborHours: 11.3,
            laborRate: 60,
            costSource: "Audatex",
          },
        },
        {
          area: "Passenger-side front door",
          damageType: "Dent + crease",
          severity: 3,
          recommendation: "repair",
          estimatedCost: 880,
          confidence: 0.82,
          supplementRisk: "low",
          rationale: "Door skin creased; repair and repaint.",
          costBreakdown: {
            partType: "n/a",
            partsCost: 120,
            laborHours: 12.7,
            laborRate: 60,
            costSource: "Mitchell APD line-item",
          },
        },
      ],
      totalEstimate: 3930,
      overallConfidence: 0.71,
      repairToAcvRatio: 0.36,
      potentialTotalLoss: false,
      fraudAdvisory: { triggered: false },
      recommendedRoute: "AGENT_REVIEW",
      routeRationale:
        "Overall confidence 71% (below 85% fast-track threshold). Right fender finding flagged HIGH supplement risk for possible suspension damage. Recommend agent review — may request a wheel-turned photo or escalate for inspection.",
      rationale:
        "Front-corner impact with clear bumper and door damage. The uncertainty is the right fender/wheel area: photo can't confirm whether suspension geometry is affected. Agent should request an additional photo or escalate to in-person inspection.",
    },
    decisionHistory: [
      {
        by: "system",
        action: "AI assessment completed",
        at: "2026-06-06T11:24:51Z",
      },
      {
        by: "system",
        action: "Routed to AGENT_REVIEW (medium confidence + supplement risk)",
        at: "2026-06-06T11:24:51Z",
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
        "Driver-side mirror struck and shattered by passing vehicle in parking lot. Other driver left insurance info.",
    },
    photos: ["/damage/mirror-bmw.jpg"],
    status: "ADJUSTER_REVIEW_AUTO_ROUTED",
    receivedAt: "2026-06-04T09:14:00Z",
    assessment: {
      findings: [
        {
          area: "Driver-side mirror assembly",
          damageType: "Shattered glass + housing damage",
          severity: 2,
          recommendation: "replace",
          estimatedCost: 420,
          confidence: 0.96,
          supplementRisk: "low",
          rationale:
            "Mirror glass shattered and housing cracked; standard power-mirror assembly replacement.",
          costBreakdown: {
            partType: "OEM",
            partsCost: 310,
            laborHours: 1.8,
            laborRate: 60,
            costSource: "Mitchell APD line-item",
          },
        },
        {
          area: "Driver-side door paint",
          damageType: "Light scuff near mirror mount",
          severity: 1,
          recommendation: "repair",
          estimatedCost: 130,
          confidence: 0.92,
          supplementRisk: "low",
          rationale: "Minor paint transfer; localized polish and touch-up.",
          costBreakdown: {
            partType: "n/a",
            partsCost: 20,
            laborHours: 1.8,
            laborRate: 60,
            costSource: "carrier rate sheet",
          },
        },
      ],
      totalEstimate: 550,
      overallConfidence: 0.95,
      repairToAcvRatio: 0.04,
      potentialTotalLoss: false,
      fraudAdvisory: { triggered: false },
      recommendedRoute: "ADJUSTER_REVIEW_AUTO_ROUTED",
      routeRationale:
        "High confidence (95%), low dollar value ($550), no supplement risk, no fraud indicators. Auto-routed to senior adjuster fast-track queue — agent review step skipped.",
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
      year: 2016,
      make: "Nissan",
      model: "Sentra",
      trim: "SV",
      acv: 9500,
    },
    accident: {
      date: "2026-06-04",
      location: "Long Island, NY (Sunrise Hwy)",
      description:
        "Front-end collision with tree after swerving to avoid a deer. Front of vehicle crushed, windshield damaged. Vehicle towed.",
    },
    photos: ["/damage/generic-crash.jpg"],
    status: "ADJUSTER_REVIEW_AUTO_ROUTED",
    receivedAt: "2026-06-04T16:48:00Z",
    assessment: {
      findings: [
        {
          area: "Front bumper + hood",
          damageType: "Severe crush and buckling",
          severity: 5,
          recommendation: "replace",
          estimatedCost: 2650,
          confidence: 0.93,
          supplementRisk: "medium",
          rationale:
            "Front clip crushed; bumper assembly and hood destroyed in tree impact.",
          costBreakdown: {
            partType: "OEM",
            partsCost: 1900,
            laborHours: 12.5,
            laborRate: 60,
            costSource: "CCC ONE",
          },
        },
        {
          area: "Radiator + cooling stack",
          damageType: "Crush damage to radiator/condenser",
          severity: 4,
          recommendation: "replace",
          estimatedCost: 1850,
          confidence: 0.78,
          supplementRisk: "high",
          rationale:
            "Cooling stack almost certainly destroyed; engine-side damage cannot be fully confirmed from exterior photo.",
          costBreakdown: {
            partType: "OEM",
            partsCost: 1250,
            laborHours: 10,
            laborRate: 60,
            costSource: "Audatex",
          },
        },
        {
          area: "Windshield",
          damageType: "Cracked from impact shock",
          severity: 3,
          recommendation: "replace",
          estimatedCost: 720,
          confidence: 0.85,
          supplementRisk: "low",
          rationale: "Windshield cracked; standard replacement.",
          costBreakdown: {
            partType: "aftermarket",
            partsCost: 430,
            laborHours: 4.8,
            laborRate: 60,
            costSource: "Mitchell APD line-item",
          },
        },
        {
          area: "Radiator support / frame rails (advisory)",
          damageType: "Probable structural deformation",
          severity: 5,
          recommendation: "repair",
          estimatedCost: 2750,
          confidence: 0.55,
          supplementRisk: "high",
          rationale:
            "Impact force suggests unibody rail damage; pre-repair frame measurement required.",
          costBreakdown: {
            partType: "n/a",
            partsCost: 350,
            laborHours: 40,
            laborRate: 60,
            costSource: "carrier rate sheet",
          },
        },
      ],
      totalEstimate: 7970,
      overallConfidence: 0.82,
      repairToAcvRatio: 0.84,
      potentialTotalLoss: true,
      fraudAdvisory: { triggered: false },
      recommendedRoute: "ADJUSTER_REVIEW_POTENTIAL_TOTAL_LOSS",
      routeRationale:
        "Estimated repair $7,970 vs. ACV $9,500 = 84% ratio, above the typical state total-loss threshold (70–80%). Routed to senior adjuster for total-loss determination. Full total-loss valuation (market data) is a v2 capability.",
      rationale:
        "Severe front-end impact. Two HIGH supplement-risk items (cooling stack, frame rails) mean the $7,970 estimate is a floor. Combined with the 84% repair-to-ACV ratio, this likely settles as a total loss. Adjuster decides.",
    },
    decisionHistory: [
      {
        by: "system",
        action: "AI assessment completed",
        at: "2026-06-04T16:49:23Z",
      },
      {
        by: "system",
        action: "Routed to ADJUSTER_REVIEW (potential total loss: 84% repair-to-ACV)",
        at: "2026-06-04T16:49:23Z",
      },
    ],
  },
  {
    id: "CLM-2026-0603-D",
    policyNumber: "POL-5512892",
    claimantName: "Robert Garcia",
    vehicle: {
      year: 2012,
      make: "Honda",
      model: "Accord",
      trim: "LX",
      acv: 6800,
    },
    accident: {
      date: "2026-06-03",
      location: "Manhattan, NY (claimed location: W 42nd St)",
      description:
        "Claimant reports a collision yesterday causing front-end and windshield damage. No witnesses, no police report filed.",
    },
    photos: ["/damage/civic-rear.jpg"],
    status: "ADJUSTER_REVIEW_AUTO_ROUTED",
    receivedAt: "2026-06-03T11:02:00Z",
    assessment: {
      findings: [
        {
          area: "Front-end body panels",
          damageType: "Crush + extensive surface rust",
          severity: 4,
          recommendation: "replace",
          estimatedCost: 2100,
          confidence: 0.74,
          supplementRisk: "low",
          rationale:
            "Front panels deformed, but heavy rust and oxidation at the damage edges indicate the damage is old, not from a recent collision.",
          costBreakdown: {
            partType: "aftermarket",
            partsCost: 1300,
            laborHours: 13.3,
            laborRate: 60,
            costSource: "Audatex",
          },
        },
        {
          area: "Windshield + roofline",
          damageType: "Shattered glass, weathered",
          severity: 3,
          recommendation: "replace",
          estimatedCost: 680,
          confidence: 0.7,
          supplementRisk: "low",
          rationale:
            "Windshield broken with dirt and vegetation present in the cabin, inconsistent with a one-day-old loss.",
          costBreakdown: {
            partType: "aftermarket",
            partsCost: 410,
            laborHours: 4.5,
            laborRate: 60,
            costSource: "Mitchell APD line-item",
          },
        },
      ],
      totalEstimate: 2780,
      overallConfidence: 0.72,
      repairToAcvRatio: 0.41,
      potentialTotalLoss: false,
      fraudAdvisory: {
        triggered: true,
        reason:
          "Damage shows heavy rust, oxidation, and vegetation growth — consistent with a vehicle that has been sitting damaged for months or years, not a collision 'yesterday.' Damage age is inconsistent with the claimed loss date, and no police report was filed. Recommend SIU review for pre-existing-damage fraud.",
      },
      recommendedRoute: "ADJUSTER_REVIEW_FRAUD_FLAGGED",
      routeRationale:
        "Damage is real but its AGE contradicts the claim: rust, oxidation, and plant growth indicate long-standing damage presented as a one-day-old loss. No police report. Advisory only — senior adjuster reviews and decides on SIU referral. AI does not initiate referral.",
      rationale:
        "The flag is on the claim's authenticity, not the repair scope. The vehicle has clearly been damaged and weathering for a long time. Senior adjuster reviews the age-of-damage indicators and decides whether to deny, request documentation, or refer to the Special Investigations Unit.",
    },
    decisionHistory: [
      {
        by: "system",
        action: "AI assessment completed",
        at: "2026-06-03T11:02:44Z",
      },
      {
        by: "system",
        action: "Fraud advisory triggered (age-of-damage inconsistency)",
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
