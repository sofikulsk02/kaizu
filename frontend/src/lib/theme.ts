export interface Theme {
  id: string;
  name: string;
  description: string;
  tagline?: string;
  category?: "light" | "dark";
  colors: string[];
  labels: string[];
}

export const THEMES: Theme[] = [
  // 1. Matcha & Rice Paper (Top Pick)
  {
    id: "theme-matcha-ricepaper",
    name: "Matcha & Rice Paper",
    tagline: "Natural · Japanese · Calm",
    category: "light",
    description: "Soft rice-paper backgrounds, matcha green actions, and restrained terracotta accents. Thoughtful, organic, and connected to Kaizen.",
    colors: ["#527653", "#F5F3E9", "#FFFEF8", "#C7795A"],
    labels: ["Matcha", "Rice Paper", "Cards", "Terracotta"],
  },

  // 2. Midnight Indigo
  {
    id: "theme-midnight-indigo",
    name: "Midnight Indigo",
    tagline: "Professional · Focused · Technical",
    category: "dark",
    description: "Deep navy canvas with indigo controls and subtle cyan highlights. Engineered for long deep-work sessions.",
    colors: ["#818CF8", "#101522", "#191F30", "#67D5E8"],
    labels: ["Indigo", "Navy Page", "Navy Cards", "Cyan"],
  },

  // 3. Forest & Linen
  {
    id: "theme-forest-linen",
    name: "Forest & Linen",
    tagline: "Grounded · Mature · Organic",
    category: "light",
    description: "Deeper forest greens and warm linen surfaces with restrained ocher accents. Quiet, organic maturity.",
    colors: ["#2F6549", "#F0F1E8", "#FAFBF5", "#B58B52"],
    labels: ["Forest Pine", "Linen Page", "Cards", "Raw Ocher"],
  },

  // 4. Wisteria & Ink
  {
    id: "theme-wisteria-ink",
    name: "Wisteria & Ink",
    tagline: "Creative · Gentle · Modern",
    category: "light",
    description: "Soft pale wisteria canvas, gentle purple controls, and muted rose ink accents. Elegant and distinctive without visual noise.",
    colors: ["#7865B5", "#F5F1F8", "#FFFCFF", "#C8758D"],
    labels: ["Wisteria", "Pale Violet", "Cards", "Plum Ink"],
  },

  // 5. Charcoal & Copper
  {
    id: "theme-charcoal-copper",
    name: "Charcoal & Copper",
    tagline: "Warm Dark · Elegant · Low Glare",
    category: "dark",
    description: "Deep warm charcoal without blue tech cast. Luminous burnished copper actions and rich terracotta accents.",
    colors: ["#D99A6C", "#191817", "#242220", "#C66B55"],
    labels: ["Copper", "Charcoal", "Cards", "Terracotta"],
  },

  // 6. Sumi Monochrome
  {
    id: "theme-sumi-monochrome",
    name: "Sumi Monochrome",
    tagline: "Minimal · Distraction-free · Timeless",
    category: "dark",
    description: "Refined grayscale sumi ink canvas with a controlled celadon accent. Ideal for high focus and deep review.",
    colors: ["#D8D8D8", "#111214", "#1C1D20", "#A8C5AE"],
    labels: ["Silver", "Sumi Black", "Cards", "Celadon"],
  },

  // Classic Japanese Themes
  {
    id: "paper-washi",
    name: "Warm Washi & Crimson",
    tagline: "Traditional · Textured · Classical",
    category: "light",
    description: "Warm washi paper aesthetic with forest green tones and rich crimson highlights.",
    colors: ["#B83245", "#F4EFE3", "#FAF7F0", "#173524"],
    labels: ["Crimson", "Washi Paper", "Cards", "Deep Forest"],
  },
  {
    id: "theme-olive-burgundy",
    name: "Olive Green & Burgundy",
    tagline: "Calm · Earthy · Scholarly",
    category: "light",
    description: "Earthy olive green and deep burgundy on gentle natural paper surfaces.",
    colors: ["#722F37", "#F8F6EE", "#FFFFFF", "#556B2F"],
    labels: ["Burgundy", "Warm Paper", "Cards", "Olive Green"],
  },
  {
    id: "theme-orange-black",
    name: "Obsidian & Warm Orange",
    tagline: "High Contrast · Vivid · Cyber",
    category: "dark",
    description: "Warm vivid orange and sky blue accents against deep obsidian black.",
    colors: ["#FF8A3D", "#0F1115", "#1A1F26", "#7DD3FC"],
    labels: ["Warm Orange", "Deep Black", "Cards", "Sky Blue"],
  },
  {
    id: "paper-sage",
    name: "Sage Botanical Paper",
    tagline: "Pastel · Herbal · Refreshing",
    category: "light",
    description: "Soft pastel cream and sage botanical tones with grounding deep pine.",
    colors: ["#2D5A40", "#EFECE6", "#F7F5F0", "#6B8E67"],
    labels: ["Pine Green", "Pastel Cream", "Cards", "Sage Green"],
  },
  {
    id: "paper-charcoal",
    name: "Sumi Ink & Dark Paper",
    tagline: "Dark Slate · Quiet · Contrast",
    category: "dark",
    description: "Deep sumi ink dark slate with crisp sage and subtle crimson contrast.",
    colors: ["#C94A5C", "#1B211E", "#242C28", "#7DA479"],
    labels: ["Crimson Red", "Sumi Ink", "Cards", "Sage Green"],
  },
  {
    id: "theme-yozakura",
    name: "Yozakura (Night Sakura)",
    tagline: "Moonlit · Sakura Bloom · Serene",
    category: "dark",
    description: "Deep midnight plum canvas illuminated by luminous sakura rose and warm lantern gold.",
    colors: ["#F472B6", "#13111A", "#1D1927", "#FBBF24"],
    labels: ["Sakura Rose", "Midnight Plum", "Cards", "Lantern Gold"],
  },
];

export function getActiveThemeId(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("kaizu_theme_id") || "theme-matcha-ricepaper";
  }
  return "theme-matcha-ricepaper";
}

export function applyTheme(themeId: string) {
  if (typeof window !== "undefined") {
    const validTheme = THEMES.some((t) => t.id === themeId) ? themeId : "theme-matcha-ricepaper";
    localStorage.setItem("kaizu_theme_id", validTheme);
    document.documentElement.setAttribute("data-theme", validTheme);
    document.body.setAttribute("data-theme", validTheme);
  }
}
