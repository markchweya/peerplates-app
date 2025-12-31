// src/config/questions.vendor.ts
import type { Question } from "@/components/JoinForm";

export const vendorQuestions = [
  {
    key: "is_student",
    label: "Are you a student?",
    required: true,
    type: "select",
    options: ["Yes", "No"],
  },
  {
    key: "university",
    label: "Which university?",
    required: true,
    type: "select",
    options: ["University of Nottingham (UoN)", "Nottingham Trent University (NTU)", "Other"],
  },
  {
    key: "currently_sell",
    label: "Do you currently sell food already?",
    required: true,
    type: "select",
    options: ["Yes", "No"],
  },
  {
    key: "sell_categories",
    label: "What do you sell / would you like to sell?",
    required: true,
    type: "checkboxes",
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
      "Other",
      "None of the above",
    ],
  },

  // ✅ now handled as “Closest campus” + dropdown minutes in JoinForm (same key)
  {
    key: "campus_bus",
    label: "Closest campus",
    required: true,
    type: "text",
    placeholder: "e.g. Jubilee Campus",
  },

  {
    key: "compliance_readiness",
    label: "Compliance readiness (tick all that apply)",
    required: true,
    type: "checkboxes",
    options: [
      "Registered with Nottingham City Council",
      "Level 2 Hygiene Certificate",
      "Food Safety Plan",
      "Already inspected",
      "None of the above",
    ],
  },
  {
    key: "portions_per_week",
    label: "How many meal portions do you currently sell per week?",
    required: true,
    type: "select",
    options: ["0", "1–5", "6–10", "11–20", "21–40", "40+"],
  },
  {
    key: "price_range",
    label: "Typical price range per item",
    required: true,
    type: "select",
    options: ["£3–£5", "£5–£7", "£7–£10", "£10–£15", "£15+"],
  },

  // ❌ removed certificate_upload
] satisfies Question[];
