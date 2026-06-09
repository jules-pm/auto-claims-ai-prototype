# Auto Claims AI — Prototype

A prototype of an AI-assisted auto insurance claims workflow. The carrier assesses damage by hand today; this product automates that middle of the claim and, more importantly, decides what to do with the result — routing each claim to the right human and learning from every correction.

A prototype exploring how AI could be integrated into the auto insurance claims workflow. The accompanying PRD is in [`PRD.md`](PRD.md).

## What's real vs. simulated

- **Real:** the damage assessment is a live call to **Claude Sonnet** vision. It looks at the actual photo, identifies the damaged areas, prices them, scores its own confidence, and flags hidden-damage / total-loss / fraud risk — using structured tool-use so the output is always in a fixed schema.
- **Simulated:** there's no live integration with a commodity vendor (CCC/Tractable) or a real cost database (Mitchell/Audatex). Claude approximates the priced estimate those would return. Routing thresholds are placeholder values. These are named as production integrations in the PRD.

## The flow

1. **Report a claim (intake).** The claims agent captures policy + accident details and the policyholder's photos. This is the existing manual step, before automation — so it's labeled that way in the UI.
2. **Automatic AI assessment.** On submission, the assessment runs on its own (no "run AI" button — the trigger is the claim arriving). It produces an itemized, priced estimate with per-line confidence and cost basis.
3. **Confidence-based routing.** The claim is sent to the senior adjuster (high confidence), the claims agent for exception review (medium confidence / hidden-damage risk), or flagged for the adjuster (potential total loss / fraud).
4. **Human review.** Agent or adjuster reviews the estimate line by line — confirming what's right, correcting what's off (with an optional tag for *why* the AI missed). Every confirmation and correction is logged as labeled data for model eval.
5. **Decision + audit trail.** Approve, return, escalate, or refer to SIU. Every step is recorded in a per-claim audit timeline, attributed to the AI, the agent, or the adjuster.

The two personas (claims agent, senior adjuster) each have their own sidebar queue and toggle in the top bar.

## Run it locally

```bash
npm install
cp .env.example .env.local      # then add your Anthropic API key
npm run dev
```

Open http://localhost:3000.

You'll need an `ANTHROPIC_API_KEY` from [console.anthropic.com](https://console.anthropic.com). The live assessment uses Claude Sonnet vision; pre-loaded claims already have assessments, so the API is only called when you submit a new claim through **Report a claim**.

> **Note:** Next.js loads `.env.local` automatically. If the assessment returns an auth error, restart the dev server after adding the key.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- `@anthropic-ai/sdk` — Claude Sonnet vision with structured tool-use output
- Server-side API route for the vision call; client-side state for claims created during a session

## Project structure

```
src/
  app/
    api/assess/route.ts     Live Claude Sonnet vision call (structured output)
    intake/page.tsx         "Report a claim" intake form
    claim/[id]/page.tsx     Claim detail — assessment, review, decision
    page.tsx                Queue (agent / adjuster)
  components/
    QueuePage.tsx           Persona queue + filters
    Sidebar.tsx             Per-persona navigation + counts
    ClaimDetail.tsx         Assessment, confirm/correct, routing, audit timeline
    IntakeForm.tsx          Claim intake (policy, accident, photo)
    FlowSteps.tsx           Intake → AI → Agent → Adjuster → Decision progress
    TopBar.tsx / PersonaToggle.tsx
  data/
    claims.ts               Seed claims (pre-assessed) covering each routing path
    samples.ts              Sample damage photos + matching metadata for intake
    types.ts
public/damage/              Damage photos (Wikimedia Commons; see ATTRIBUTION.md)
```

## Damage photos

Real photos from Wikimedia Commons under free licenses, used for demonstration. Attribution in [`public/damage/ATTRIBUTION.md`](public/damage/ATTRIBUTION.md). Each seed claim's metadata honestly matches its photo.
