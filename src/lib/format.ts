import type { ClaimStatus } from "@/data/types";

export const statusLabel: Record<ClaimStatus, string> = {
  NEW: "New — AI assessing",
  AGENT_REVIEW: "Agent review",
  ADJUSTER_REVIEW_AUTO_ROUTED: "Adjuster review (auto-routed)",
  ADJUSTER_REVIEW_POST_AGENT: "Adjuster review (post-agent)",
  APPROVED: "Approved",
  RETURNED: "Returned",
  ESCALATED: "Escalated",
};

export const statusColor: Record<ClaimStatus, string> = {
  NEW: "bg-blue-500/15 text-blue-300 ring-blue-500/30",
  AGENT_REVIEW: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  ADJUSTER_REVIEW_AUTO_ROUTED:
    "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  ADJUSTER_REVIEW_POST_AGENT:
    "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  APPROVED: "bg-slate-500/15 text-slate-300 ring-slate-500/30",
  RETURNED: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
  ESCALATED: "bg-violet-500/15 text-violet-300 ring-violet-500/30",
};

export function usd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function pct(n: number, digits = 0): string {
  return `${(n * 100).toFixed(digits)}%`;
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function shortDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
