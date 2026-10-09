export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: [string, string, string]; // [primary/accent, secondary/surface, text/heading]
  labels: [string, string, string];
}

export const THEMES: Theme[] = [
  {
    id: "paper-washi",
    name: "Warm Washi & Crimson",
    description: "Natural Washi Paper (#F4EFE3), Deep Forest Green (#173524), and Muted Crimson (#B83245)",
    colors: ["#B83245", "#F4EFE3", "#173524"],
    labels: ["Muted Crimson", "Warm Washi", "Forest Green"],
  },
  {
    id: "theme-orange-black",
    name: "Theme 1: Orange / Sky Blue / Black",
    description: "Energetic & Modern. Warm Orange (#FF8A3D), Sky Blue (#7DD3FC), and Deep Black (#0F1115)",
    colors: ["#FF8A3D", "#0F1115", "#7DD3FC"],
    labels: ["Warm Orange", "Deep Black", "Sky Blue"],
  },
  {
    id: "theme-olive-burgundy",
    name: "Theme 2: Olive Green / Black / Burgundy",
    description: "Calm & Refined. Olive Green (#556B2F), Rich Burgundy (#722F37), and Warm Paper (#F8F6EE)",
    colors: ["#722F37", "#F8F6EE", "#556B2F"],
    labels: ["Burgundy", "Warm Paper", "Olive Green"],
  },
  {
    id: "paper-sage",
    name: "Sage Botanical Paper",
    description: "Pastel Cream (#EFECE6), Sage Green (#6B8E67), and Deep Pine (#122419)",
    colors: ["#2D5A40", "#EFECE6", "#122419"],
    labels: ["Sage Forest", "Pastel Cream", "Deep Pine"],
  },
  {
    id: "paper-charcoal",
    name: "Sumi Ink & Dark Paper",
    description: "Deep Sumi Ink (#1B211E), Crisp Sage (#7DA479), and Crimson Accent (#C94A5C)",
    colors: ["#C94A5C", "#242C28", "#E8EDE9"],
    labels: ["Crimson Red", "Sumi Ink", "Sage Green"],
  },
];

export function getActiveThemeId(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("kaizu_theme_id") || "paper-washi";
  }
  return "paper-washi";
}

export function applyTheme(themeId: string) {
  if (typeof window !== "undefined") {
    const validTheme = THEMES.some((t) => t.id === themeId) ? themeId : "paper-washi";
    localStorage.setItem("kaizu_theme_id", validTheme);
    document.documentElement.setAttribute("data-theme", validTheme);
    document.body.setAttribute("data-theme", validTheme);
  }
}
