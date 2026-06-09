import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { AIAssessment } from "@/data/types";

// The live vision call runs ~15s; allow up to 60s so the serverless function
// doesn't time out before the model responds.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const assessmentTool = {
  name: "submit_assessment",
  description:
    "Submit the structured damage assessment for this claim. Must be called exactly once.",
  input_schema: {
    type: "object" as const,
    properties: {
      findings: {
        type: "array",
        description:
          "The most material damage areas only — at most 5, fewer when damage is contained. Group related sub-damage into one finding. Be specific about location (e.g., 'front bumper cover, driver side' not 'front').",
        items: {
          type: "object",
          properties: {
            area: { type: "string" },
            damageType: {
              type: "string",
              description:
                "Brief description: dent, scratch, crack, deformation, missing part, etc.",
            },
            severity: {
              type: "integer",
              minimum: 1,
              maximum: 5,
              description: "1 = cosmetic, 5 = structural / safety-critical",
            },
            recommendation: {
              type: "string",
              enum: ["repair", "replace"],
            },
            estimatedCost: {
              type: "number",
              description:
                "USD. Based on typical US repair cost schedules (Mitchell/CCC/Audatex line-item rates). Parts + labor.",
            },
            confidence: {
              type: "number",
              minimum: 0,
              maximum: 1,
              description:
                "Your confidence in this finding given photo quality, angle, and damage visibility.",
            },
            supplementRisk: {
              type: "string",
              enum: ["low", "medium", "high"],
              description:
                "Likelihood that, once the shop opens this area, additional hidden damage will be discovered requiring a supplemental estimate.",
            },
            rationale: {
              type: "string",
              description: "ONE short sentence explaining the call. No more.",
            },
            costBreakdown: {
              type: "object",
              description:
                "How the estimatedCost was built against a standardized repair-cost database — the same way a claims agent would, but automated.",
              properties: {
                partType: {
                  type: "string",
                  enum: ["OEM", "aftermarket", "n/a"],
                  description:
                    "OEM for safety/structural parts, aftermarket where carrier policy allows, n/a for labor-only repairs.",
                },
                partsCost: {
                  type: "number",
                  description: "Parts cost in USD (0 for labor-only repairs).",
                },
                laborHours: {
                  type: "number",
                  description: "Estimated labor hours for this line item.",
                },
                laborRate: {
                  type: "number",
                  description:
                    "Regional labor rate $/hr (typical US body shop: $50–$65/hr).",
                },
                costSource: {
                  type: "string",
                  description:
                    "The reference database/manual this line item is priced against, e.g. 'Mitchell APD line-item', 'CCC ONE', 'Audatex', or 'carrier rate sheet'.",
                },
              },
              required: [
                "partType",
                "partsCost",
                "laborHours",
                "laborRate",
                "costSource",
              ],
            },
          },
          required: [
            "area",
            "damageType",
            "severity",
            "recommendation",
            "estimatedCost",
            "confidence",
            "supplementRisk",
            "rationale",
            "costBreakdown",
          ],
        },
      },
      totalEstimate: {
        type: "number",
        description: "Sum of estimatedCost across all findings.",
      },
      overallConfidence: {
        type: "number",
        minimum: 0,
        maximum: 1,
        description:
          "Aggregate confidence in the full assessment. Should generally weight by cost contribution and reflect the lowest-confidence material finding.",
      },
      repairToAcvRatio: {
        type: "number",
        description: "totalEstimate / vehicle ACV. Used for total-loss determination.",
      },
      potentialTotalLoss: {
        type: "boolean",
        description:
          "True if repairToAcvRatio >= 0.70 (typical state total-loss threshold range is 70-80%).",
      },
      fraudAdvisory: {
        type: "object",
        properties: {
          triggered: { type: "boolean" },
          reason: {
            type: "string",
            description:
              "If triggered, the specific indicator(s): image inconsistency, damage pattern mismatch with accident description, age-of-damage anomalies (rust on supposedly fresh damage), etc.",
          },
        },
        required: ["triggered"],
      },
      recommendedRoute: {
        type: "string",
        enum: [
          "AGENT_REVIEW",
          "ADJUSTER_REVIEW_AUTO_ROUTED",
          "ADJUSTER_REVIEW_POTENTIAL_TOTAL_LOSS",
          "ADJUSTER_REVIEW_FRAUD_FLAGGED",
        ],
        description:
          "Routing logic: ADJUSTER_REVIEW_AUTO_ROUTED = overallConfidence >= 0.85 AND totalEstimate <= 1500 AND no high supplement risk AND no fraud. AGENT_REVIEW = otherwise non-flagged. POTENTIAL_TOTAL_LOSS overrides if repairToAcvRatio >= 0.70. FRAUD_FLAGGED overrides if fraudAdvisory.triggered.",
      },
      routeRationale: {
        type: "string",
        description: "Short explanation of why this routing decision.",
      },
      rationale: {
        type: "string",
        description:
          "ONE or two sentences: what the photos show, what's uncertain, what the human should focus on. Concise.",
      },
    },
    required: [
      "findings",
      "totalEstimate",
      "overallConfidence",
      "repairToAcvRatio",
      "potentialTotalLoss",
      "fraudAdvisory",
      "recommendedRoute",
      "routeRationale",
      "rationale",
    ],
  },
};

