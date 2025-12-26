// src/lib/vendorPriority.ts
// Vendor priority scoring (0–10) based on actionable, non-guesswork signals.
// Goals supported:
// - "Highest quality vendors" (readiness + proof + reliability)
// - "Closest vendors" (proximity)
//
// This file is tolerant to evolving form keys (supports multiple aliases).

export type VendorAnswers = Record<string, unknown>;

export type VendorPriorityBreakdown = {
  complianceScore: number; // 0..4
  proofScore: number; // 0..2
  reliabilityScore: number; // 0..2
  proximityScore: number; // 0..2
  socialScore: number; // 0..1
  notes?: string[];
};

export type VendorPriorityResult = {
  total: number; // 0..10
  breakdown: VendorPriorityBreakdown;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => asString(x)).filter(Boolean);
}

function firstNonEmptyString(answers: VendorAnswers, keys: string[]): string {
  for (const k of keys) {
    const s = asString(answers[k]);
    if (s) return s;
  }
  return "";
}

function firstNumber(answers: VendorAnswers, keys: string[]): number | null {
  for (const k of keys) {
    const n = asNumber(answers[k]);
    if (n !== null) return n;
  }
  return null;
}

function firstStringArray(answers: VendorAnswers, keys: string[]): string[] {
  for (const k of keys) {
    const arr = asStringArray(answers[k]);
    if (arr.length) return arr;
  }
  return [];
}

function normalizeLower(s: string) {
  return s.trim().toLowerCase();
}

function hasInstagramHandle(raw: string): boolean {
  const s = normalizeLower(raw);
  if (!s) return false;

  const noIgHints = ["dont have", "don’t have", "do not have", "no instagram", "none", "n/a", "na"];
  if (noIgHints.some((h) => s.includes(h))) return false;

  return s.startsWith("@") || s.includes("instagram.com") || s.length >= 2;
}

function parseMinutesFromText(raw: string): number | null {
  const s = normalizeLower(raw);
  if (!s) return null;

  const m1 = s.match(/(\d{1,3})\s*(minutes|minute|mins|min)\b/);
  if (m1?.[1]) return clamp(Number(m1[1]), 0, 999);

  const m2 = s.match(/\b(\d{1,3})\b/);
  if (m2?.[1]) return clamp(Number(m2[1]), 0, 999);

  return null;
}

function hasProof(answers: VendorAnswers): boolean {
  // Handles:
  // - certificate_upload (string/file name)
  // - certificate_url (string)
  // - any field that looks like an uploaded doc URL/path
  const direct = firstNonEmptyString(answers, [
    "certificate_url",
    "certificate_upload",
    "certificateUpload",
    "certificate",
    "food_hygiene_certificate",
    "hygiene_certificate",
    "docs_url",
    "documents_url",
  ]);
  if (direct) return true;

  // Sometimes forms store it inside answers as an object/array; we avoid deep guessing.
  // If you later standardize this, add explicit keys above.
  return false;
}

function reliabilitySignal(answers: VendorAnswers): number {
  // 0..2
  // We score reliability from *capacity/availability* style answers if present.
  // If missing, score stays 0 (not guessing).

  const notes: string[] = [];

  const days = firstStringArray(answers, ["availability_days", "days_available", "available_days"]);
  if (days.length >= 4) return 2;
  if (days.length >= 2) return 1;

  // Try capacity numbers
  const capacity = firstNumber(answers, [
    "weekly_capacity",
    "meals_per_week",
    "orders_per_week",
    "orders_per_day",
    "meals_per_day",
    "daily_capacity",
  ]);

  if (capacity !== null) {
    if (capacity >= 20) return 2;
    if (capacity >= 5) return 1;
  }

  // Try “can you deliver consistently” style booleans/strings
  const consistent = normalizeLower(
    firstNonEmptyString(answers, ["can_deliver_consistently", "consistent_supply", "reliability"])
  );
  if (consistent) {
    if (["yes", "true", "1"].includes(consistent)) return 1;
    if (consistent.includes("yes")) return 1;
  }

  return 0;
}

export function vendorPriorityScore(answers: VendorAnswers): VendorPriorityResult {
  const notes: string[] = [];

  // 1) Compliance readiness (0..4)
  const compliance = [
    ...firstStringArray(answers, ["compliance_readiness", "compliance", "compliance_docs", "complianceChecklist"]),
  ].map((x) => x.trim()).filter(Boolean);

  const hasNone = compliance.some((x) => {
    const s = normalizeLower(x);
    return s === "none" || s === "none of the above";
  });

  const complianceCount = hasNone ? 0 : compliance.length;

  // Make this meaningful but not overly dominant:
  // 1 item = 2, 2 items = 3, 3+ items = 4 (cap)
  let complianceScore = 0;
  if (complianceCount === 1) complianceScore = 2;
  else if (complianceCount === 2) complianceScore = 3;
  else if (complianceCount >= 3) complianceScore = 4;

  if (hasNone) notes.push("Compliance: 'None' selected → 0");
  else notes.push(`Compliance items: ${complianceCount} → ${complianceScore}`);

  // 2) Proof / documents (0..2)
  const proofScore = hasProof(answers) ? 2 : 0;
  notes.push(proofScore ? "Proof: certificate/docs present (+2)" : "Proof: missing (0)");

  // 3) Reliability / availability / capacity (0..2)
  const reliabilityScore = reliabilitySignal(answers);
  notes.push(`Reliability: ${reliabilityScore}/2`);

  // 4) Proximity (0..2)
  let mins =
    firstNumber(answers, ["bus_minutes", "bus_time_minutes", "minutes_to_campus", "campus_bus_minutes", "proximity_minutes"]) ??
    null;

  if (mins === null) {
    const campusBusText = firstNonEmptyString(answers, ["campus_bus", "campusBus", "bus_time", "distance_to_campus"]);
    const parsed = parseMinutesFromText(campusBusText);
    if (parsed !== null) {
      mins = parsed;
      notes.push(`Proximity: parsed minutes (${mins})`);
    }
  }

  let proximityScore = 0;
  if (mins !== null) {
    if (mins <= 15) proximityScore = 2;
    else if (mins <= 30) proximityScore = 1;
  }
  notes.push(`Proximity: ${mins === null ? "missing" : `${mins} min`} → ${proximityScore}/2`);

  // 5) Social proof (0..1) – intentionally small weight
  const igRaw = firstNonEmptyString(answers, [
    "instagram_handle",
    "instagram",
    "ig",
    "ig_handle",
    "instagramHandle",
    "social_instagram",
  ]);
  const socialScore = hasInstagramHandle(igRaw) ? 1 : 0;
  notes.push(socialScore ? "Social: IG present (+1)" : "Social: no IG (0)");

  const total = clamp(complianceScore + proofScore + reliabilityScore + proximityScore + socialScore, 0, 10);

  return {
    total,
    breakdown: {
      complianceScore,
      proofScore,
      reliabilityScore,
      proximityScore,
      socialScore,
      notes,
    },
  };
}
