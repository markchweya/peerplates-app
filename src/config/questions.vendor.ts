export const vendorQuestions = [
  {
    key: "business_name",
    label: "Business / Brand name",
    required: true,
    type: "text" as const,
    placeholder: "e.g. Mama Njeri Kitchen",
  },
  {
    key: "food_type",
    label: "What type of food do you sell?",
    required: true,
    type: "text" as const,
    placeholder: "e.g. Swahili, Nigerian, Kenyan, etc.",
  },
  {
    key: "daily_capacity",
    label: "How many orders can you fulfill per day?",
    required: true,
    type: "select" as const,
    options: ["1–10", "11–30", "31–60", "60+"],
  },
];