const SYSTEM_PROMPT = `You are the AI damage assessment engine inside a top-10 US auto insurance carrier's claims platform. A policyholder has submitted photos of their vehicle damage as part of their claim. Your job is to analyze the photos and produce a structured assessment that the carrier's claims agent OR senior claims adjuster will review.

You replace the claims agent's manual review step for the standard case. For exception cases (medium confidence, supplement risk, potential total loss, fraud indicators) the assessment is routed to a human reviewer with your output as the starting point.

You are advisory. You do NOT make final approval, denial, or fraud-referral decisions. Humans make those calls. Your job is to give them an accurate, defensible starting point.

When estimating costs (this replaces the manual step where a claims agent consults a standardized repair-cost database):
- For each finding, build the estimate the way an agent would against Mitchell / CCC / Audatex: parts cost + labor hours × regional labor rate.
- Fill in costBreakdown for every finding: partType (OEM for safety/structural parts, aftermarket where allowed, n/a for labor-only), partsCost, laborHours, laborRate ($50–$65/hr typical), and the costSource database you priced against.
- estimatedCost should equal roughly partsCost + (laborHours × laborRate).
- Be honest about what you can and cannot see from photos. Photo limitations are a real source of supplement risk.

When flagging supplement risk:
- HIGH = the photo angle obstructs the area OR the damage pattern (e.g., crumpled bumper) likely conceals interior structural damage
- MEDIUM = some uncertainty about the extent
- LOW = clean visibility, contained damage

When considering fraud:
- Look for: damage pattern that does not match the described accident, age-of-damage inconsistencies (e.g., rust at scratch edges on supposedly fresh damage), image artifacts suggesting editing, claimed mechanism vs. visible evidence mismatches
- Flag as advisory only. Humans decide on SIU referral.

BREVITY (important — this output is reviewed by a busy human in a queue, and speed matters):
- Report only the most material damage areas: at most 4 findings, fewer when the damage is contained. Group related sub-damage into one finding rather than listing every component.
- Every "rationale" field (per-finding and overall) must be ONE short sentence. No paragraphs.
- "routeRationale" must be one short sentence.
- Do not over-explain. Be decisive and terse.

You MUST call the submit_assessment tool with your structured output. Do not respond in prose.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      imageBase64,
      mediaType,
      vehicle,
      accident,
    }: {
      imageBase64: string;
      mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
      vehicle: {
        year: number;
        make: string;
        model: string;
        trim: string;
        acv: number;
      };
      accident: { date: string; location: string; description: string };
    } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: "imageBase64 is required" },
        { status: 400 }
      );
    }

    const userMessage = `## Claim context

**Vehicle:** ${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}
**Vehicle ACV (from policy):** $${vehicle.acv.toLocaleString()}

**Accident date:** ${accident.date}
**Location:** ${accident.location}
**Claimant description:** ${accident.description}

## Photo

(attached)

Analyze the photo against the claim context and call submit_assessment with your structured output.`;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "ANTHROPIC_API_KEY is not set on the server. Add it to .env.local and restart the dev server.",
        },
        { status: 500 }
      );
    }
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1600,
      system: SYSTEM_PROMPT,
      tools: [assessmentTool],
      tool_choice: { type: "tool", name: "submit_assessment" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: imageBase64,
              },
            },
            { type: "text", text: userMessage },
          ],
        },
      ],
    });

    const toolUse = response.content.find(
      (block) => block.type === "tool_use" && block.name === "submit_assessment"
    );

    if (!toolUse || toolUse.type !== "tool_use") {
      return NextResponse.json(
        { error: "Model did not return a structured assessment" },
        { status: 502 }
      );
    }

    const assessment = toolUse.input as AIAssessment;

    return NextResponse.json({ assessment });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Vision call failed: ${message}` },
      { status: 500 }
    );
  }
}
