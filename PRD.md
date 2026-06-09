# PRD — Auto Claims AI Orchestration Layer

**Author:** Jules Guito · **Date:** June 8, 2026 · **Audience:** Carrier product + engineering leadership · **Status:** v1 proposal

---

## Problem

U.S. auto insurers lose money and customers in the middle of the claims workflow — the desk-side stretch between damage documentation and repair authorization, where ~80% of adjuster handling time is spent (Five Sigma 2023: 17.4% damage assessment + 62.3% assessment-to-payment). That manual middle produces inaccurate first estimates supplemented on **~40% of claims** (Mitchell APD 2017–2018) and contributes to claims leakage of **7–14% of total P&C claims spend** (EY 2025), while pushing average repair cycle times to **22.3 days** (J.D. Power 2024) — long enough that **80% of customers with a poor claims experience have left or plan to leave their carrier** (J.D. Power 2024) and claim-handling delays are now the **#1 category of consumer complaints to state regulators** (ValuePenguin/NAIC 2024). McKinsey estimates AI can compress 25–40% of total claims handling expense (McKinsey 2021), but the incumbent vendor stack (**CCC Estimate-STP at 7 of the top 10 US carriers; Tractable at GEICO, The Hartford, American Family**) has commoditized photo-to-estimate computer vision **without solving the orchestration problem**: confidence-scored triage, explainable estimates that know when to escalate, and an Approval and Authorization layer that catches the fraud and supplement risk that today's **1.8% SIU referral rate** (CAIF/SAS 2020) is missing.

## Vision

Build the orchestration layer that sits on top of the carrier's commodity damage-vision stack and compresses the middle of the claims workflow. AI runs damage assessment automatically on claim arrival. Confidence-gated routing sends the standard case directly to the senior adjuster, the exception cases to the claims agent for first-human review, and the high-risk cases (potential total loss, fraud advisory) to the adjuster with structured advisories. The agent role compresses, the adjuster role gets leverage, and every HITL decision becomes labeled data that earns the next round of automation. v1 ships full HITL through the senior adjuster; v2 considers expanding automation at the adjuster step based on production data — not assumption.

## User Stories

**Senior claims adjuster (HITL final approver)**
- As a senior adjuster, when a claim arrives in my queue I see a populated AI assessment (per-area findings, costs, confidence, advisories) and can approve, edit, return, escalate, or refer to SIU in one click — so I am deciding on a fully-prepared case, not reconstructing one.
- As a senior adjuster, when an AI estimate is flagged for potential total loss, I see the repair-to-ACV ratio and advisory inline — so I can route the claim to the total-loss path without recomputing the math.
- As a senior adjuster, when an AI fraud advisory triggers, I see the specific indicators (image inconsistency, pattern mismatch, missing police report) and can refer to SIU directly — so suspect claims that today slip past manual review become detectable at the natural injection point.

**Claims agent (exception reviewer)**
- As a claims agent, when AI confidence is medium or supplement risk is high, the claim routes to me with the AI's draft assessment and rationale — so my job is to review and decide, not to write the estimate from scratch.
- As a claims agent, when photos don't fully support a confident assessment, I can return the claim to the claimant for additional photos — so we improve the next assessment without burning adjuster time on a low-confidence pass.
- As a claims agent, I only see the cases that genuinely need a human first checkpoint — so my workload shrinks and concentrates on judgment calls, not from-scratch review.

## Key Features (v1, in priority order)

**P0 — Core orchestration**
1. **Automatic AI assessment on claim arrival.** Event-driven trigger when claim record + photos land in the system. No human kicks it off. Replaces the agent's manual review step for the standard case.
2. **Confidence-scored damage assessment.** Per-area findings (location, damage type, severity, repair-vs-replace, estimated cost) each with a per-finding confidence score; overall claim confidence aggregated. Output ships with structured rationale — auditable and regulator-defensible.
3. **Routing engine.** Confidence + dollar value + supplement risk + total-loss flag + fraud flag determine routing target: senior adjuster fast-track (high conf + low $), senior adjuster standard review, claims agent exception queue, or specialist paths (field appraiser, additional-photo request).
4. **Senior adjuster review surface.** Pre-populated estimate, AI rationale, advisories, decision history. Single-click approve/edit/return/escalate. Always the final HITL.

**P1 — Advisory signals (built on the same assessment pass, no separate model)**
5. **Supplement risk score per finding.** High/medium/low based on photo angle and damage pattern. Direct attack on the ~40% supplement rate.
6. **Potential total loss advisory.** When repair-estimate-to-ACV ratio crosses state-level threshold (~70–80%), output flags the claim and routes to senior adjuster with the ratio surfaced. Adjuster makes the call. Full total-loss valuation is v2.
7. **Fraud advisory + SIU referral surface.** AI surfaces inconsistency signals (image artifact, damage pattern mismatch, age-of-damage anomalies). Adjuster reviews and decides on SIU referral from the approval UI. Advisory only — humans always initiate. Connects to a ~$45B/year P&C fraud problem (CAIF 2022) at the natural injection point.

