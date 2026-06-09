import { Suspense } from "react";
import { IntakeForm } from "@/components/IntakeForm";

export default function IntakePage() {
  return (
    <Suspense
      fallback={
        <div className="p-10 text-sm text-slate-500">Loading intake…</div>
      }
    >
      <IntakeForm />
    </Suspense>
  );
}
