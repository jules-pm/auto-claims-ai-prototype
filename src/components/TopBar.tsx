"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PersonaToggle, getPersonaFromSearch } from "@/components/PersonaToggle";
import { clearUserClaims } from "@/lib/storage";

export function TopBar() {
  const searchParams = useSearchParams();
  const persona = getPersonaFromSearch(searchParams);

  function handleReset() {
    clearUserClaims();
    window.location.href = `/?persona=${persona}`;
  }

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-800 bg-slate-950/95 px-6 py-3 backdrop-blur">
      <Link
        href={{ pathname: "/", query: { persona } }}
        className="flex items-center gap-2"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-500/20 text-sm font-bold text-blue-300">
          AC
        </div>
        <div>
          <div className="text-sm font-semibold leading-tight text-slate-100">
            Auto Claims AI
          </div>
          <div className="text-[10px] uppercase tracking-wider leading-tight text-slate-500">
            Carrier orchestration
          </div>
        </div>
      </Link>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleReset}
          className="text-[11px] text-slate-500 transition-colors hover:text-slate-300"
          title="Clears localStorage so NEW claims trigger a fresh AI run on click."
        >
          Reset demo
        </button>
        <PersonaToggle />
      </div>
    </header>
  );
}
