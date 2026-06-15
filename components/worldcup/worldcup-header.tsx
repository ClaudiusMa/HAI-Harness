"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { ChevronDown, Menu, X, Radio, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWorldCupPreferences } from "./worldcup-preferences-provider"
import { getTeamByCode } from "@/lib/worldcup/teams"
import { cn } from "@/lib/utils"

const PRIMARY_NAV = [
  { href: "/worldcup", label: "Home" },
  { href: "/worldcup/live", label: "Live" },
  { href: "/worldcup/pro-cast", label: "Pro Cast", highlight: true },
  { href: "/worldcup/pitch-room", label: "Pitch Room" },
  { href: "/worldcup/my-team", label: "My Team" },
]

const MORE_NAV = [
  { href: "/worldcup/dispatch", label: "Serif Dispatch" },
  { href: "/worldcup/players", label: "Player Threads" },
  { href: "/worldcup/picks", label: "Fan Stakes" },
  { href: "/worldcup/stories", label: "Stories" },
  { href: "/worldcup/format", label: "48-Team Guide" },
  { href: "/worldcup/standings", label: "Standings" },
]

export function WorldCupHeader() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const { preferences } = useWorldCupPreferences()
  const favoriteTeam = preferences.favoriteTeamCode
    ? getTeamByCode(preferences.favoriteTeamCode)
    : null

  const isMoreActive = MORE_NAV.some((item) => pathname === item.href)

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0f1a]/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/worldcup" className="flex items-center gap-2">
          <span className="text-xl" aria-hidden>⚽</span>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold tracking-tight text-white">World Cup</span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-emerald-400">
              2026 Companion
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors xl:px-3",
                pathname === item.href
                  ? "bg-white/10 text-white"
                  : "highlight" in item && item.highlight
                    ? "text-red-400/90 hover:bg-white/5 hover:text-red-300"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              {item.label}
            </Link>
          ))}

          <div className="relative">
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={cn(
                "flex items-center gap-0.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors xl:px-3",
                isMoreActive ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              More
              <ChevronDown className={cn("h-4 w-4 transition-transform", moreOpen && "rotate-180")} />
            </button>
            {moreOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-white/10 bg-[#0f1729] py-1 shadow-xl">
                  {MORE_NAV.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        "block px-4 py-2 text-sm transition-colors hover:bg-white/5",
                        pathname === item.href ? "text-emerald-400" : "text-white/70"
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/worldcup/my-team" className="hidden sm:block">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-white/20 bg-white/5 text-white hover:bg-white/10"
            >
              {favoriteTeam ? (
                <>
                  <span>{favoriteTeam.flag}</span>
                  {favoriteTeam.code}
                </>
              ) : (
                <>
                  <User className="h-3.5 w-3.5" />
                  My Team
                </>
              )}
            </Button>
          </Link>

          <Link href="/worldcup/live" className="hidden md:block">
            <Button size="sm" className="gap-1.5 bg-red-600 text-white hover:bg-red-700">
              <Radio className="h-3.5 w-3.5" />
              Live
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            className="text-white lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-white/10 px-4 py-3 lg:hidden">
          {[...PRIMARY_NAV, ...MORE_NAV].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block rounded-lg px-3 py-2.5 text-sm font-medium",
                pathname === item.href ? "bg-white/10 text-white" : "text-white/70"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
