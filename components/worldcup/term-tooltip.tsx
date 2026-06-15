"use client"

import { HelpCircle } from "lucide-react"
import { GLOSSARY } from "@/lib/worldcup/glossary"
import { useWorldCupPreferences } from "./worldcup-preferences-provider"
import { cn } from "@/lib/utils"

interface TermTooltipProps {
  term: string
  className?: string
}

export function TermTooltip({ term, className }: TermTooltipProps) {
  const { preferences } = useWorldCupPreferences()
  const entry = GLOSSARY[term]

  if (!preferences.showTermTooltips || !entry) {
    return <span className={className}>{term}</span>
  }

  return (
    <span className={cn("group relative inline-flex cursor-help items-center gap-0.5", className)}>
      <span className="border-b border-dotted border-emerald-400/50">{term}</span>
      <HelpCircle className="h-3 w-3 text-emerald-400/60" aria-hidden />
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-lg border border-white/10 bg-[#1a2744] px-3 py-2 text-xs leading-relaxed text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        <span className="font-semibold text-emerald-300">{entry.term}</span>
        <span className="mt-1 block text-white/80">{entry.short}</span>
        {entry.example && (
          <span className="mt-1 block text-white/50 italic">{entry.example}</span>
        )}
      </span>
    </span>
  )
}
