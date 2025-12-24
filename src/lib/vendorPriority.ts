// src/lib/vendorpriority.ts
// PeerPlates vendor priority scoring (0–10) based on vendor waitlist answers.

export type VendorAnswers = Record<string, unknown>;

export type VendorPriorityBreakdown = {
  complianceScore: number;        // 0..6
  hasInstagramScore: number;      // 0..2
  proximityScore: number;         // 0..2
};

export type VendorPriorityResult = {
  total: number;                 // 0..10
  breakdown: VendorPriorityBreakdown;
};

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function asNumber(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : null;
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => asString(x)).filter(Boolean) : [];
}

function hasInstagramHandle(raw: string): boolean {
  const s = raw.trim().toLowerCase();
  if (!s) return false;

  // If user typed something like "i don't have one", treat as no IG.
  const noIgHints = ["dont have", "don’t have", "do not have", "no instagram", "none"];
  if (noIgHints.some((h) => s.includes(h))) return false;

  // Accept @handle OR a link OR any non-empty name
  return s.startsWith("@") || s.includes("instagram.com") || s.length >= 2;
}

export function vendorPriorityScore(answers: VendorAnswers): VendorPriorityResult {
  // ✅ Compliance readiness (tickboxes)
  const compliance = asStringArray(answers["compliance_readiness"]);

  // If "None of the above" is selected, treat as 0 readiness.
  const hasNone = compliance.some((x) => x.toLowerCase() === "none of the above");
  const complianceCount = hasNone ? 0 : compliance.length;

  // 0..6 (each valid item = +2, capped at 6)
  const complianceScore = Math.min(6, complianceCount * 2);

  // ✅ Instagram presence (0..2)
  const igRaw = asString(answers["instagram_handle"]);
  const hasIG = hasInstagramHandle(igRaw);
  const hasInstagramScore = hasIG ? 2 : 0;

  // ✅ Proximity by bus minutes (0..2)
  const mins = asNumber(answers["bus_minutes"]);
  let proximityScore = 0;
  if (mins !== null) {
    if (mins <= 15) proximityScore = 2;
    else if (mins <= 30) proximityScore = 1;
  }

  const total = Math.max(0, Math.min(10, complianceScore + hasInstagramScore + proximityScore));

  return {
    total,
    breakdown: {
      complianceScore,
      hasInstagramScore,
      proximityScore,
    },
  };
}
