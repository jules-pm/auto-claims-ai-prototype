"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { Claim, Persona } from "@/data/types";

export type FilterId =
  | "all"
  | "needs-review"
  | "waiting"
  | "sent-to-adjuster"
  | "needs-approval"
  | "flagged"
  | "fast-track"
  | "closed";

type FilterDef = {
  id: FilterId;
  label: string;
  sublabel?: string;
  predicate: (c: Claim) => boolean;
};

const isFlagged = (c: Claim) =>
  c.assessment?.potentialTotalLoss === true ||
  c.assessment?.fraudAdvisory.triggered === true;

const awaitingAdjuster = (c: Claim) =>
  c.status === "ADJUSTER_REVIEW_AUTO_ROUTED" ||
  c.status === "ADJUSTER_REVIEW_POST_AGENT";

// CLAIMS AGENT — Action-first: what needs me, what I'm waiting on, what I handed off.
export const AGENT_FILTERS: FilterDef[] = [
  {
    id: "needs-review",
    label: "Needs review",
    predicate: (c) => c.status === "NEW" || c.status === "AGENT_REVIEW",
  },
  {
    id: "waiting",
    label: "Waiting on claimant",
    predicate: (c) => c.status === "RETURNED",
  },
  {
    id: "sent-to-adjuster",
    label: "Sent to adjuster",
    predicate: (c) => c.status === "ADJUSTER_REVIEW_POST_AGENT",
  },
  {
    id: "closed",
    label: "Closed",
    predicate: (c) => c.status === "ESCALATED" || c.status === "APPROVED",
  },
  {
    id: "all",
    label: "All claims",
    predicate: (c) =>
      c.status === "NEW" ||
      c.status === "AGENT_REVIEW" ||
      c.status === "RETURNED" ||
      c.status === "ADJUSTER_REVIEW_POST_AGENT" ||
      c.status === "ESCALATED" ||
      c.status === "APPROVED",
  },
];

// SENIOR ADJUSTER — Attention-first: routine queue, then the claims that need scrutiny.
export const ADJUSTER_FILTERS: FilterDef[] = [
  {
    id: "needs-approval",
    label: "Needs approval",
    predicate: (c) => awaitingAdjuster(c) && !isFlagged(c),
  },
  {
    id: "flagged",
    label: "Flagged for review",
    sublabel: "fraud + total loss",
    predicate: (c) => awaitingAdjuster(c) && isFlagged(c),
  },
  {
    id: "fast-track",
    label: "Fast-track",
    predicate: (c) =>
      c.status === "ADJUSTER_REVIEW_AUTO_ROUTED" && !isFlagged(c),
  },
  {
    id: "closed",
    label: "Closed",
    predicate: (c) => c.status === "APPROVED" || c.status === "ESCALATED",
  },
  {
    id: "all",
    label: "All claims",
    predicate: (c) =>
      awaitingAdjuster(c) ||
      c.status === "APPROVED" ||
      c.status === "ESCALATED",
  },
];

export function getActiveFilter(
  persona: Persona,
  filterId: string | null
): FilterDef {
  const filters = persona === "agent" ? AGENT_FILTERS : ADJUSTER_FILTERS;
  const found = filters.find((f) => f.id === filterId);
  return found ?? filters[0];
}

export function Sidebar({
  persona,
  allClaims,
}: {
  persona: Persona;
  allClaims: Claim[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = persona === "agent" ? AGENT_FILTERS : ADJUSTER_FILTERS;
  const defaultId = filters[0].id;
  const activeFilterId = (searchParams.get("filter") as FilterId) || defaultId;

  function setFilter(id: FilterId) {
    const params = new URLSearchParams(searchParams);
    if (id === defaultId) params.delete("filter");
    else params.set("filter", id);
    router.replace(`${pathname}?${params.toString()}`);
  }

  const approved = allClaims.filter((c) => c.status === "APPROVED").length;
  const returned = allClaims.filter((c) => c.status === "RETURNED").length;
  const escalated = allClaims.filter((c) => c.status === "ESCALATED").length;

  return (
    <aside className="hidden w-60 flex-shrink-0 border-r border-slate-800 bg-slate-950 px-3 py-6 md:block">
      <div className="mb-4 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {persona === "agent" ? "Claims agent" : "Senior adjuster"}
      </div>
      <nav className="space-y-0.5">
        {filters.map((f) => {
          const count = allClaims.filter(f.predicate).length;
          const active = activeFilterId === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`flex w-full items-center justify-between rounded px-2.5 py-1.5 text-left transition-colors ${
                active
                  ? "bg-blue-500/15 text-blue-200"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              <span className="flex flex-col">
                <span className="text-sm">{f.label}</span>
                {f.sublabel && (
                  <span className="text-[10px] text-slate-500">
                    {f.sublabel}
                  </span>
                )}
              </span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                  active
                    ? "bg-blue-500/30 text-blue-200"
                    : count > 0
                    ? "bg-slate-800 text-slate-400"
                    : "bg-slate-900 text-slate-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-8 border-t border-slate-800 pt-4">
        <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          This session
        </div>
        <div className="px-2 text-xs text-slate-500 leading-relaxed">
          {approved} approved<br />
          {returned} returned<br />
          {escalated} escalated
        </div>
      </div>
    </aside>
  );
}
