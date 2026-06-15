/** @type {import('tailwindcss').Config} */
const tokens = require("./tokens")

/**
 * TerraTech Tailwind config — Alex (Design System Manager)
 *
 * HMR demo: change `tokens.colors.primary` in ./tokens.js (or edit values below)
 * and save — /terratech pages re-render with the new brand color.
 */
module.exports = {
  darkMode: ["class"],
  content: [
    "app/terratech/**/*.{ts,tsx}",
    "components/terratech/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: tokens.spacing.page,
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: tokens.colors.primary,
          foreground: tokens.colors.primaryForeground,
        },
        secondary: {
          DEFAULT: tokens.colors.secondary,
          foreground: tokens.colors.secondaryForeground,
        },
        destructive: {
          DEFAULT: tokens.colors.destructive,
          foreground: tokens.colors.destructiveForeground,
        },
        accent: {
          DEFAULT: tokens.colors.accent,
          foreground: tokens.colors.accentForeground,
        },
        background: tokens.colors.background,
        foreground: tokens.colors.foreground,
        card: {
          DEFAULT: tokens.colors.card,
          foreground: tokens.colors.cardForeground,
        },
        muted: {
          DEFAULT: tokens.colors.muted,
          foreground: tokens.colors.mutedForeground,
        },
        border: tokens.colors.border,
        input: tokens.colors.input,
        ring: tokens.colors.ring,
        neutral: tokens.colors.neutral,
      },
      fontFamily: {
        sans: tokens.fontFamily.sans.split(",").map((f) => f.trim()),
      },
      fontSize: tokens.fontSize,
      spacing: {
        page: tokens.spacing.page,
        section: tokens.spacing.section,
        card: tokens.spacing.card,
        stack: tokens.spacing.stack,
        "stack-lg": tokens.spacing.stackLg,
      },
      borderRadius: {
        lg: tokens.radius,
        md: `calc(${tokens.radius} - 2px)`,
        sm: `calc(${tokens.radius} - 4px)`,
      },
    },
  },
}
