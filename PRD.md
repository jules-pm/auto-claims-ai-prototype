**Problem**  
   
Auto claims are slow, expensive, and inaccurate. Most of the cost lives between intake and decision, where adjusters review damage, write estimates, and get approval.¹ First estimates miss often enough that \~40% of claims get supplemented later,² repairs drag on for weeks,³ and the industry loses 7-14¢ per $ to leakage.⁴ Customers feel it too – 4 in 5 policyholders with a bad claims experience say they'll switch carriers.⁵  
   
**Vision & Goals**  
   
Reading a damage photo and pricing it is now a commodity: CCC's estimating AI runs at 7 of the 10 largest US carriers,⁶ and Tractable powers GEICO, The Hartford, and American Family.⁷ The opportunity is in the workflow around the estimate: which claims to auto-clear, which need a human, which look like fraud, and how to learn from adjusters’ experience.

The workflow today is manual: an agent collects photos, sizes the damage, and writes the estimate from cost manuals and experience. We will automate those steps and decide what to do with the result. The assessment engine is swappable (CCC, Tractable, or a frontier vision model like the one in this prototype) so our effort goes into the layer on top: clear the straightforward claims faster and cheaper; and keep a HITL on high-risk decisions.

When a claim comes in, AI assesses the damage and a confidence-based router sends it on: clean, high-confidence claims go to the adjuster to approve; uncertain ones to a claims agent; high-stakes ones (total loss or fraud) to the adjuster. At a large carrier the user is two roles (1) a frontline agent handling intake & exceptions, and (2) a senior adjuster giving approval. The MVP builds for both. Post-MVP, we will evaluate how much more we can safely automate. 

**User Stories**

**Claims agent (primary user):**

* Intake: As a claims agent, I want to submit the first report and have the AI assessment run on its own, so that I never write the estimate from scratch.

* Review: As a claims agent, I want to review a flagged estimate line by line, fixing what's wrong, so the final estimate is accurate and every correction improves the tool.

* Action: As a claims agent, I want to route a claim to the adjuster, back to the policyholder for more photos, or out for an in-person inspection \- so that it moves to the right place.

**Senior adjuster (signs off):**

* Decisioning: As a senior adjuster, I want a claim to open with the full assessment done so that I can approve, edit, send back, escalate, or refer to fraud investigation in one click.

* Risk Alerts: As a senior adjuster, I want a likely total loss or fraud concern called out at the top with the specific reason, so that I can focus on the decisions that carry real risk.

**Key Features & Prioritization (MVP)**

| \# | Feature | What it does | Tier |
| ----- | ----- | ----- | ----- |
| 1 | Automatic assessment | The AI assesses the claim the moment it lands; for a standard claim, the agent's manual review step disappears. | ***Core*** |
| 2 | Itemized, priced estimate | Part-and-labor cost for damage, priced against a standard repair-cost database (Mitchell, CCC, Audatex) or carrier's rate sheet, with the AI's confidence & reasoning. Automates manual cost lookup and keeps a record for disputes. | ***Core*** |
| 3 | Confidence- based router | A rule set — confidence, dollar amount, hidden-damage or fraud risk, nearness to total loss — sends each claim to the adjuster, to the agent for review, or out to a specialist. | ***Core*** |
| 4 | Review screen | Agent or adjuster sees the full estimate, the AI's reasoning, and the flags, and confirms or corrects it before deciding. | ***Core*** |
| 5 | Hidden- damage risk | A low/medium/high flag for the chance the shop finds more on teardown — aimed directly at the 40% supplement rate. | ***Differentiator*** |
| 6 | Possible total loss | Flags when the estimate nears the car's value (70–80% most states use). Flag only; full valuation is a later release. | ***Differentiator*** |
| 7 | Fraud concern | Surfaces what doesn't add up — damage that doesn't match the story, no police report, a shop that keeps reappearing.  | ***Differentiator*** |
| 8 | Learning loop | Every confirmation and correction is logged and sorted by claim type — the basis for automating more over time. | ***Differentiator*** |

**Rationale:** Features 1-4 are the core workflow. Features 5-8 are where we win: the commodity vendors solved the estimate but not the workflow around it. The learning loop (8) determines whether more can be automated in post-MVP. 

**Success Metrics**

**Primary**

* Cycle time (claim arrival → repair authorized) \- the speed the product directly controls. Excludes claim-to-payout, since the body shop owns most of that.

**Balancing** — can't slip while cycle time improves

* Supplement rate — are the estimates accurate?  
* Adjuster overturn rate on AI-recommended approvals — are the decisions sound?  
* Customer satisfaction — ensuring customer satisfaction doesn’t slip.

**Business impact** — the slower numbers the carrier ultimately cares about

* Claims handled per adjuster — ops throughput; the efficiency gain that justifies spend.  
* Dollars of leakage recovered — the 7-14¢-on-the-dollar problem, reclaimed.

**AI Integration and the Human–AI Handoff**  
   
We treat the assessment engine as an input, not the product – the value is the layer we build around it. Every estimate is priced against an authoritative cost database (Mitchell, Audatex, the carrier's rate sheet) so it holds up to a regulator. On top of that, we normalize what the engine returns, score our own confidence, and generate the signals the router needs (hidden damage, total loss, fraud) that a raw estimate won't surface. Carrier rules are versioned and configurable, not hardcoded, so a carrier can swap engines without touching anything above. And we don't let the router make a real call until we’ve built confidence with the live adjusters using it.

**How AI and humans work together**   
Our principle is simple: the AI drafts, a human decides. The agent or adjuster confirms, corrects, and owns the final call – and every correction feeds back to make the model better. 

* It can approve, but it can't deny. Every denial needs a person and a written reason.  
* It flags fraud; it never refers. A person makes that call.  
* It can't rubber-stamp itself. Instant approvals on big claims route to QA, and we blind-sample AI approvals for second review.  
* Policyholders always know when AI was involved, get a plain-language explanation, and can ask for a human to take another look.  
  ---

1. Five Sigma, *"Exclusive Data: A Glimpse into Claims Adjusters' Day-to-Day Workloads"* (2023). [fivesigmalabs.com](http://fivesigmalabs.com)  
2. Mitchell International, Auto Physical Damage Industry Trends Reports (2017–2018). [mitchell.com](http://mitchell.com)  
3. J.D. Power 2024 U.S. Auto Claims Satisfaction Study (22.3-day average repair cycle). [jdpower.com](http://jdpower.com)  
4. EY, *"Tackling indemnity and leakage in P\&C litigated claims"* (2025). [ey.com](http://ey.com)  
5. J.D. Power 2024 U.S. Auto Claims Satisfaction Study. [jdpower.com](http://jdpower.com)  
6. CCC Intelligent Solutions (Estimate-STP at 7 of the top 10 US carriers),(2023). [repairerdrivennews.com](http://repairerdrivennews.com)  
7. Tractable partnership announcements — GEICO (2021), The Hartford (2021), American Family / *Fortune* (2022).