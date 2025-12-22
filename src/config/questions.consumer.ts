export const consumerQuestions = [
  {
    key: "location",
    label: "Where are you located?",
    required: true,
    type: "text" as const,
    placeholder: "e.g. Nairobi",
  },
  {
    key: "frequency",
    label: "How often do you buy prepared food?",
    required: true,
    type: "select" as const,
    options: ["Daily", "A few times a week", "Weekly", "Occasionally"],
  },
  {
    key: "budget",
    label: "Typical budget per meal?",
    required: false,
    type: "select" as const,
    options: ["< KES 200", "KES 200–500", "KES 500–1,000", "KES 1,000+"],
  },
];
