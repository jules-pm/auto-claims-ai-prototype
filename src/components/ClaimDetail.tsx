"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type {
  AIAssessment,
  Claim,
  ClaimStatus,
  DamageFinding,
  FindingFeedback,
  Persona,
} from "@/data/types";

// Effective cost = agent's override if present, else the AI's estimate.
function effectiveCost(f: DamageFinding): number {
  if (f.feedback?.state === "adjusted" && typeof f.feedback.newCost === "number") {
    return f.feedback.newCost;
  }
  return f.estimatedCost;
}
import { seedClaims } from "@/data/claims";
import { getUserClaims, saveUserClaim } from "@/lib/storage";
import { statusLabel, statusColor, usd, pct, shortDateTime } from "@/lib/format";
import { getPersonaFromSearch } from "@/components/PersonaToggle";
import { TopBar } from "@/components/TopBar";
import { FlowSteps } from "@/components/FlowSteps";

async function urlToBase64(
  url: string
): Promise<{ base64: string; mediaType: "image/jpeg" | "image/png" | "image/webp" }> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load photo (${response.status})`);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [meta, data] = result.split(",", 2);
      const match = meta.match(/data:(image\/(?:jpeg|png|webp));/);
      if (!match) {
        reject(new Error("Unsupported image type. Use JPG, PNG, or WEBP."));
        return;
      }
      resolve({
        base64: data,
        mediaType: match[1] as "image/jpeg" | "image/png" | "image/webp",
      });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function routeToStatus(
  route: AIAssessment["recommendedRoute"]
): ClaimStatus {
  if (route === "AGENT_REVIEW") return "AGENT_REVIEW";
  return "ADJUSTER_REVIEW_AUTO_ROUTED";
}

export function ClaimDetail({ claimId }: { claimId: string }) {
  const searchParams = useSearchParams();
  const persona = getPersonaFromSearch(searchParams);

  const [claim, setClaim] = useState<Claim | null>(null);
  const [mounted, setMounted] = useState(false);
  const [assessing, setAssessing] = useState(false);
  const [assessStage, setAssessStage] = useState(0);
  const [assessError, setAssessError] = useState<string | null>(null);
  const assessmentTriggered = useRef(false);

  // Advance the progress stages while the live vision call is in flight.
  // These mirror the real orchestration pipeline so the wait reads as work.
  useEffect(() => {
    if (!assessing) {
      setAssessStage(0);
      return;
    }
    const timers = [
      setTimeout(() => setAssessStage(1), 2500),
      setTimeout(() => setAssessStage(2), 6000),
      setTimeout(() => setAssessStage(3), 10000),
      setTimeout(() => setAssessStage(4), 14000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [assessing]);

  useEffect(() => {
    const userClaims = getUserClaims();
    const found =
      userClaims.find((c) => c.id === claimId) ??
      seedClaims.find((c) => c.id === claimId) ??
      null;
    setClaim(found);
    setMounted(true);
  }, [claimId]);

  useEffect(() => {
    if (!claim) return;
    if (claim.assessment) return;
    if (claim.status !== "NEW") return;
    if (assessmentTriggered.current) return;
    assessmentTriggered.current = true;

    (async () => {
      setAssessing(true);
      setAssessError(null);
      try {
        const photoUrl = claim.photos[0];
        if (!photoUrl) throw new Error("No photo attached to claim");
        const { base64, mediaType } = await urlToBase64(photoUrl);

        const res = await fetch("/api/assess", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64,
            mediaType,
            vehicle: claim.vehicle,
            accident: claim.accident,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Vision call failed: ${res.statusText}`);
        }
        const { assessment } = (await res.json()) as { assessment: AIAssessment };
        const nextStatus = routeToStatus(assessment.recommendedRoute);
        const now = new Date().toISOString();
        const updated: Claim = {
          ...claim,
          assessment,
          status: nextStatus,
          decisionHistory: [
            ...claim.decisionHistory,
            {
              by: "system",
              action: "Live AI assessment completed",
              at: now,
            },
            {
              by: "system",
              action: `Routed to ${nextStatus} (${assessment.recommendedRoute})`,
              at: now,
            },
          ],
        };
        saveUserClaim(updated);
        setClaim(updated);
      } catch (err) {
        setAssessError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setAssessing(false);
      }
    })();
  }, [claim]);

  if (!mounted) {
    return <div className="p-10 text-sm text-slate-500">Loading claim…</div>;
  }
  if (!claim) {
    return (
      <div className="p-10 text-sm text-slate-400">
        Claim not found.{" "}
        <Link href={`/?persona=${persona}`} className="text-blue-400">
          Back to queue
        </Link>
      </div>
    );
  }

  function applyDecision(
    nextStatus: ClaimStatus,
    actionLabel: string,
    note?: string
  ) {
    if (!claim) return;
    const updated: Claim = {
      ...claim,
      status: nextStatus,
      decisionHistory: [
        ...claim.decisionHistory,
        {
          by: persona,
          action: actionLabel,
          at: new Date().toISOString(),
          note,
        },
      ],
    };
    saveUserClaim(updated);
    setClaim(updated);
  }

  // Per-finding human feedback — the disagreement-capture / eval signal.
  function applyFindingFeedback(
    findingIndex: number,
    feedback: FindingFeedback
  ) {
    if (!claim || !claim.assessment) return;
    const findings = claim.assessment.findings.map((f, i) =>
      i === findingIndex ? { ...f, feedback } : f
    );
    const newTotal = findings.reduce(
      (sum, f) => sum + effectiveCost(f),
      0
    );
    const action =
      feedback.state === "confirmed"
        ? `Confirmed AI finding: ${claim.assessment.findings[findingIndex].area}`
        : `Adjusted AI finding: ${claim.assessment.findings[findingIndex].area} (${usd(
            claim.assessment.findings[findingIndex].estimatedCost
          )} → ${usd(feedback.newCost ?? 0)})`;
    const updated: Claim = {
      ...claim,
      assessment: { ...claim.assessment, findings, totalEstimate: newTotal },
      decisionHistory: [
        ...claim.decisionHistory,
        {
          by: persona,
          action,
          at: feedback.at,
          note: feedback.reason,
        },
      ],
    };
    saveUserClaim(updated);
    setClaim(updated);
  }

  const a = claim.assessment;

  // Whether the current persona can review/edit findings on this claim.
  const canReview =
    (persona === "agent" && claim.status === "AGENT_REVIEW") ||
    (persona === "adjuster" &&
      (claim.status === "ADJUSTER_REVIEW_AUTO_ROUTED" ||
        claim.status === "ADJUSTER_REVIEW_POST_AGENT"));

  // Parse queue order from search params for prev/next navigation
  const queueParam = searchParams.get("queue");
  const queueIds = queueParam ? queueParam.split(",").filter(Boolean) : [];
  const currentIdx = queueIds.indexOf(claimId);
  const prevId = currentIdx > 0 ? queueIds[currentIdx - 1] : null;
  const nextId =
    currentIdx >= 0 && currentIdx < queueIds.length - 1
      ? queueIds[currentIdx + 1]
      : null;
  const positionLabel =
    currentIdx >= 0 && queueIds.length > 0
      ? `Claim ${currentIdx + 1} of ${queueIds.length}`
      : null;

  function buildClaimHref(id: string) {
    const params = new URLSearchParams();
    params.set("persona", persona);
    if (queueParam) params.set("queue", queueParam);
    return `/claim/${id}?${params.toString()}`;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <Link
            href={{
              pathname: "/",
              query: queueParam
                ? { persona, filter: searchParams.get("filter") ?? undefined }
                : { persona },
            }}
            className="text-xs text-slate-500 hover:text-slate-300"
          >
            ← Back to queue
          </Link>
          {positionLabel && (
            <div className="flex items-center gap-2 text-xs">
              {prevId ? (
                <Link
                  href={buildClaimHref(prevId)}
                  className="rounded border border-slate-800 px-2 py-1 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                >
                  ← Previous
                </Link>
              ) : (
                <span className="rounded border border-slate-900 px-2 py-1 text-slate-700">
                  ← Previous
                </span>
              )}
              <span className="text-slate-500">{positionLabel}</span>
              {nextId ? (
                <Link
                  href={buildClaimHref(nextId)}
                  className="rounded border border-slate-800 px-2 py-1 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                >
                  Next →
                </Link>
              ) : (
                <span className="rounded border border-slate-900 px-2 py-1 text-slate-700">
                  Next →
                </span>
              )}
            </div>
          )}
        </div>


        <header className="mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-100">
              {claim.id}
            </h1>
            <span
              className={`inline-flex items-center rounded px-2 py-0.5 text-xs ring-1 ring-inset ${
                statusColor[claim.status]
              }`}
            >
              {statusLabel[claim.status]}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            {claim.claimantName} · Policy {claim.policyNumber} · Received{" "}
            {shortDateTime(claim.receivedAt)}
          </p>
          <div className="mt-4">
            <FlowSteps status={claim.status} />
          </div>
        </header>

      {a && <RoutingBanner assessment={a} />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Claim context">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Detail label="Vehicle">
                {claim.vehicle.year} {claim.vehicle.make} {claim.vehicle.model}{" "}
                {claim.vehicle.trim}
              </Detail>
              <Detail label="Vehicle ACV (policy)">
                {usd(claim.vehicle.acv)}
              </Detail>
              <Detail label="Accident date">{claim.accident.date}</Detail>
              <Detail label="Accident location">
                {claim.accident.location}
              </Detail>
              <Detail label="Claimant description" wide>
                {claim.accident.description}
              </Detail>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {claim.photos.map((src, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded border border-slate-800 bg-slate-900"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`Claim photo ${i + 1}`}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          </Card>

          {a ? (
            <>
              <Card title="AI damage assessment">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <Pill tone="slate">
                    Overall confidence {pct(a.overallConfidence)}
                  </Pill>
                  <Pill tone="slate">
                    Estimate {usd(a.totalEstimate)}
                  </Pill>
                  <Pill tone="slate">
                    Repair-to-ACV {pct(a.repairToAcvRatio)}
                  </Pill>
                  {a.potentialTotalLoss && (
                    <Pill tone="violet">Potential total loss</Pill>
                  )}
                  {a.fraudAdvisory.triggered && (
                    <Pill tone="rose">Fraud advisory</Pill>
                  )}
                  {a.findings.some((f) => f.supplementRisk === "high") && (
                    <Pill tone="amber">Supplement risk</Pill>
                  )}
                </div>

                <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500">
                  <span>Line items — priced against repair-cost database</span>
                  <span>Estimated cost</span>
                </div>
                {canReview && (
                  <p className="mb-2 text-[11px] text-slate-500">
                    Review each line — confirm if the AI got it right, or adjust
                    the cost / repair call if it&apos;s off. Your feedback is
                    captured as labeled data for model eval.
                  </p>
                )}

                <div className="space-y-2.5">
                  {a.findings.map((f, i) => (
                    <FindingRow
                      key={i}
                      finding={f}
                      editable={canReview}
                      onFeedback={(fb) => applyFindingFeedback(i, fb)}
                      persona={persona}
                    />
                  ))}
                </div>

                {/* Estimate total */}
                <div className="mt-3 flex items-center justify-between border-t border-slate-700 pt-3">
                  <div className="text-sm font-medium text-slate-200">
                    Total estimate
                    <span className="ml-2 text-xs font-normal text-slate-500">
                      {a.findings.length} line item
                      {a.findings.length === 1 ? "" : "s"}
                      {a.findings.some((f) => f.feedback?.state === "adjusted") &&
                        " · agent-adjusted"}
                    </span>
                  </div>
                  <div className="text-lg font-semibold text-slate-100">
                    {usd(a.totalEstimate)}
                  </div>
                </div>

                <div className="mt-4 rounded border border-slate-800 bg-slate-900/40 p-3 text-xs text-slate-400">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">
                    How this estimate was built
                  </div>
                  <p className="mt-1 text-slate-300">{a.rationale}</p>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Each line item is priced parts + labor against a standardized
                    repair-cost database (Mitchell / CCC / Audatex) or the
                    carrier&apos;s negotiated rate sheet — automating the lookup a
                    claims agent does by hand today.
                  </p>
                </div>
              </Card>

              {a.fraudAdvisory.triggered && (
                <Card title="⚠ Fraud advisory">
                  <div className="rounded border border-rose-500/30 bg-rose-500/5 p-3">
                    <p className="text-sm text-rose-200">
                      {a.fraudAdvisory.reason}
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Advisory only — the AI never refers to SIU on its own. The
                    senior adjuster reviews the indicators and decides whether to
                    approve, request documentation, or refer to the Special
                    Investigations Unit.
                  </p>
                </Card>
              )}

              {a.potentialTotalLoss && (
                <Card title="Potential total loss advisory">
                  <p className="text-sm text-violet-200">
                    Repair estimate {usd(a.totalEstimate)} against vehicle ACV{" "}
                    {usd(claim.vehicle.acv)} = {pct(a.repairToAcvRatio)}.
                    Exceeds typical state total-loss threshold (70–80%).
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Senior adjuster decides repair vs. total-loss path. Full
                    total-loss valuation (vehicle market data, settlement
                    workflow) is v2.
                  </p>
                </Card>
              )}
            </>
          ) : assessing ? (
            <Card title="AI assessment running">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                <p className="text-sm text-slate-300">
                  Claude Sonnet 4.6 vision · live call
                </p>
              </div>
              <AssessProgress stage={assessStage} />
              <p className="mt-3 text-xs text-slate-500">
                In production this is event-driven on claim arrival. In the
                prototype, opening the claim is the trigger so the call runs
                live.
              </p>
            </Card>
          ) : assessError ? (
            <Card title="AI assessment failed">
              <p className="text-sm text-rose-300">{assessError}</p>
              <p className="mt-2 text-xs text-slate-500">
                Likely missing ANTHROPIC_API_KEY in .env.local, or rate-limited.
                Restart dev server after editing the env file.
              </p>
            </Card>
          ) : (
            <Card title="AI assessment pending">
              <p className="text-sm text-slate-400">
                Assessment has not run yet for this claim.
              </p>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Decision">
            <DecisionPanel
              claim={claim}
              persona={persona}
              onDecision={applyDecision}
            />
          </Card>

          <Card title="Audit timeline">
            <ol className="space-y-0">
              {claim.decisionHistory.map((entry, i) => {
                const last = i === claim.decisionHistory.length - 1;
                return (
                  <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
                    {/* connector line */}
                    {!last && (
                      <span className="absolute left-[7px] top-4 h-full w-px bg-slate-800" />
                    )}
                    {/* actor dot */}
                    <ActorDot by={entry.by} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <ActorBadge by={entry.by} />
                        <span className="text-[10px] text-slate-500">
                          {shortDateTime(entry.at)}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-slate-300">
                        {entry.action}
                      </div>
                      {entry.note && (
                        <div className="mt-1 rounded bg-slate-900/60 px-2 py-1 text-[11px] italic text-slate-400">
                          “{entry.note}”
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>
      </div>
      </main>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/60 p-5">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Detail({
  label,
  children,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <div className="text-[10px] uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="mt-0.5 text-sm text-slate-200">{children}</div>
    </div>
  );
}

function Pill({
  tone,
  children,
}: {
  tone: "slate" | "violet" | "rose" | "amber" | "emerald";
  children: React.ReactNode;
}) {
  const map: Record<string, string> = {
    slate: "bg-slate-800 text-slate-200 ring-slate-700",
    violet: "bg-violet-500/15 text-violet-200 ring-violet-500/30",
    rose: "bg-rose-500/15 text-rose-200 ring-rose-500/30",
    amber: "bg-amber-500/15 text-amber-200 ring-amber-500/30",
    emerald: "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30",
  };
  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-xs ring-1 ring-inset ${map[tone]}`}
    >
      {children}
    </span>
  );
}

function SupplementRiskPill({ risk }: { risk: "low" | "medium" | "high" }) {
  const map = {
    low: { tone: "emerald" as const, label: "Low" },
    medium: { tone: "amber" as const, label: "Medium" },
    high: { tone: "rose" as const, label: "High" },
  };
  const cfg = map[risk];
  return <Pill tone={cfg.tone}>{cfg.label}</Pill>;
}

const ASSESS_STAGES = [
  "Reading claimant photos",
  "Detecting and classifying damage areas",
  "Pricing line items against repair-cost database",
  "Scoring confidence and supplement risk",
  "Determining routing",
];

function AssessProgress({ stage }: { stage: number }) {
  return (
    <ol className="space-y-1.5">
      {ASSESS_STAGES.map((label, i) => {
        const done = i < stage;
        const active = i === stage;
        return (
          <li key={i} className="flex items-center gap-2 text-xs">
            <span
              className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] ${
                done
                  ? "bg-blue-500/70 text-white"
                  : active
                  ? "bg-blue-400 text-white"
                  : "bg-slate-800 text-slate-600"
              }`}
            >
              {done ? "✓" : active ? "" : ""}
            </span>
            <span
              className={
                done
                  ? "text-slate-400"
                  : active
                  ? "text-blue-300"
                  : "text-slate-600"
              }
            >
              {label}
              {active && <AnimatedDots />}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function AnimatedDots() {
  return (
    <span className="ml-0.5 inline-flex">
      <span className="animate-pulse">.</span>
      <span className="animate-pulse [animation-delay:150ms]">.</span>
      <span className="animate-pulse [animation-delay:300ms]">.</span>
    </span>
  );
}

function FindingRow({
  finding: f,
  editable,
  onFeedback,
  persona,
}: {
  finding: DamageFinding;
  editable?: boolean;
  onFeedback?: (fb: FindingFeedback) => void;
  persona?: Persona;
}) {
  const cb = f.costBreakdown;
  const laborTotal = cb ? cb.laborHours * cb.laborRate : 0;
  const [editing, setEditing] = useState(false);

  const adjusted = f.feedback?.state === "adjusted";
  const confirmed = f.feedback?.state === "confirmed";
  const shownCost =
    adjusted && typeof f.feedback?.newCost === "number"
      ? f.feedback.newCost
      : f.estimatedCost;
  const shownRec =
    adjusted && f.feedback?.newRecommendation
      ? f.feedback.newRecommendation
      : f.recommendation;

  return (
    <div
      className={`rounded border p-3 ${
        adjusted
          ? "border-amber-500/30 bg-amber-500/5"
          : confirmed
          ? "border-emerald-500/20 bg-emerald-500/5"
          : "border-slate-800 bg-slate-900/40"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-100">{f.area}</div>
          <div className="text-xs text-slate-400">
            {f.damageType} · severity {f.severity}/5 ·{" "}
            {shownRec === "replace" ? "Replace" : "Repair"}
          </div>
        </div>
        <div className="text-right">
          {adjusted ? (
            <div className="text-sm">
              <span className="text-slate-500 line-through">
                {usd(f.estimatedCost)}
              </span>{" "}
              <span className="font-semibold text-amber-300">
                {usd(shownCost)}
              </span>
            </div>
          ) : (
            <div className="text-sm font-semibold text-slate-100">
              {usd(shownCost)}
            </div>
          )}
          <div className="text-[10px] uppercase tracking-wider text-slate-500">
            {pct(f.confidence)} conf
          </div>
        </div>
      </div>

      {/* Cost basis */}
      {cb && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded bg-slate-950/60 px-2 py-1.5 text-[11px] text-slate-400">
          {cb.partType !== "n/a" && (
            <span>
              <span className="text-slate-500">Parts</span>{" "}
              <span className="text-slate-300">{usd(cb.partsCost)}</span>{" "}
              <span className="text-slate-600">({cb.partType})</span>
            </span>
          )}
          {cb.laborHours > 0 && (
            <span>
              <span className="text-slate-500">Labor</span>{" "}
              <span className="text-slate-300">
                {cb.laborHours} hr × {usd(cb.laborRate)} = {usd(laborTotal)}
              </span>
            </span>
          )}
          <span className="ml-auto text-slate-600">{cb.costSource}</span>
        </div>
      )}

      <p className="mt-2 text-xs text-slate-400">{f.rationale}</p>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">
          Supplement risk
        </span>
        <SupplementRiskPill risk={f.supplementRisk} />
      </div>

      {/* Human feedback state / controls */}
      {f.feedback ? (
        <div className="mt-2.5 border-t border-slate-800/60 pt-2 text-[11px]">
          {confirmed ? (
            <span className="text-emerald-300">
              ✓ Confirmed by {f.feedback.by === "agent" ? "claims agent" : "senior adjuster"}
            </span>
          ) : (
            <span className="text-amber-300">
              ✎ Adjusted by {f.feedback.by === "agent" ? "claims agent" : "senior adjuster"}
              {f.feedback.reason ? ` — “${f.feedback.reason}”` : ""}
            </span>
          )}
        </div>
      ) : editable && !editing ? (
        <div className="mt-2.5 flex items-center gap-2 border-t border-slate-800/60 pt-2">
          <button
            type="button"
            onClick={() =>
              onFeedback?.({
                state: "confirmed",
                by: persona ?? "agent",
                at: new Date().toISOString(),
              })
            }
            className="rounded bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-200 ring-1 ring-inset ring-emerald-500/30 hover:bg-emerald-500/20"
          >
            ✓ Looks right
          </button>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-200 ring-1 ring-inset ring-amber-500/30 hover:bg-amber-500/20"
          >
            ✎ Adjust
          </button>
        </div>
      ) : editable && editing ? (
        <FindingEditor
          finding={f}
          persona={persona ?? "agent"}
          onCancel={() => setEditing(false)}
          onSave={(fb) => {
            setEditing(false);
            onFeedback?.(fb);
          }}
        />
      ) : null}
    </div>
  );
}

const FAILURE_MODES = [
  "Hidden damage",
  "Labor hours",
  "Part type (OEM/aftermarket)",
  "Wrong severity",
  "Photo quality",
];

function FindingEditor({
  finding: f,
  persona,
  onCancel,
  onSave,
}: {
  finding: DamageFinding;
  persona: Persona;
  onCancel: () => void;
  onSave: (fb: FindingFeedback) => void;
}) {
  const [cost, setCost] = useState(String(f.estimatedCost));
  const [rec, setRec] = useState<"repair" | "replace">(f.recommendation);
  const [tags, setTags] = useState<string[]>([]);

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  return (
    <div className="mt-2.5 space-y-2.5 border-t border-slate-800/60 pt-2.5">
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-slate-500">
            Corrected cost
          </span>
          <input
            type="number"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className="mt-0.5 block w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-slate-500">
            Repair / replace
          </span>
          <div className="mt-0.5 flex rounded border border-slate-700 bg-slate-900 p-0.5 text-xs">
            {(["repair", "replace"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setRec(opt)}
                className={`flex-1 rounded px-2 py-0.5 capitalize ${
                  rec === opt
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </label>
      </div>
      <div>
        <span className="text-[10px] uppercase tracking-wider text-slate-500">
          What did the AI miss? (optional — tags the eval signal)
        </span>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {FAILURE_MODES.map((mode) => {
            const on = tags.includes(mode);
            return (
              <button
                key={mode}
                type="button"
                onClick={() => toggleTag(mode)}
                className={`rounded-full px-2 py-0.5 text-[11px] ring-1 ring-inset transition-colors ${
                  on
                    ? "bg-amber-500/20 text-amber-200 ring-amber-500/40"
                    : "bg-slate-900 text-slate-400 ring-slate-700 hover:text-slate-200"
                }`}
              >
                {on ? "✓ " : ""}
                {mode}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded px-2 py-1 text-[11px] text-slate-400 hover:text-slate-200"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() =>
            onSave({
              state: "adjusted",
              by: persona,
              at: new Date().toISOString(),
              newCost: Number(cost) || 0,
              newRecommendation: rec,
              reason: tags.length ? tags.join(", ") : undefined,
            })
          }
          className="rounded bg-amber-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-amber-500"
        >
          Save correction
        </button>
      </div>
    </div>
  );
}

function RoutingBanner({ assessment: a }: { assessment: AIAssessment }) {
  const cfg = routeDisplay(a.recommendedRoute);
  return (
    <div
      className={`mb-6 rounded-lg border p-4 ${cfg.container}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg leading-none">{cfg.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Routing decision
            </span>
            <span className={`text-sm font-semibold ${cfg.title}`}>
              {cfg.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-300">{a.routeRationale}</p>
        </div>
      </div>
    </div>
  );
}

function routeDisplay(route: AIAssessment["recommendedRoute"]): {
  label: string;
  icon: string;
  container: string;
  title: string;
} {
  switch (route) {
    case "ADJUSTER_REVIEW_AUTO_ROUTED":
      return {
        label: "Auto-routed to senior adjuster (fast-track)",
        icon: "⚡",
        container: "border-emerald-500/30 bg-emerald-500/5",
        title: "text-emerald-300",
      };
    case "ADJUSTER_REVIEW_POTENTIAL_TOTAL_LOSS":
      return {
        label: "Senior adjuster — potential total loss",
        icon: "◆",
        container: "border-violet-500/30 bg-violet-500/5",
        title: "text-violet-300",
      };
    case "ADJUSTER_REVIEW_FRAUD_FLAGGED":
      return {
        label: "Senior adjuster — fraud advisory",
        icon: "⚠",
        container: "border-rose-500/30 bg-rose-500/5",
        title: "text-rose-300",
      };
    case "AGENT_REVIEW":
    default:
      return {
        label: "Claims agent — exception review",
        icon: "◷",
        container: "border-amber-500/30 bg-amber-500/5",
        title: "text-amber-300",
      };
  }
}

function actorMeta(by: Persona | "system"): {
  label: string;
  dot: string;
  badge: string;
} {
  switch (by) {
    case "system":
      return {
        label: "AI / System",
        dot: "bg-blue-500/60 ring-blue-500/30",
        badge: "bg-blue-500/15 text-blue-300 ring-blue-500/30",
      };
    case "agent":
      return {
        label: "Claims agent",
        dot: "bg-amber-500/60 ring-amber-500/30",
        badge: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
      };
    case "adjuster":
      return {
        label: "Senior adjuster",
        dot: "bg-emerald-500/60 ring-emerald-500/30",
        badge: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
      };
  }
}

function ActorDot({ by }: { by: Persona | "system" }) {
  const m = actorMeta(by);
  return (
    <span
      className={`relative z-10 mt-0.5 h-3.5 w-3.5 flex-shrink-0 rounded-full ring-2 ${m.dot}`}
    />
  );
}

function ActorBadge({ by }: { by: Persona | "system" }) {
  const m = actorMeta(by);
  return (
    <span
      className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ring-1 ring-inset ${m.badge}`}
    >
      {m.label}
    </span>
  );
}

function DecisionPanel({
  claim,
  persona,
  onDecision,
}: {
  claim: Claim;
  persona: Persona;
  onDecision: (status: ClaimStatus, action: string, note?: string) => void;
}) {
  const [note, setNote] = useState("");

  const decisioned = ["APPROVED", "RETURNED", "ESCALATED"].includes(
    claim.status
  );

  if (decisioned) {
    return (
      <p className="text-sm text-slate-400">
        Decision recorded. No further action available.
      </p>
    );
  }

  const personaCanAct =
    (persona === "agent" && claim.status === "AGENT_REVIEW") ||
    (persona === "adjuster" &&
      (claim.status === "ADJUSTER_REVIEW_AUTO_ROUTED" ||
        claim.status === "ADJUSTER_REVIEW_POST_AGENT"));

  if (!personaCanAct) {
    return (
      <p className="text-sm text-slate-400">
        This claim is in {statusLabel[claim.status]}. Switch personas above to
        see actions available to that role.
      </p>
    );
  }

  const fraudFlagged = claim.assessment?.fraudAdvisory.triggered === true;

  const actionPrompt =
    persona === "agent"
      ? "Review the AI's draft. Approve to send to the senior adjuster, return for more photos, or escalate for in-person inspection."
      : "Final approval. Approve the estimate, return to the agent, escalate to a field appraiser, or refer to SIU.";

  return (
    <div className="space-y-3">
      <p className="rounded border border-blue-500/20 bg-blue-500/5 px-3 py-2 text-xs text-slate-300">
        {actionPrompt}
      </p>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Decision note (optional — captured in audit log)"
        rows={2}
        className="block w-full rounded border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
      />

      {persona === "agent" && (
        <div className="flex flex-col gap-2">
          <ActionButton
            tone="primary"
            onClick={() =>
              onDecision(
                "ADJUSTER_REVIEW_POST_AGENT",
                "Agent approved estimate. Routed to senior adjuster.",
                note || undefined
              )
            }
          >
            Approve estimate → Senior adjuster
          </ActionButton>
          <ActionButton
            tone="amber"
            onClick={() =>
              onDecision(
                "RETURNED",
                "Returned to claimant: additional photos requested.",
                note || "Photos requested for unclear areas."
              )
            }
          >
            Return to claimant for additional photos
          </ActionButton>
          <ActionButton
            tone="violet"
            onClick={() =>
              onDecision(
                "ESCALATED",
                "Escalated to in-person field appraiser.",
                note || undefined
              )
            }
          >
            Escalate to field appraiser
          </ActionButton>
        </div>
      )}

      {persona === "adjuster" && (
        <div className="flex flex-col gap-2">
          <ActionButton
            tone="primary"
            onClick={() =>
              onDecision(
                "APPROVED",
                "Senior adjuster approved estimate. Authorization issued.",
                note || undefined
              )
            }
          >
            Approve & authorize repair
          </ActionButton>
          <ActionButton
            tone="amber"
            onClick={() =>
              onDecision(
                "AGENT_REVIEW",
                "Returned to claims agent for review.",
                note || undefined
              )
            }
          >
            Return to claims agent
          </ActionButton>
          <ActionButton
            tone="violet"
            onClick={() =>
              onDecision(
                "ESCALATED",
                "Escalated to in-person field appraiser.",
                note || undefined
              )
            }
          >
            Escalate to field appraiser
          </ActionButton>

          {/* Adjuster can always refer to SIU; emphasized when AI flagged fraud */}
          <ActionButton
            tone="rose"
            emphasized={fraudFlagged}
            onClick={() =>
              onDecision(
                "ESCALATED",
                "Referred to Special Investigations Unit (SIU).",
                note ||
                  (fraudFlagged
                    ? "Reviewed AI fraud advisory and confirmed referral."
                    : "Adjuster-initiated SIU referral.")
              )
            }
          >
            {fraudFlagged
              ? "Refer to SIU — fraud advisory active"
              : "Refer to SIU"}
          </ActionButton>
        </div>
      )}
    </div>
  );
}

function ActionButton({
  tone,
  onClick,
  children,
  emphasized,
}: {
  tone: "primary" | "amber" | "violet" | "rose";
  onClick: () => void;
  children: React.ReactNode;
  emphasized?: boolean;
}) {
  const map: Record<string, string> = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white",
    amber:
      "bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/30",
    violet:
      "bg-violet-500/10 hover:bg-violet-500/20 text-violet-200 ring-1 ring-violet-500/30",
    rose: "bg-rose-500/10 hover:bg-rose-500/20 text-rose-200 ring-1 ring-rose-500/30",
  };
  const emphasis =
    emphasized && tone === "rose"
      ? "bg-rose-500/20 ring-rose-400/60 text-rose-100"
      : "";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-3 py-2 text-left text-sm font-medium transition-colors ${map[tone]} ${emphasis}`}
    >
      {children}
    </button>
  );
}
