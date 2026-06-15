import type { Metadata } from "next"
import { Figtree } from "next/font/google"
import "@/design-system/terratech/theme.css"
import { TerratechThemeProvider } from "@/components/terratech/terratech-theme-provider"

/** Stand-in for fictional 'Terra Sans' — clean, reliable, innovative */
const terraSans = Figtree({
  variable: "--font-terra-sans-loaded",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "TerraTech — Sustainable Electronics",
  description:
    "Demo storefront powered by Alex's TerraTech design system (shadcn/ui + Tailwind).",
}

export default function TerratechLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={terraSans.variable}>
      <TerratechThemeProvider>{children}</TerratechThemeProvider>
    </div>
  )
}
