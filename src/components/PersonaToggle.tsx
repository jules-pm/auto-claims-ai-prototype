"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { Persona } from "@/data/types";

export function getPersonaFromSearch(params: URLSearchParams): Persona {
  const value = params.get("persona");
  return value === "agent" ? "agent" : "adjuster";
}

export function PersonaToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const persona = getPersonaFromSearch(searchParams);

  function setPersona(next: Persona) {
    const params = new URLSearchParams(searchParams);
    params.set("persona", next);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="inline-flex rounded-md border border-slate-800 bg-slate-900 p-1 text-xs">
      <button
        type="button"
        onClick={() => setPersona("adjuster")}
        className={`px-3 py-1.5 rounded transition-colors ${
          persona === "adjuster"
            ? "bg-slate-700 text-white"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        Senior adjuster
      </button>
      <button
        type="button"
        onClick={() => setPersona("agent")}
        className={`px-3 py-1.5 rounded transition-colors ${
          persona === "agent"
            ? "bg-slate-700 text-white"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        Claims agent
      </button>
    </div>
  );
}
