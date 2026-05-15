/**
 * LEEK design tokens — blends [leek_app](https://github.com/walidevish/leek_app) Tailwind greens
 * with the mobile mockup primary (#2E7D32).
 */
export const colors = {
  page: "#F5F6F8",
  surface: "#FFFFFF",
  ink: "#111827",
  muted: "#6B7280",
  white: "#FFFFFF",
  /** Mockup primary */
  brand: "#2E7D32",
  brandDark: "#1B5E20",
  brandLight: "#4CAF50",
  /** Original LEEK gradient family */
  leek950: "#064e3b",
  leek800: "#065f46",
  leek600: "#047857",
  leek50: "#E8F5E9",
  mintBanner: "#E8F5E9",
  cta: "#FACC15",
  border: "#E5E7EB",
  danger: "#B91C1C",
  star: "#FBBF24",
} as const;

/** Pastel tile backgrounds for category grid (mockup-style) */
export const categoryPastels = ["#E8F5E9", "#E3F2FD", "#FFF3E0", "#F3E5F5", "#E0F7FA", "#FFEBEE", "#F1F8E9", "#EDE7F6"] as const;

export const radii = { card: 20, pill: 999, input: 14, fab: 999 } as const;

export const shadows = {
  card: {
    shadowColor: "#064e3b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;
