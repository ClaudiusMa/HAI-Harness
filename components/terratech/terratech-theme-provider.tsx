"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TerratechThemeProviderProps {
  children: React.ReactNode
  className?: string
}

export function TerratechThemeProvider({
  children,
  className,
}: TerratechThemeProviderProps) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("terratech-theme")
    if (stored === "dark") setIsDark(true)
  }, [])

  function toggleDark() {
    setIsDark((prev) => {
      const next = !prev
      localStorage.setItem("terratech-theme", next ? "dark" : "light")
      return next
    })
  }

  return (
    <div
      className={cn(
        "terratech-theme min-h-screen antialiased",
        isDark && "dark",
        className
      )}
    >
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleDark}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="bg-card/80 backdrop-blur-sm"
        >
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
      </div>
      {children}
    </div>
  )
}
