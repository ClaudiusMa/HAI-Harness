"use client"

import { cn } from "@/lib/utils"

interface PitchFieldProps {
  children?: React.ReactNode
  className?: string
}

/** Top-down soccer pitch — coordinates map 0–100 on both axes */
export function PitchField({ children, className }: PitchFieldProps) {
  return (
    <div
      className={cn(
        "relative aspect-[68/105] w-full overflow-hidden rounded-xl border border-emerald-500/20",
        className
      )}
    >
      <svg
        viewBox="0 0 100 68"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        {/* Grass gradient */}
        <defs>
          <linearGradient id="grass" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1a4d2e" />
            <stop offset="50%" stopColor="#1e5631" />
            <stop offset="100%" stopColor="#1a4d2e" />
          </linearGradient>
          <pattern id="stripes" width="10" height="68" patternUnits="userSpaceOnUse">
            <rect width="5" height="68" fill="rgba(255,255,255,0.03)" />
          </pattern>
        </defs>
        <rect width="100" height="68" fill="url(#grass)" />
        <rect width="100" height="68" fill="url(#stripes)" />

        {/* Outer boundary */}
        <rect x="2" y="2" width="96" height="64" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.4" />

        {/* Halfway line */}
        <line x1="50" y1="2" x2="50" y2="66" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />

        {/* Center circle */}
        <circle cx="50" cy="34" r="9" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />
        <circle cx="50" cy="34" r="0.6" fill="rgba(255,255,255,0.6)" />

        {/* Penalty areas */}
        <rect x="2" y="17" width="16" height="34" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.3" />
        <rect x="82" y="17" width="16" height="34" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.3" />

        {/* Six-yard boxes */}
        <rect x="2" y="26" width="6" height="16" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.25" />
        <rect x="92" y="26" width="6" height="16" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.25" />

        {/* Goals */}
        <rect x="0.5" y="29" width="1.5" height="10" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.5)" strokeWidth="0.2" />
        <rect x="98" y="29" width="1.5" height="10" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.5)" strokeWidth="0.2" />

        {/* Penalty spots */}
        <circle cx="13" cy="34" r="0.5" fill="rgba(255,255,255,0.5)" />
        <circle cx="87" cy="34" r="0.5" fill="rgba(255,255,255,0.5)" />

        {/* Corner arcs (simplified) */}
        <path d="M 2 2 Q 4 2 4 4" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.2" />
        <path d="M 96 2 Q 98 2 98 4" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.2" />
      </svg>

      {/* Attack direction label */}
      <div className="absolute left-3 top-3 rounded bg-black/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/60">
        ← Defend · Attack →
      </div>

      <div className="absolute inset-0">{children}</div>
    </div>
  )
}

/** Convert pitch coords (0–100 x, 0–100 y) to percentage positions on field */
export function pitchToPercent(x: number, y: number) {
  return {
    left: `${x}%`,
    top: `${(y / 100) * 68 * (100 / 68)}%`,
  }
}

interface PitchMarkerProps {
  x: number
  y: number
  team: "home" | "away"
  label?: string
  isBall?: boolean
}

export function PitchMarker({ x, y, team, label, isBall }: PitchMarkerProps) {
  const pos = pitchToPercent(x, y)

  if (isBall) {
    return (
      <div
        className="absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out"
        style={pos}
      >
        <div className="h-3 w-3 rounded-full bg-white shadow-lg ring-2 ring-black/30 sm:h-3.5 sm:w-3.5" />
      </div>
    )
  }

  return (
    <div
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out"
      style={pos}
    >
      <div
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full border-2 text-[9px] font-bold shadow-md sm:h-7 sm:w-7 sm:text-[10px]",
          team === "home"
            ? "border-blue-400 bg-blue-600 text-white"
            : "border-amber-400 bg-amber-600 text-white"
        )}
      >
        {label ?? ""}
      </div>
    </div>
  )
}
