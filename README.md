# Auto Claims AI — Prototype

Prototype of an AI-powered orchestration layer for a top-10 US auto insurance carrier's claims platform. Built as a take-home for Scale AI's FDPM role.

## What this is

The carrier already has commodity AI for raw photo-to-estimate damage detection (e.g., CCC Estimate-STP, Tractable). This prototype is the **orchestration layer on top**:

- AI runs damage assessment automatically on claim arrival — no human triggers it (the claims agent role is automated for the standard case)
- Routing engine sends claims to the right reviewer based on confidence, dollar value, supplement risk, total-loss threshold, and fraud advisory
- **Senior claims adjuster** is always the human-in-the-loop final approver
- **Claims agent** still reviews exception cases (medium confidence, supplement risk, claims requiring more photos) — they are the first-human checkpoint before the adjuster
- Each AI output ships with structured rationale, per-finding supplement risk, total-loss advisory, and fraud advisory (advisory only — humans always initiate SIU referral)

The prototype demonstrates the agent + adjuster review surfaces via a persona toggle.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Anthropic SDK + Claude Sonnet 4.6 (vision)
- Server-side API route for the vision call; client-side localStorage for user-uploaded claims

## Run locally

```bash
npm install
cp .env.example .env.local
# Edit .env.local and paste your Anthropic API key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo walkthrough

1. **Queue view** — landing page. Pre-loaded with four seed claims demonstrating different routing outcomes:
   - **CLM-2026-0604-B** (Toyota Camry, mirror knock-off) — high confidence + low dollar → auto-routed past the agent, straight to senior adjuster
   - **CLM-2026-0605-A** (Honda Civic, rear-end) — medium confidence + supplement risk → routed to claims agent for review first
   - **CLM-2026-0604-C** (Nissan Sentra, front-end collision with tree) — potential total loss (92% repair-to-ACV ratio) → routed to senior adjuster with total-loss advisory
   - **CLM-2026-0603-D** (Chevrolet Malibu, suspect hit-and-run) — fraud advisory triggered (image inconsistency + damage pattern mismatch) → routed to senior adjuster with SIU-referral option
2. **Persona toggle** — top right. Switch between Senior Adjuster and Claims Agent to see which claims are in your queue and what actions are available on each claim's detail page.
3. **Simulate new claim arrival** — top right. Upload a damage photo + fill claim metadata. Triggers a live Claude Sonnet vision call. Result populates the claim record and routes per the AI's recommendation.
4. **Claim detail** — click into any claim. AI assessment with per-area findings, confidence, supplement risk, fraud/total-loss advisories, and persona-adaptive decision controls (approve, return, escalate, refer to SIU).

## Project structure

```
src/
  app/
    api/assess/route.ts       Vision API route (server-side Claude Sonnet vision call)
    claim/[id]/page.tsx       Claim detail page
    page.tsx                  Claims queue (landing)
    layout.tsx                Root layout
  components/
    QueuePage.tsx             Queue table + persona-aware filtering
    ClaimDetail.tsx           Per-claim view + adaptive decision panel
    UploadClaimDialog.tsx     Simulate-new-claim modal + live vision call
    PersonaToggle.tsx         Agent/Adjuster role switcher
  data/
    types.ts                  Claim, Persona, Assessment, status types
    claims.ts                 Seed claim records with pre-computed AI assessments
  lib/
    storage.ts                localStorage for user-uploaded claims
    format.ts                 Display helpers
```

## What's NOT in v1 (described in PRD)

- Total-loss valuation (vehicle market-data integration: Manheim / MMR / Black Book)
- Multi-claim adjuster workload queue + assignment
- Adjuster productivity dashboard
- Bias monitoring dashboard (eval cuts by vehicle tier, claimant segment)
- Cost database integration (Mitchell / CCC / Audatex line-item rates) — v1 uses model judgment against the carrier's commodity vendor; v2 brings in normalized line-item lookups
- ADAS/EV-aware estimating depth
- Claimant-facing comms / status updates

These are intentionally scoped out per the prompt's "core workflow only, describe the rest in the PRD" instruction.

## License

Take-home submission for Scale AI evaluation. Not for production use.
