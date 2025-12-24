// src/lib/vendorpriorityscore.ts
// API-safe wrapper: returns a single number (0–10).
import { vendorPriorityScore } from "./vendorPriority";

export function vendorPriorityScoreFromAnswers(answers: any): number {
  try {
    const result = vendorPriorityScore(answers || {});
    return result.total;
  } catch {
    // Never break signup if answers shape is unexpected
    return 0;
  }
}
