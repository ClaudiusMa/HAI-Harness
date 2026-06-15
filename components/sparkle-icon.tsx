import { cn } from "@/lib/utils"

interface SparkleIconProps {
  size?: number
  className?: string
}

export function SparkleIcon({ size = 24, className }: SparkleIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("inline-block", className)}
      aria-hidden="true"
    >
      {/* Main sparkle shape */}
      <path
        d="M12 2L14.09 8.26L20 10L14.09 11.74L12 18L9.91 11.74L4 10L9.91 8.26L12 2Z"
        fill="currentColor"
      />
      {/* Small sparkle top-left */}
      <path
        d="M5 3L5.5 5.5L8 6L5.5 6.5L5 9L4.5 6.5L2 6L4.5 5.5L5 3Z"
        fill="currentColor"
        opacity="0.7"
      />
      {/* Small sparkle bottom-right */}
      <path
        d="M19 15L19.5 17L21.5 17.5L19.5 18L19 20L18.5 18L16.5 17.5L18.5 17L19 15Z"
        fill="currentColor"
        opacity="0.7"
      />
    </svg>
  )
}
