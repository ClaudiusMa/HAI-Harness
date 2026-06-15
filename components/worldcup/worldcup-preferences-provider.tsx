"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  completeOnboardingAction,
  saveWorldCupPreferencesAction,
} from "@/app/actions/worldcup-preferences"
import {
  DEFAULT_WORLDCUP_PREFERENCES,
  type ExperienceLevel,
  type WorldCupPreferences,
} from "@/types/worldcup-preferences"

const STORAGE_KEY = "serif-worldcup-preferences"

interface WorldCupPreferencesContextValue {
  preferences: WorldCupPreferences
  isLoaded: boolean
  isAuthenticated: boolean
  showOnboarding: boolean
  updatePreferences: (updates: Partial<WorldCupPreferences>) => Promise<void>
  completeOnboarding: (updates: Partial<WorldCupPreferences>) => Promise<void>
  dismissOnboarding: () => void
  toggleFollowTeam: (teamCode: string) => Promise<void>
  setFavoriteTeam: (teamCode: string) => Promise<void>
}

const WorldCupPreferencesContext = createContext<WorldCupPreferencesContextValue | null>(null)

function loadLocalPreferences(): WorldCupPreferences {
  if (typeof window === "undefined") return DEFAULT_WORLDCUP_PREFERENCES
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_WORLDCUP_PREFERENCES
    return { ...DEFAULT_WORLDCUP_PREFERENCES, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_WORLDCUP_PREFERENCES
  }
}

function saveLocalPreferences(prefs: WorldCupPreferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
}

interface ProviderProps {
  children: React.ReactNode
  initialPreferences?: WorldCupPreferences | null
  isAuthenticated?: boolean
}

export function WorldCupPreferencesProvider({
  children,
  initialPreferences = null,
  isAuthenticated = false,
}: ProviderProps) {
  const [preferences, setPreferences] = useState<WorldCupPreferences>(
    initialPreferences ?? DEFAULT_WORLDCUP_PREFERENCES
  )
  const [isLoaded, setIsLoaded] = useState(Boolean(initialPreferences))
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [authed, setAuthed] = useState(isAuthenticated)

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      setAuthed(Boolean(user))

      if (initialPreferences) {
        setPreferences(initialPreferences)
        setShowOnboarding(!initialPreferences.onboardingCompleted)
        setIsLoaded(true)
        return
      }

      const local = loadLocalPreferences()
      setPreferences(local)
      setShowOnboarding(!local.onboardingCompleted)
      setIsLoaded(true)
    }

    init()
  }, [initialPreferences])

  const persist = useCallback(
    async (updates: Partial<WorldCupPreferences>) => {
      const next = { ...preferences, ...updates }
      setPreferences(next)
      saveLocalPreferences(next)

      if (authed) {
        const result = await saveWorldCupPreferencesAction(updates)
        if (result.preferences) {
          setPreferences(result.preferences)
          saveLocalPreferences(result.preferences)
        }
      }
    },
    [preferences, authed]
  )

  const updatePreferences = useCallback(
    async (updates: Partial<WorldCupPreferences>) => {
      await persist(updates)
    },
    [persist]
  )

  const completeOnboarding = useCallback(
    async (updates: Partial<WorldCupPreferences>) => {
      const next = { ...preferences, ...updates, onboardingCompleted: true }
      setPreferences(next)
      saveLocalPreferences(next)
      setShowOnboarding(false)

      if (authed) {
        const result = await completeOnboardingAction(updates)
        if (result.preferences) {
          setPreferences(result.preferences)
          saveLocalPreferences(result.preferences)
        }
      }
    },
    [preferences, authed]
  )

  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false)
    void persist({ onboardingCompleted: true })
  }, [persist])

  const toggleFollowTeam = useCallback(
    async (teamCode: string) => {
      const followed = preferences.followedTeamCodes.includes(teamCode)
        ? preferences.followedTeamCodes.filter((c) => c !== teamCode)
        : [...preferences.followedTeamCodes, teamCode]
      await persist({ followedTeamCodes: followed })
    },
    [preferences.followedTeamCodes, persist]
  )

  const setFavoriteTeam = useCallback(
    async (teamCode: string) => {
      const followed = preferences.followedTeamCodes.includes(teamCode)
        ? preferences.followedTeamCodes
        : [...preferences.followedTeamCodes, teamCode]
      await persist({ favoriteTeamCode: teamCode, followedTeamCodes: followed })
    },
    [preferences.followedTeamCodes, persist]
  )

  const value = useMemo(
    () => ({
      preferences,
      isLoaded,
      isAuthenticated: authed,
      showOnboarding,
      updatePreferences,
      completeOnboarding,
      dismissOnboarding,
      toggleFollowTeam,
      setFavoriteTeam,
    }),
    [
      preferences,
      isLoaded,
      authed,
      showOnboarding,
      updatePreferences,
      completeOnboarding,
      dismissOnboarding,
      toggleFollowTeam,
      setFavoriteTeam,
    ]
  )

  return (
    <WorldCupPreferencesContext.Provider value={value}>
      {children}
    </WorldCupPreferencesContext.Provider>
  )
}

export function useWorldCupPreferences() {
  const ctx = useContext(WorldCupPreferencesContext)
  if (!ctx) {
    throw new Error("useWorldCupPreferences must be used within WorldCupPreferencesProvider")
  }
  return ctx
}

export function useExperienceLevel(): ExperienceLevel {
  return useWorldCupPreferences().preferences.experienceLevel
}
