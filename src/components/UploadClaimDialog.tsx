"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AIAssessment, Claim, Persona } from "@/data/types";
import { saveUserClaim } from "@/lib/storage";

const DEFAULT_VEHICLE = {
  year: 2022,
  make: "Subaru",
  model: "Outback",
  trim: "Limited",
  acv: 24500,
};

const DEFAULT_ACCIDENT = {
  date: new Date().toISOString().slice(0, 10),
  location: "Brooklyn, NY",
  description:
    "Collision in intersection during left turn. Vehicle driven from scene. No injuries reported.",
};

export function UploadClaimDialog({
  onCreated,
}: {
  onCreated: (claim: Claim) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [claimantName, setClaimantName] = useState("Alex Rivera");
  const [policyNumber, setPolicyNumber] = useState("POL-7741203");
  const [vehicle, setVehicle] = useState(DEFAULT_VEHICLE);
  const [accident, setAccident] = useState(DEFAULT_ACCIDENT);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please attach a damage photo.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const { base64, mediaType } = await fileToBase64(file);
      const previewUrl = URL.createObjectURL(file);

      const claimId = `CLM-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      const res = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mediaType,
          vehicle,
          accident,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Vision call failed: ${res.statusText}`);
      }

      const { assessment } = (await res.json()) as { assessment: AIAssessment };

      const status =
        assessment.recommendedRoute === "AGENT_REVIEW"
          ? "AGENT_REVIEW"
          : "ADJUSTER_REVIEW_AUTO_ROUTED";

      const personaToRoute: Persona = status === "AGENT_REVIEW" ? "agent" : "adjuster";

      const newClaim: Claim = {
        id: claimId,
        policyNumber,
        claimantName,
        vehicle,
        accident,
        photos: [previewUrl],
        status,
        receivedAt: new Date().toISOString(),
        assessment,
        decisionHistory: [
          {
            by: "system",
            action: "Live AI assessment completed",
            at: new Date().toISOString(),
          },
          {
            by: "system",
            action: `Routed to ${status} (${assessment.recommendedRoute})`,
            at: new Date().toISOString(),
          },
        ],
      };

      saveUserClaim(newClaim);
      onCreated(newClaim);
      setOpen(false);
      router.push(`/claim/${claimId}?persona=${personaToRoute}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500"
      >
        Simulate new claim arrival
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-xl rounded-lg border border-slate-800 bg-slate-950 p-6 shadow-2xl"
          >
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-100">
                Simulate claim arrival
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                In production, the claim record + claimant photos arrive at FNOL.
                Here we&apos;re simulating with a manual upload so the live Claude
                Sonnet vision call has something to analyze. The claims agent
                role is fully automated — no human triggers this; system
                event-driven on arrival.
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <Field label="Damage photo">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-xs text-slate-300 file:mr-3 file:rounded file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-xs file:text-slate-200 hover:file:bg-slate-700"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Claimant name">
                  <Input value={claimantName} onChange={setClaimantName} />
                </Field>
                <Field label="Policy number">
                  <Input value={policyNumber} onChange={setPolicyNumber} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Vehicle year">
                  <Input
                    type="number"
                    value={String(vehicle.year)}
                    onChange={(v) =>
                      setVehicle({ ...vehicle, year: Number(v) })
                    }
                  />
                </Field>
                <Field label="Vehicle ACV ($)">
                  <Input
                    type="number"
                    value={String(vehicle.acv)}
                    onChange={(v) =>
                      setVehicle({ ...vehicle, acv: Number(v) })
                    }
                  />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Make">
                  <Input
                    value={vehicle.make}
                    onChange={(v) => setVehicle({ ...vehicle, make: v })}
                  />
                </Field>
                <Field label="Model">
                  <Input
                    value={vehicle.model}
                    onChange={(v) => setVehicle({ ...vehicle, model: v })}
                  />
                </Field>
                <Field label="Trim">
                  <Input
                    value={vehicle.trim}
                    onChange={(v) => setVehicle({ ...vehicle, trim: v })}
                  />
                </Field>
              </div>
              <Field label="Accident description">
                <textarea
                  value={accident.description}
                  onChange={(e) =>
                    setAccident({ ...accident, description: e.target.value })
                  }
                  rows={3}
                  className="block w-full rounded border border-slate-800 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
                />
              </Field>
            </div>

            {error && (
              <div className="mt-4 rounded border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                {error}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={submitting}
                className="rounded px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
              >
                {submitting
                  ? "Running AI assessment…"
                  : "Run AI assessment"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Input({
  value,
  onChange,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="block w-full rounded border border-slate-800 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
    />
  );
}

async function fileToBase64(
  file: File
): Promise<{ base64: string; mediaType: "image/jpeg" | "image/png" | "image/webp" }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [meta, data] = result.split(",", 2);
      const mediaTypeMatch = meta.match(/data:(image\/(?:jpeg|png|webp));/);
      if (!mediaTypeMatch) {
        reject(new Error("Unsupported image type. Use JPG, PNG, or WEBP."));
        return;
      }
      resolve({
        base64: data,
        mediaType: mediaTypeMatch[1] as "image/jpeg" | "image/png" | "image/webp",
      });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
