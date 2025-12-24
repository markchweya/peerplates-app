// src/config/questions.consumer.ts

export const consumerQuestions = [
  {
    key: "is_student",
    label: "Are you a student?",
    required: true,
    type: "select" as const,
    options: ["Yes", "No"],
  },

  /**
   * NOTE:
   * - Spec: university is required
   * - Logic: only meaningful when is_student === "Yes"
   *
   * We set required: false here and enforce conditional-required in JoinForm.tsx:
   * - if is_student === "Yes" => university required and visible
   * - if is_student === "No"  => university hidden and not required
   */
  {
    key: "university",
    label: "Which university?",
    required: false,
    type: "select" as const,
    options: [
      "University of Nottingham (UoN)",
      "Nottingham Trent University (NTU)",
      "Other",
    ],
  },

  // Top 3 cuisines (multi-select, max 3)
  {
    key: "top_cuisines",
    label: "Top 3 cuisines you’d order on PeerPlates (pick up to 3)",
    required: true,
    type: "checkboxes" as const,
    options: [
      "African",
      "Caribbean",
      "Chinese",
      "Indian",
      "Japanese",
      "Korean",
      "Thai",
      "Turkish",
      "Middle Eastern",
      "Mediterranean",
      "Italian",
      "Pastries",
      "Cakes",
      "Desserts",
    ],
  },

  // Dietary preferences (multi-select)
  {
    key: "dietary_preferences",
    label: "Dietary preferences (select all that apply)",
    required: true,
    type: "checkboxes" as const,
    options: [
      "None",
      "Halal",
      "Vegetarian",
      "Vegan",
      "Gluten-free",
      "Dairy-free",
      "High-protein / Gym meals",
      "Other",
    ],
  },

  // Gain from PeerPlates (single select — choose 1)
  {
    key: "gain_from_peerplates",
    label: "What would you like to gain from PeerPlates?",
    required: true,
    type: "select" as const,
    options: [
      "Meal prep",
      "Baked goods",
      "Homemade lunch/dinner",
      "Healthy/fitness meals",
      "Cultural/authentic meals",
      "Budget meals",
      "Snacks/desserts",
    ],
  },

  // Budget per meal (pickup)
  {
    key: "budget_per_meal",
    label: "Typical budget per meal (pickup)",
    required: true,
    type: "select" as const,
    options: ["£3–£5", "£5–£7", "£7–£10", "£10 - £15", "£15+"],
  },

  // Travel by bus
  {
    key: "bus_travel_time",
    label: "Furthest you’d realistically travel by bus to pick up food",
    required: true,
    type: "select" as const,
    options: [
      "5–10 minutes",
      "10–20 minutes",
      "20–30 minutes",
      "30–40 minutes",
      "40+ minutes",
    ],
  },

  // Attribution
  {
    key: "heard_about_peerplates",
    label: "How did you hear about PeerPlates?",
    required: true,
    type: "select" as const,
    options: ["TikTok", "Instagram", "Friend", "Poster / QR code", "Vendor", "Other"],
  },
];
