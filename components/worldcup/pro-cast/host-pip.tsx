"use client"

import type { ProCastHost } from "@/types/worldcup-exclusives"
import { cn } from "@/lib/utils"
import { Mic, Radio } from "lucide-react"

interface HostPipProps {
  host: ProCastHost
  isSpeaking: boolean
  currentText?: string
}

export function HostPip({ host, isSpeaking, currentText }: HostPipProps) {
  return (
    <div className="absolute bottom-3 right-3 z-40 w-[140px] overflow-hidden rounded-xl border-2 shadow-2xl sm:w-[180px]"
      style={{ borderColor: host.accentColor }}
    >
      {/* Video placeholder — production would be live ex-player feed */}
      <div
        className="relative aspect-video bg-gradient-to-br from-[#1a1a2e] to-[#0a0f1a]"
        style={{ boxShadow: `inset 0 0 40px ${host.accentColor}33` }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full text-lg font-black text-white sm:h-16 sm:w-16 sm:text-xl",
              isSpeaking && "animate-pulse ring-2 ring-white/30"
            )}
            style={{ backgroundColor: host.accentColor }}
          >
            {host.initials}
          </div>
        </div>

        {isSpeaking && (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Live
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-2 pb-2 pt-6">
          <p className="truncate text-xs font-bold text-white">{host.name}</p>
          <p className="truncate text-[10px] text-white/60">Pro Cast</p>
        </div>
      </div>

      {currentText && isSpeaking && (
        <div className="border-t border-white/10 bg-black/80 px-2 py-1.5">
          <p className="line-clamp-2 text-[10px] leading-snug text-white/80 sm:text-xs">
            {currentText}
          </p>
        </div>
      )}
    </div>
  )
}

export function HostBanner({ host }: { host: ProCastHost }) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl border p-3"
      style={{ borderColor: `${host.accentColor}44`, backgroundColor: `${host.accentColor}11` }}
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
        style={{ backgroundColor: host.accentColor }}
      >
        {host.initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-bold text-white">{host.name}</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-red-600/20 px-2 py-0.5 text-[10px] font-bold uppercase text-red-400">
            <Radio className="h-3 w-3" />
            Pro Cast
          </span>
        </div>
        <p className="text-xs text-white/50">{host.title}</p>
      </div>
      <Mic className="h-5 w-5 shrink-0 text-white/30" aria-hidden />
    </div>
  )
}
