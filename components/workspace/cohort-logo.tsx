interface CohortLogoProps {
  className?: string
  showMark?: boolean
  size?: "sm" | "md" | "lg"
}

const sizes = {
  sm: { height: 22, fontSize: 16, mark: 22, gap: 7 },
  md: { height: 30, fontSize: 24, mark: 30, gap: 9 },
  lg: { height: 38, fontSize: 30, mark: 38, gap: 11 },
}

/** Lyft-inspired retro palette */
const cohortPink = "#FF00BF"
const cohortPinkDeep = "#E6007A"
const cohortNavy = "#352384"

/** One-word wordmark for the multi-agent workspace */
export function CohortLogo({ className, showMark = true, size = "md" }: CohortLogoProps) {
  const s = sizes[size]

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: s.gap,
        height: s.height,
        lineHeight: 1,
        fontFamily:
          'var(--font-cohort, "Fredoka", "Nunito", "Arial Rounded MT Bold", ui-rounded, system-ui, sans-serif)',
      }}
      aria-label="Cohort"
    >
      {showMark && (
        <svg
          width={s.mark}
          height={s.mark}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <rect
            x="1"
            y="1"
            width="30"
            height="30"
            rx="10"
            fill={cohortNavy}
            opacity="0.12"
          />
          <path
            d="M16 10 C12 14 10 17 10 21 M16 10 C20 14 22 17 22 21 M10 21 Q16 24 22 21"
            stroke={cohortPink}
            strokeWidth="3.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="16" cy="9" r="4.25" fill={cohortPink} />
          <circle cx="10" cy="22" r="4.25" fill={cohortPinkDeep} />
          <circle cx="22" cy="22" r="4.25" fill={cohortPinkDeep} />
          <circle cx="16" cy="9" r="1.75" fill="white" opacity="0.85" />
          <circle cx="10" cy="22" r="1.5" fill="white" opacity="0.7" />
          <circle cx="22" cy="22" r="1.5" fill="white" opacity="0.7" />
        </svg>
      )}
      <span
        style={{
          fontSize: s.fontSize,
          fontWeight: 700,
          letterSpacing: "0.02em",
          color: cohortPink,
          textTransform: "none",
        }}
      >
        Cohort
      </span>
    </span>
  )
}
