"use client"

import type { TelestratorAnnotation } from "@/types/worldcup-exclusives"

interface PitchTelestratorProps {
  annotations: TelestratorAnnotation[]
  activeIds: string[]
}

/** Convert data coords (0–100) to SVG viewBox coords (100 × 68) */
function toSvg(x: number, y: number) {
  return { x, y: (y / 100) * 68 }
}

export function PitchTelestrator({ annotations, activeIds }: PitchTelestratorProps) {
  const visible = annotations.filter((a) => activeIds.includes(a.id))

  if (visible.length === 0) return null

  return (
    <svg
      viewBox="0 0 100 68"
      className="pointer-events-none absolute inset-0 z-30 h-full w-full"
      aria-hidden
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 6 3, 0 6" fill="currentColor" />
        </marker>
      </defs>

      {visible.map((ann) => {
        const color = ann.color ?? "#fbbf24"

        if (ann.type === "arrow" && ann.from && ann.to) {
          const f = toSvg(ann.from.x, ann.from.y)
          const t = toSvg(ann.to.x, ann.to.y)
          return (
            <g key={ann.id} style={{ color }}>
              <line
                x1={f.x}
                y1={f.y}
                x2={t.x}
                y2={t.y}
                stroke={color}
                strokeWidth="0.8"
                strokeDasharray="2 1"
                markerEnd="url(#arrowhead)"
                className="animate-pulse"
              />
              {ann.label && (
                <text
                  x={(f.x + t.x) / 2}
                  y={(f.y + t.y) / 2 - 2}
                  fill={color}
                  fontSize="3"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {ann.label}
                </text>
              )}
            </g>
          )
        }

        if (ann.type === "circle" && ann.center) {
          const c = toSvg(ann.center.x, ann.center.y)
          const r = (ann.radius ?? 3) * 0.68
          return (
            <g key={ann.id}>
              <circle
                cx={c.x}
                cy={c.y}
                r={r}
                fill="none"
                stroke={color}
                strokeWidth="0.6"
                strokeDasharray="1.5 1"
                className="animate-pulse"
              />
              {ann.label && (
                <text x={c.x} y={c.y - r - 1.5} fill={color} fontSize="2.8" fontWeight="bold" textAnchor="middle">
                  {ann.label}
                </text>
              )}
            </g>
          )
        }

        if (ann.type === "line" && ann.from && ann.to) {
          const f = toSvg(ann.from.x, ann.from.y)
          const t = toSvg(ann.to.x, ann.to.y)
          return (
            <g key={ann.id}>
              <line
                x1={f.x}
                y1={f.y}
                x2={t.x}
                y2={t.y}
                stroke={color}
                strokeWidth="0.5"
                opacity={0.9}
              />
              {ann.label && (
                <text x={f.x + 2} y={f.y - 2} fill={color} fontSize="2.8" fontWeight="bold">
                  {ann.label}
                </text>
              )}
            </g>
          )
        }

        if (ann.type === "offside_line" && ann.from && ann.to) {
          const f = toSvg(ann.from.x, ann.from.y)
          const t = toSvg(ann.to.x, ann.to.y)
          return (
            <g key={ann.id}>
              <line
                x1={f.x}
                y1={f.y}
                x2={t.x}
                y2={t.y}
                stroke={color}
                strokeWidth="0.7"
                strokeDasharray="3 2"
              />
              <rect
                x={f.x - 0.3}
                y={f.y}
                width={0.6}
                height={t.y - f.y}
                fill={color}
                opacity={0.15}
              />
              {ann.label && (
                <text x={f.x + 1.5} y={f.y + 3} fill={color} fontSize="2.8" fontWeight="bold">
                  {ann.label}
                </text>
              )}
            </g>
          )
        }

        if (ann.type === "zone" && ann.from && ann.to) {
          const f = toSvg(ann.from.x, ann.from.y)
          const t = toSvg(ann.to.x, ann.to.y)
          const x = Math.min(f.x, t.x)
          const y = Math.min(f.y, t.y)
          const w = Math.abs(t.x - f.x)
          const h = Math.abs(t.y - f.y)
          return (
            <g key={ann.id}>
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill={color}
                fillOpacity={0.2}
                stroke={color}
                strokeWidth="0.4"
                strokeDasharray="2 1"
              />
              {ann.label && (
                <text x={x + w / 2} y={y - 1} fill={color} fontSize="2.8" fontWeight="bold" textAnchor="middle">
                  {ann.label}
                </text>
              )}
            </g>
          )
        }

        if (ann.type === "run_path" && ann.points && ann.points.length >= 2) {
          const d = ann.points
            .map((p, i) => {
              const s = toSvg(p.x, p.y)
              return `${i === 0 ? "M" : "L"} ${s.x} ${s.y}`
            })
            .join(" ")
          return (
            <g key={ann.id} style={{ color }}>
              <path
                d={d}
                fill="none"
                stroke={color}
                strokeWidth="0.7"
                strokeDasharray="2 1"
                markerEnd="url(#arrowhead)"
              />
              {ann.label && ann.points[0] && (
                <text
                  x={toSvg(ann.points[0].x, ann.points[0].y).x}
                  y={toSvg(ann.points[0].x, ann.points[0].y).y - 2}
                  fill={color}
                  fontSize="2.8"
                  fontWeight="bold"
                >
                  {ann.label}
                </text>
              )}
            </g>
          )
        }

        return null
      })}
    </svg>
  )
}

export function getActiveAnnotationIds(
  annotations: TelestratorAnnotation[],
  time: number,
  commentaryIds?: string[]
): string[] {
  const byTime = annotations
    .filter((a) => time >= a.startTime && time <= a.endTime)
    .map((a) => a.id)

  if (commentaryIds?.length) {
    const fromCommentary = annotations
      .filter((a) => commentaryIds.includes(a.id))
      .map((a) => a.id)
    return [...new Set([...fromCommentary, ...byTime])]
  }

  return byTime
}