**P2 — Eval feedback loop (instrumentation, not user-facing)**
8. **Disagreement capture.** Every adjuster edit, return, and override logged at field level. Tracked by confidence band, damage type, vehicle tier, dollar bucket. Feeds Phase 2 threshold tuning.

**Prioritization rationale:** P0 features are the architectural backbone — without them the product doesn't exist. P1 features are the differentiation against the commodity vendor stack (CCC, Tractable, Mitchell, Audatex have largely commoditized P0 but not P1). P2 is instrumentation that earns the next product cycle.

## Success Metrics

**Hero metric (the single number leadership will see)**
- **Cycle time, our slice only:** median + p90 days from *claim received by carrier* → *authorization issued*. NOT full claim-to-settlement (excludes shop time we don't own).

**Guardrails (must not regress as the hero improves)**
- Supplement rate (proxy: estimate accuracy)
- Adjuster-overturn rate on AI-recommended approvals (proxy: decision quality)
- CSAT for our touchpoints (proxy: experience quality)

**Business impact (lagging, supports the case)**
- Adjuster productivity: claims processed per adjuster per month
- Leakage $ saved: longitudinal proxy via supplement-rate reduction × average supplement value

**Why this structure:** the hero is gameable in isolation (faster cycles by skimping on review). The guardrails close that hole. The business-impact numbers translate to executive language for ongoing budget.

## AI Integration & Human-AI Interaction

**High-level approach.** We do **not** build the damage vision model. We orchestrate. The carrier integrates a commodity vendor (CCC Estimate-STP, Tractable, or Mitchell-platform partner) for raw photo-to-estimate. Our system layers on top of that vendor's output to apply: structured-output enforcement (every assessment ships with confidence, rationale, supplement risk, total-loss check, fraud signal), a rules-engine pass for repair-cost validation against the carrier's negotiated line-item rates, and the routing engine that decides who reviews next. **The v1 prototype uses Claude Sonnet 4.6 vision directly as the assessment model** — this is the prototype substitute for the commodity vendor in production. The architectural separation between "assessment engine" and "orchestration layer" is what lets us swap vendors without rewriting the workflow.

**Human-AI interaction principles**
- **AI never auto-denies.** Confidence-threshold routing only auto-*approves*. Every denial requires a human with written rationale. Asymmetric thresholds (high bar to deny, lower bar to approve).
- **AI never auto-refers to SIU.** Fraud signals surface as advisories with rationale. SIU referral is human-initiated, always.
- **AI ships explainability with every assessment.** Per-finding rationale, confidence factors, cost basis. Auditable for regulators; defensible for contested claims.
- **HITL is the eval surface.** Adjuster overturns, edits, and returns are labeled data. We instrument from day one. The Phase 2 case for expanded automation is built from production data, not assumption.

## Risks & Mitigations

- **Model bias across vehicle tier.** AI may underestimate damage on lower-value vehicles and harm lower-income claimants. *Mitigation:* segmented eval metrics by vehicle MSRP bucket + make/model, with predefined disparity thresholds that gate model updates and trigger retrains.
- **Auto-deny / wrongful denial risk.** *Mitigation:* asymmetric routing (auto-*approve* only, never auto-deny), mandatory written rationale on every denial, claimant-facing recourse path.
- **Fraud false accusation.** *Mitigation:* AI signals are advisory only; human-only SIU referral; adjuster must record the indicator they acted on.
- **Photo quality dependency on upstream FNOL.** Low-quality photos limit AI confidence. *Mitigation:* we own a feedback signal back to FNOL — auto-request specific additional photos when assessment confidence is gated by photo limitations. We do not redesign FNOL.
- **Vendor lock to commodity damage AI.** *Mitigation:* the orchestration layer is vendor-agnostic. Swapping CCC for Tractable (or to a carrier-trained internal model in v2) is a configuration change, not a rewrite.

## What's NOT in v1 (named for v2 with rationale)

- **Total-loss valuation** — needs vehicle market-data integration (Manheim / MMR / Black Book) and a cash-settlement workflow. v2.
- **Adjuster workload dashboard + auto-assignment** — operationally important but not load-bearing for the orchestration thesis. v2.
- **Bias monitoring dashboard** — backend instrumentation ships in v1; the dashboard surface ships v2.
- **Cost-database integration** (Mitchell / CCC / Audatex line-item rates) — v1 relies on vendor output + model judgment against the carrier's negotiated rate sheet; v2 brings in normalized lookups for cleaner audit trails.
- **ADAS/EV-aware estimating depth** — vehicle complexity is rising fast (CCC Q4 2024: EV cycle time 37.6 days vs ICE 32.3; calibrations on 56.5% of Q1 2025 DRP supplements), but the v1 prototype focuses on the broad case and flags ADAS/EV claims for adjuster review.
- **Claimant-facing comms / status updates** — owned by the carrier's existing policyholder app; our scope ends at authorization.
