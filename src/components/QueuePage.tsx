"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Claim } from "@/data/types";
import { getUserClaims } from "@/lib/storage";
import { statusLabel, statusColor, usd, pct, shortDateTime } from "@/lib/format";
import { PersonaToggle, getPersonaFromSearch } from "@/components/PersonaToggle";
import { UploadClaimDialog } from "@/components/UploadClaimDialog";

export function QueuePage({ seedClaims }: { seedClaims: Claim[] }) {
  const searchParams = useSearchParams();
  const persona = getPersonaFromSearch(searchParams);
  const [userClaims, setUserClaims] = useState<Claim[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setUserClaims(getUserClaims());
    setMounted(true);
  }, []);

  const allClaims = [...userClaims, ...seedClaims];

  const isPersonaActionable = (claim: Claim): boolean => {
    if (claim.status === "AGENT_REVIEW") return persona === "agent";
    if (
      claim.status === "ADJUSTER_REVIEW_AUTO_ROUTED" ||
      claim.status === "ADJUSTER_REVIEW_POST_AGENT"
    )
      return persona === "adjuster";
    return false;
  };

  const yourQueue = allClaims.filter(isPersonaActionable);
  const otherClaims = allClaims.filter((c) => !isPersonaActionable(c));

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8 flex items-start justify-between gap-6">
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-500">
            Auto Claims AI — Prototype
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-slate-100">
            Claims queue
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            AI runs damage assessment automatically on every claim arrival.
            Routing splits high-confidence claims directly to the senior
            adjuster, and routes flagged claims (medium confidence, supplement
            risk, potential total loss, fraud advisory) through the claims
            agent first.
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <PersonaToggle />
          <UploadClaimDialog
            onCreated={(claim) =>
              setUserClaims((prev) => [claim, ...prev.filter((c) => c.id !== claim.id)])
            }
          />
        </div>
      </header>

      <Section
        title={
          persona === "agent"
            ? "Your queue — agent review"
            : "Your queue — adjuster review"
        }
        subtitle={
          persona === "agent"
            ? "AI flagged these for first-human review before they go to the adjuster."
            : "High-confidence claims auto-routed past the agent, plus agent-signed-off claims awaiting final approval."
        }
        claims={yourQueue}
        persona={persona}
        empty={
          <p className="text-sm text-slate-500">
            No claims in your queue at this moment.
          </p>
        }
      />

      <Section
        title="Other claims in the system"
        subtitle="Visible for context. Actions available when you switch personas."
        claims={otherClaims}
        persona={persona}
        muted
      />

      {!mounted && (
        <p className="mt-8 text-xs text-slate-600">Loading user-uploaded claims…</p>
      )}
    </div>
  );
}

function Section({
  title,
  subtitle,
  claims,
  persona,
  muted,
  empty,
}: {
  title: string;
  subtitle: string;
  claims: Claim[];
  persona: "agent" | "adjuster";
  muted?: boolean;
  empty?: React.ReactNode;
}) {
  return (
    <section className={`mb-10 ${muted ? "opacity-70" : ""}`}>
      <div className="mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
          {title}
        </h2>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      </div>
      {claims.length === 0 ? (
        empty ?? null
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-800">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="bg-slate-900/60 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Claim</th>
                <th className="px-4 py-2 font-medium">Vehicle</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">AI confidence</th>
                <th className="px-4 py-2 font-medium">Est. total</th>
                <th className="px-4 py-2 font-medium">Flags</th>
                <th className="px-4 py-2 font-medium">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950">
              {claims.map((claim) => (
                <tr
                  key={claim.id}
                  className="hover:bg-slate-900/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={{
                        pathname: `/claim/${claim.id}`,
                        query: { persona },
                      }}
                      className="text-slate-100 hover:text-blue-400"
                    >
                      <div className="font-medium">{claim.id}</div>
                      <div className="text-xs text-slate-500">
                        {claim.claimantName}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    <div>
                      {claim.vehicle.year} {claim.vehicle.make}{" "}
                      {claim.vehicle.model}
                    </div>
                    <div className="text-xs text-slate-500">
                      ACV {usd(claim.vehicle.acv)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-xs ring-1 ring-inset ${
                        statusColor[claim.status]
                      }`}
                    >
                      {statusLabel[claim.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {claim.assessment
                      ? pct(claim.assessment.overallConfidence)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {claim.assessment
                      ? usd(claim.assessment.totalEstimate)
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {claim.assessment?.potentialTotalLoss && (
                        <Flag tone="violet">Total loss?</Flag>
                      )}
                      {claim.assessment?.fraudAdvisory.triggered && (
                        <Flag tone="rose">Fraud advisory</Flag>
                      )}
                      {claim.assessment?.findings.some(
                        (f) => f.supplementRisk === "high"
                      ) && <Flag tone="amber">Supplement risk</Flag>}
                      {!claim.assessment && <Flag tone="blue">Processing</Flag>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {shortDateTime(claim.receivedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
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
