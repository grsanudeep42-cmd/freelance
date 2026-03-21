export const SERVICE_CATEGORIES = [
  {
    value: "web-development",
    label: "Web Development",
    subcategories: ["Frontend", "Backend", "Full-stack", "WordPress", "Mobile-responsive"],
  },
  {
    value: "graphic-design",
    label: "Graphic Design",
    subcategories: ["Logo Design", "Social Media Graphics", "Branding Kits", "Brochures & Posters"],
  },
  {
    value: "content-writing",
    label: "Content Writing",
    subcategories: ["Blog & Articles", "Website Copy", "Product Descriptions", "SEO Content"],
  },
  {
    value: "digital-marketing",
    label: "Digital Marketing",
    subcategories: ["SEO", "Social Media Management", "Google Ads", "Email Campaigns"],
  },
  {
    value: "video-editing",
    label: "Video Editing",
    subcategories: ["YouTube Videos", "Reels & Shorts", "Ads & Promos", "Event Footage"],
  },
  {
    value: "ui-ux-design",
    label: "UI/UX Design",
    subcategories: ["Wireframing", "Figma Prototypes", "User Research"],
  },
  {
    value: "mobile-app-dev",
    label: "Mobile App Development",
    subcategories: ["Android", "React Native", "UI/UX Prototypes"],
  },
  {
    value: "copywriting",
    label: "Copywriting",
    subcategories: ["Ad Copy", "Landing Pages", "Email Sequences", "Sales Funnels"],
  },
  {
    value: "data-entry",
    label: "Data Entry & Analysis",
    subcategories: ["Excel Processing", "Data Cleaning", "Basic Dashboards"],
  },
  {
    value: "virtual-assistance",
    label: "Virtual Assistance",
    subcategories: ["Email Management", "Scheduling", "Research"],
  },
  {
    value: "social-media",
    label: "Social Media Marketing",
    subcategories: ["Instagram Growth", "Content Calendars", "Analytics"],
  },
  {
    value: "software-dev",
    label: "Software Development",
    subcategories: ["Custom Scripts", "Automation", "API Integration"],
  },
  {
    value: "ai-ml",
    label: "AI & Machine Learning",
    subcategories: ["Chatbots", "Predictive Models", "AI Content Tools"],
  },
  {
    value: "photography",
    label: "Photography",
    subcategories: ["Product Shoots", "Events", "Photo Editing"],
  },
  {
    value: "tutoring",
    label: "Tutoring & Education",
    subcategories: ["Online Teaching", "Course Notes", "Language Coaching"],
  },
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number]["value"];

/** Lookup helper — returns label for a given value. */
export function getCategoryLabel(value: string): string {
  return SERVICE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

/** Returns subcategories for a given category value. */
export function getSubcategories(value: string): readonly string[] {
  return SERVICE_CATEGORIES.find((c) => c.value === value)?.subcategories ?? [];
}
