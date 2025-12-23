export type VendorAnswers = Record<string, string | null | undefined>;

export function vendorPriorityScore(answers: VendorAnswers) {
  const capacity = (answers["daily_capacity"] || "").trim();
  const delivery = (answers["delivery"] || "").trim();
  const compliance = (answers["compliance"] || "").trim();
  const link = (answers["link"] || "").trim();
  const foodType = (answers["food_type"] || "").trim();

  // Capacity (0–3)
  const capacityScore =
    capacity === "1–10"
      ? 1
      : capacity === "11–30"
        ? 2
        : capacity === "31–60"
          ? 3
          : capacity === "60+"
            ? 3
            : 0;

  // Delivery (0–2)
  const deliveryScore =
    delivery === "Yes" ? 2 : delivery.startsWith("Partner only") ? 1 : 0;

  // Compliance (0–3)
  const complianceScore =
    compliance === "Yes" ? 3 : compliance === "In progress" ? 2 : 0;

  // Professionalism (0–2)
  // Clear food type + link/photos = 2, partial = 1, unclear = 0
  const hasClearFood = foodType.length >= 12;
  const hasLink = link.startsWith("http");
  const professionalismScore = hasClearFood && hasLink ? 2 : hasClearFood || hasLink ? 1 : 0;

  const total = capacityScore + deliveryScore + complianceScore + professionalismScore;

  return {
    total, // 0–10
    breakdown: {
      capacityScore,
      deliveryScore,
      complianceScore,
      professionalismScore,
    },
  };
}
