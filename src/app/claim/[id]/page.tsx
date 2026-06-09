import { Suspense } from "react";
import { ClaimDetail } from "@/components/ClaimDetail";

export default async function ClaimPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="p-10 text-sm text-slate-500">Loading claim…</div>
      }
    >
      <ClaimDetail claimId={id} />
    </Suspense>
  );
}
