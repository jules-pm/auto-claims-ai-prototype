"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Claim } from "@/data/types";
import { getUserClaims } from "@/lib/storage";
import { statusLabel, statusColor, usd, pct } from "@/lib/format";
import { getPersonaFromSearch } from "@/components/PersonaToggle";
import { TopBar } from "@/components/TopBar";
import { Sidebar, getActiveFilter } from "@/components/Sidebar";
import { FlowSteps } from "@/components/FlowSteps";

export function QueuePage({ seedClaims }: { seedClaims: Claim[] }) {
  const searchParams = useSearchParams();
  const persona = getPersonaFromSearch(searchParams);
  const [userClaims, setUserClaims] = useState<Claim[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setUserClaims(getUserClaims());
    setMounted(true);
  }, []);

  const userById = new Map(userClaims.map((c) => [c.id, c]));
  const allClaims: Claim[] = [
    ...userClaims,
    ...seedClaims.filter((c) => !userById.has(c.id)),
  ];

  const activeFilter = getActiveFilter(persona, searchParams.get("filter"));
  const queue = allClaims.filter(activeFilter.predicate);

  // Only show the "Start review" walk-through on actionable queues.
  const actionable = ["needs-review", "needs-approval", "flagged", "fast-track"];
  const showStartReview = actionable.includes(activeFilter.id) && queue.length > 0;

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <div className="flex flex-1">
        <Sidebar persona={persona} allClaims={allClaims} />
        <main className="flex-1 px-6 py-6 md:px-8">
          <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500">
                {persona === "agent" ? "Claims agent" : "Senior adjuster"}
              </div>
              <h1 className="mt-0.5 text-xl font-semibold text-slate-100">
                {activeFilter.label}
                <span className="ml-2 text-sm font-normal text-slate-500">
                  {queue.length}
                </span>
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {persona === "agent" && (
                <Link
                  href="/intake"
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500"
                >
                  + Report a claim
                </Link>
              )}
              <span className="text-xs text-slate-500">Sort:</span>
              <span className="rounded border border-slate-800 px-2 py-1 text-xs text-slate-300">
                Most recent
              </span>
            </div>
          </header>

          {showStartReview && (
            <div className="mb-5 flex items-center justify-between rounded-lg border border-slate-800 bg-gradient-to-r from-blue-500/10 to-transparent px-4 py-3">
              <div>
                <div className="text-sm font-medium text-slate-100">
                  {queue.length} claim{queue.length === 1 ? "" : "s"} in this queue
                </div>
                <div className="mt-0.5 text-xs text-slate-400">
                  {persona === "agent"
                    ? "Walk through each claim, review the AI's draft, decide and move on."
                    : "Walk through each claim, approve the estimate, return for more info, or refer to SIU."}
                </div>
              </div>
              <Link
                href={{
                  pathname: `/claim/${queue[0].id}`,
                  query: {
                    persona,
                    queue: queue.map((c) => c.id).join(","),
                  },
                }}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
              >
                Start review →
              </Link>
            </div>
          )}

          {queue.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-800 bg-slate-950 px-6 py-12 text-center">
              <p className="text-sm text-slate-500">
                {mounted
                  ? "No claims match this filter."
                  : "Loading queue…"}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {queue.map((claim) => (
                <ClaimCard key={claim.id} claim={claim} persona={persona} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function ClaimCard({
  claim,
  persona,
}: {
  claim: Claim;
  persona: "agent" | "adjuster";
}) {
  const a = claim.assessment;
  const flags = a
    ? [
        a.potentialTotalLoss
          ? { tone: "violet" as const, label: "Potential total loss" }
          : null,
        a.fraudAdvisory.triggered
          ? { tone: "rose" as const, label: "Fraud advisory" }
          : null,
        a.findings.some((f) => f.supplementRisk === "high")
          ? { tone: "amber" as const, label: "Supplement risk" }
          : null,
      ].filter(Boolean)
    : [{ tone: "blue" as const, label: "AI assessing" }];

  return (
    <Link
      href={{
        pathname: `/claim/${claim.id}`,
        query: { persona },
      }}
      className="group block overflow-hidden rounded-lg border border-slate-800 bg-slate-950 transition-all hover:border-slate-600 hover:bg-slate-900/40 hover:shadow-lg hover:shadow-blue-500/5"
    >
      <div className="flex gap-4 p-4">
        {/* Photo */}
        <div className="h-20 w-28 flex-shrink-0 overflow-hidden rounded bg-slate-900 ring-1 ring-slate-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={claim.photos[0]}
            alt={`Claim ${claim.id}`}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Main info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-mono text-sm font-medium text-slate-100 group-hover:text-blue-400">
                  {claim.id}
                </div>
                <span
                  className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wider ring-1 ring-inset ${
                    statusColor[claim.status]
                  }`}
                >
                  {statusLabel[claim.status]}
                </span>
              </div>
              <div className="mt-0.5 text-xs text-slate-500">
                {claim.claimantName} · {claim.vehicle.year} {claim.vehicle.make}{" "}
                {claim.vehicle.model} · ACV {usd(claim.vehicle.acv)}
              </div>
              <div className="mt-1 text-xs text-slate-400 italic truncate">
                {claim.accident.description}
              </div>
            </div>
            <div className="text-right">
              {a ? (
                <>
                  <div className="text-base font-semibold text-slate-100">
                    {usd(a.totalEstimate)}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">
                    {pct(a.overallConfidence)} confidence
                  </div>
                </>
              ) : (
                <div className="text-[11px] text-blue-300">Processing…</div>
              )}
            </div>
          </div>

          {flags.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1">
              {flags.map((flag, i) =>
                flag ? (
                  <Flag key={i} tone={flag.tone}>
                    {flag.label}
                  </Flag>
                ) : null
              )}
            </div>
          )}

          <div className="mt-2.5 border-t border-slate-800/60 pt-2.5">
            <FlowSteps status={claim.status} />
          </div>
        </div>
      </div>
    </Link>
  );
}

function Flag({
  tone,
  children,
}: {
  tone: "violet" | "rose" | "amber" | "blue";
  children: React.ReactNode;
}) {
  const map: Record<string, string> = {
    violet: "bg-violet-500/15 text-violet-300 ring-violet-500/30",
    rose: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
    amber: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
    blue: "bg-blue-500/15 text-blue-300 ring-blue-500/30",
  };
  return (
    <span
      className={`inline-flex rounded px-1.5 py-0.5 text-[10px] ring-1 ring-inset ${map[tone]}`}
    >
      {children}
    </span>
  );
}
