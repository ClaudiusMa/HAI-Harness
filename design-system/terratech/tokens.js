/**
 * TerraTech design tokens — single source of truth.
 * Edit values here (or in tailwind.config.js) and save → demo pages hot-reload via HMR.
 *
 * Brand: Sustainable Electronics · tone: clean, reliable, innovative
 */
module.exports = {
  brand: {
    name: "TerraTech",
    tagline: "Sustainable Electronics",
    tone: "clean, reliable, innovative",
  },
  colors: {
    primary: "hsl(142 45% 38%)",
    primaryForeground: "hsl(0 0% 98%)",
    secondary: "hsl(38 35% 72%)",
    secondaryForeground: "hsl(28 25% 18%)",
    accent: "hsl(85 30% 88%)",
    accentForeground: "hsl(142 35% 22%)",
    destructive: "hsl(0 55% 48%)",
    destructiveForeground: "hsl(0 0% 98%)",
    background: "hsl(45 20% 97%)",
    foreground: "hsl(28 20% 14%)",
    card: "hsl(0 0% 100%)",
    cardForeground: "hsl(28 20% 14%)",
    muted: "hsl(42 18% 92%)",
    mutedForeground: "hsl(28 10% 42%)",
    border: "hsl(38 16% 85%)",
    input: "hsl(38 16% 85%)",
    ring: "hsl(142 45% 38%)",
    neutral: {
      50: "hsl(45 20% 97%)",
      100: "hsl(42 18% 92%)",
      500: "hsl(28 10% 42%)",
      800: "hsl(28 20% 18%)",
      950: "hsl(28 22% 10%)",
    },
  },
  colorsDark: {
    background: "hsl(28 22% 10%)",
    foreground: "hsl(45 20% 96%)",
    card: "hsl(28 20% 14%)",
    cardForeground: "hsl(45 20% 96%)",
    primary: "hsl(142 50% 45%)",
    primaryForeground: "hsl(28 22% 10%)",
    secondary: "hsl(38 25% 28%)",
    secondaryForeground: "hsl(45 20% 96%)",
    muted: "hsl(28 18% 18%)",
    mutedForeground: "hsl(38 12% 65%)",
    border: "hsl(28 15% 22%)",
    input: "hsl(28 15% 22%)",
  },
  fontFamily: {
    sans: "'Terra Sans', var(--font-terra-sans), system-ui, sans-serif",
  },
  fontSize: {
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
    "5xl": "3rem",
  },
  spacing: {
    page: "clamp(1rem, 4vw, 2rem)",
    section: "clamp(2rem, 6vw, 4rem)",
    card: "1.5rem",
    stack: "1rem",
    stackLg: "1.5rem",
  },
  radius: "0.625rem",
}
