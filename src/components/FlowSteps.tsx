import type { ClaimStatus } from "@/data/types";

type StepState = "done" | "current" | "future" | "skipped";

const STEP_LABELS = ["Intake", "AI Review", "Agent", "Adjuster", "Decision"];

export function FlowSteps({ status }: { status: ClaimStatus }) {
  const steps = computeSteps(status);
  return (
    <div className="flex items-start gap-1.5">
      {steps.map((step, i) => (
        <Step key={i} state={step.state} label={step.label} />
      ))}
    </div>
  );
}

function Step({ state, label }: { state: StepState; label: string }) {
  const bar: Record<StepState, string> = {
    done: "bg-blue-500/70",
    current: "bg-blue-400 ring-2 ring-blue-400/40",
    future: "bg-slate-800",
    skipped: "border border-dashed border-slate-600 bg-transparent",
  };
  const text: Record<StepState, string> = {
    done: "text-slate-400",
    current: "text-blue-300 font-medium",
    future: "text-slate-600",
    skipped: "text-slate-500",
  };
  const note: Partial<Record<StepState, string>> = {
    current: "now",
    skipped: "skipped",
  };

  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <div className={`h-1.5 w-full rounded-sm ${bar[state]}`} />
      <div className={`text-[9px] uppercase tracking-wider ${text[state]}`}>
        {label}
      </div>
      <div className="h-3">
        {note[state] && (
          <span
            className={`text-[8px] uppercase tracking-wider ${
              state === "skipped" ? "text-amber-400/70" : "text-blue-400"
            }`}
          >
            {note[state]}
          </span>
        )}
      </div>
    </div>
  );
}

function computeSteps(
  status: ClaimStatus
): { state: StepState; label: string }[] {
  const states: StepState[] = ["future", "future", "future", "future", "future"];

  switch (status) {
    case "NEW":
      states[0] = "done";
      states[1] = "current";
      break;
    case "AGENT_REVIEW":
      states[0] = "done";
      states[1] = "done";
      states[2] = "current";
      break;
    case "ADJUSTER_REVIEW_AUTO_ROUTED":
      // High-confidence claim: AI review done, agent step bypassed.
      states[0] = "done";
      states[1] = "done";
      states[2] = "skipped";
      states[3] = "current";
      break;
    case "ADJUSTER_REVIEW_POST_AGENT":
      states[0] = "done";
      states[1] = "done";
      states[2] = "done";
      states[3] = "current";
      break;
    case "APPROVED":
    case "RETURNED":
    case "ESCALATED":
      states[0] = "done";
      states[1] = "done";
      states[2] = "done";
      states[3] = "done";
      states[4] = "current";
      break;
  }

  return states.map((state, i) => ({ state, label: STEP_LABELS[i] }));
}
