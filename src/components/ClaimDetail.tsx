"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Claim, ClaimStatus, Persona } from "@/data/types";
import { seedClaims } from "@/data/claims";
import { getUserClaims, saveUserClaim } from "@/lib/storage";
import { statusLabel, statusColor, usd, pct, shortDateTime } from "@/lib/format";
import { PersonaToggle, getPersonaFromSearch } from "@/components/PersonaToggle";

export function ClaimDetail({ claimId }: { claimId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const persona = getPersonaFromSearch(searchParams);

  const [claim, setClaim] = useState<Claim | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const userClaims = getUserClaims();
    const found =
      userClaims.find((c) => c.id === claimId) ??
      seedClaims.find((c) => c.id === claimId) ??
      null;
    setClaim(found);
    setMounted(true);
  }, [claimId]);

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

  const a = claim.assessment;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href={{ pathname: "/", query: { persona } }}
          className="text-xs text-slate-500 hover:text-slate-300"
        >
          ← Back to queue
        </Link>
        <PersonaToggle />
      </div>

      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
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
            Received {shortDateTime(claim.receivedAt)} · Policy{" "}
            {claim.policyNumber} · Claimant {claim.claimantName}
          </p>
        </div>
      </header>

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

                <div className="space-y-3">
                  {a.findings.map((f, i) => (
                    <div
                      key={i}
                      className="rounded border border-slate-800 bg-slate-900/40 p-3"
                    >
                      <div className="mb-1 flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium text-slate-100">
                            {f.area}
                          </div>
                          <div className="text-xs text-slate-400">
                            {f.damageType} · severity {f.severity}/5 ·{" "}
                            {f.recommendation === "replace"
                              ? "Replace"
                              : "Repair"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-slate-100">
                            {usd(f.estimatedCost)}
                          </div>
                          <div className="text-xs text-slate-500">
                            confidence {pct(f.confidence)}
                          </div>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{f.rationale}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wider text-slate-500">
                          Supplement risk
                        </span>
                        <SupplementRiskPill risk={f.supplementRisk} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded border border-slate-800 bg-slate-900/40 p-3 text-xs text-slate-400">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">
                    AI rationale
                  </div>
                  <p className="mt-1 text-slate-300">{a.rationale}</p>
                </div>
              </Card>

              {a.fraudAdvisory.triggered && (
                <Card title="Fraud advisory">
                  <p className="text-sm text-rose-200">
                    {a.fraudAdvisory.reason}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Advisory only. The AI does not refer to SIU. Senior adjuster
                    decides whether to approve, request documentation, or refer
                    to Special Investigations Unit.
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

              <Card title="Routing decision">
                <p className="text-sm text-slate-200">
                  {persona === "agent" && claim.status === "AGENT_REVIEW"
                    ? "This claim was routed to the claims agent because: "
                    : "This claim was routed because: "}
                  <span className="text-slate-300">{a.routeRationale}</span>
                </p>
              </Card>
            </>
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

          <Card title="Decision history">
            <ol className="space-y-2 text-xs">
              {claim.decisionHistory.map((entry, i) => (
                <li
                  key={i}
                  className="border-l border-slate-800 pl-3"
                >
                  <div className="text-slate-300">{entry.action}</div>
                  <div className="text-slate-500">
                    {entry.by} · {shortDateTime(entry.at)}
                  </div>
                  {entry.note && (
                    <div className="mt-1 text-slate-400">{entry.note}</div>
                  )}
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
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

  return (
    <div className="space-y-3">
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
          {claim.assessment?.fraudAdvisory.triggered && (
            <ActionButton
              tone="rose"
              onClick={() =>
                onDecision(
                  "ESCALATED",
                  "Referred to Special Investigations Unit (SIU).",
                  note || "Reviewed AI fraud advisory and confirmed referral."
                )
              }
            >
              Refer to SIU
            </ActionButton>
          )}
        </div>
      )}
    </div>
  );
}

function ActionButton({
  tone,
  onClick,
  children,
}: {
  tone: "primary" | "amber" | "violet" | "rose";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const map: Record<string, string> = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white",
    amber:
      "bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/30",
    violet:
      "bg-violet-500/10 hover:bg-violet-500/20 text-violet-200 ring-1 ring-violet-500/30",
    rose: "bg-rose-500/10 hover:bg-rose-500/20 text-rose-200 ring-1 ring-rose-500/30",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-3 py-2 text-left text-sm font-medium transition-colors ${map[tone]}`}
    >
      {children}
    </button>
  );
}
