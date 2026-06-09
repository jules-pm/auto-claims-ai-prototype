"use client";

import type { Claim } from "@/data/types";

const STORAGE_KEY = "auto-claims-ai-prototype:user-claims";

export function getUserClaims(): Claim[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Claim[];
  } catch {
    return [];
  }
}

export function saveUserClaim(claim: Claim): void {
  if (typeof window === "undefined") return;
  const claims = getUserClaims();
  const idx = claims.findIndex((c) => c.id === claim.id);
  if (idx >= 0) claims[idx] = claim;
  else claims.unshift(claim);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(claims));
}

export function clearUserClaims(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
