import { Suspense } from "react";
import { seedClaims } from "@/data/claims";
import { QueuePage } from "@/components/QueuePage";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="p-10 text-sm text-slate-500">Loading queue…</div>
      }
    >
      <QueuePage seedClaims={seedClaims} />
    </Suspense>
  );
}
