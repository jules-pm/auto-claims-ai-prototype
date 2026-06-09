"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Claim } from "@/data/types";
import { samplePhotos, type SamplePhoto } from "@/data/samples";
import { saveUserClaim } from "@/lib/storage";
import { TopBar } from "@/components/TopBar";

function makeClaimId(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate()
  ).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CLM-${ymd}-${rand}`;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function IntakeForm() {
  const router = useRouter();

  const [policyNumber, setPolicyNumber] = useState("POL-7741203");
  const [claimantName, setClaimantName] = useState("Alex Rivera");
  const [year, setYear] = useState("2014");
  const [make, setMake] = useState("Ford");
  const [model, setModel] = useState("Focus");
  const [trim, setTrim] = useState("SE");
  const [acv, setAcv] = useState("8500");
  const [accidentDate, setAccidentDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [location, setLocation] = useState("Newark, NJ (Market St)");
  const [description, setDescription] = useState(
    "Side-impact collision at intersection. Driver-side doors and front fender struck; driver-side window shattered. Vehicle drivable."
  );
  const [photoSrc, setPhotoSrc] = useState<string>("/damage/door-side.jpg");
  const [photoLabel, setPhotoLabel] = useState<string>("Side impact — door & fender");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function applySample(s: SamplePhoto) {
    setPolicyNumber(`POL-${Math.floor(1000000 + Math.random() * 8999999)}`);
    setClaimantName(claimantName);
    setYear(String(s.vehicle.year));
    setMake(s.vehicle.make);
    setModel(s.vehicle.model);
    setTrim(s.vehicle.trim);
    setAcv(String(s.vehicle.acv));
    setLocation(s.accident.location);
    setDescription(s.accident.description);
    setPhotoSrc(s.src);
    setPhotoLabel(s.label);
  }

  async function handleUpload(file: File) {
    try {
      const dataUrl = await fileToDataUrl(file);
      setPhotoSrc(dataUrl);
      setPhotoLabel(file.name);
    } catch {
      setError("Could not read that image. Use a JPG, PNG, or WEBP.");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!photoSrc) {
      setError("Attach at least one damage photo.");
      return;
    }
    setSubmitting(true);
    const id = makeClaimId();
    const now = new Date().toISOString();
    const claim: Claim = {
      id,
      policyNumber,
      claimantName,
      vehicle: {
        year: Number(year) || 0,
        make,
        model,
        trim,
        acv: Number(acv) || 0,
      },
      accident: { date: accidentDate, location, description },
      photos: [photoSrc],
      status: "NEW",
      receivedAt: now,
      assessment: null,
      decisionHistory: [
        {
          by: "agent",
          action: "Claim intake completed — policy, accident details, and photos captured",
          at: now,
        },
        {
          by: "system",
          action: "Claim submitted to assessment pipeline",
          at: now,
        },
      ],
    };
    saveUserClaim(claim);
    // Hand off to the claim detail, which auto-runs the AI assessment on arrival.
    router.push(`/claim/${id}?persona=agent`);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <Link
          href={{ pathname: "/", query: { persona: "agent" } }}
          className="text-xs text-slate-500 hover:text-slate-300"
        >
          ← Back to queue
        </Link>

        <header className="mt-4 mb-5">
          <h1 className="text-2xl font-semibold text-slate-100">
            Report a claim
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Claims agent captures policy and accident details and attaches the
            policyholder&apos;s damage photos.
          </p>
          <div className="mt-3 rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-400">
            <span className="font-medium text-slate-300">
              Existing manual step — before AI automation.
            </span>{" "}
            Intake (FNOL) is out of our automation scope. The AI assessment runs
            automatically once this claim is submitted.
          </div>
        </header>

        {/* Demo convenience: quick-fill from a sample */}
        <div className="mb-5 rounded-lg border border-slate-800 bg-slate-950 p-3">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Quick-fill from a sample claim (or enter manually below)
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {samplePhotos.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => applySample(s)}
                className={`overflow-hidden rounded border text-left transition-colors ${
                  photoSrc === s.src
                    ? "border-blue-500"
                    : "border-slate-800 hover:border-slate-600"
                }`}
              >
                <div className="h-16 w-full bg-slate-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.src}
                    alt={s.label}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="px-1.5 py-1 text-[10px] leading-tight text-slate-400">
                  {s.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Policyholder & vehicle */}
          <section className="rounded-lg border border-slate-800 bg-slate-950 p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Policyholder &amp; vehicle
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Policy number">
                <Input value={policyNumber} onChange={setPolicyNumber} />
              </Field>
              <Field label="Claimant name">
                <Input value={claimantName} onChange={setClaimantName} />
              </Field>
            </div>
            <p className="mt-2 mb-2 text-[10px] uppercase tracking-wider text-slate-600">
              Vehicle — auto-filled from policy record (editable)
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <Field label="Year">
                <Input value={year} onChange={setYear} type="number" />
              </Field>
              <Field label="Make">
                <Input value={make} onChange={setMake} />
              </Field>
              <Field label="Model">
                <Input value={model} onChange={setModel} />
              </Field>
              <Field label="Trim">
                <Input value={trim} onChange={setTrim} />
              </Field>
              <Field label="ACV ($)">
                <Input value={acv} onChange={setAcv} type="number" />
              </Field>
            </div>
          </section>

          {/* Accident details */}
          <section className="rounded-lg border border-slate-800 bg-slate-950 p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Accident details
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Accident date">
                <Input value={accidentDate} onChange={setAccidentDate} type="date" />
              </Field>
              <Field label="Location">
                <Input value={location} onChange={setLocation} />
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Description (gathered from policyholder)">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="block w-full rounded border border-slate-800 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
                />
              </Field>
            </div>
          </section>

          {/* Damage photos */}
          <section className="rounded-lg border border-slate-800 bg-slate-950 p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Damage photos
            </h2>
            <div className="flex gap-4">
              <div className="h-28 w-40 flex-shrink-0 overflow-hidden rounded border border-slate-800 bg-slate-900">
                {photoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoSrc}
                    alt={photoLabel}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-600">
                    No photo
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="inline-block cursor-pointer rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700">
                  Upload a photo
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file);
                    }}
                  />
                </label>
                <p className="mt-2 text-xs text-slate-500">
                  {photoLabel
                    ? `Attached: ${photoLabel}`
                    : "Upload the policyholder's damage photo, or pick a sample above."}
                </p>
              </div>
            </div>
          </section>

          {error && (
            <div className="rounded border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <Link
              href={{ pathname: "/", query: { persona: "agent" } }}
              className="text-sm text-slate-400 hover:text-slate-200"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit claim → run AI assessment"}
            </button>
          </div>
        </form>
      </main>
    </div>
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
      <span className="text-[10px] uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <div className="mt-0.5">{children}</div>
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
