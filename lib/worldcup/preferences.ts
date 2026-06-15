import { createClient } from "@/lib/supabase/server"
import {
  DEFAULT_WORLDCUP_PREFERENCES,
  type WorldCupPreferences,
  type WorldCupPreferencesRow,
  preferencesToRow,
  rowToPreferences,
} from "@/types/worldcup-preferences"

export async function getWorldCupPreferences(
  userId: string
): Promise<WorldCupPreferences | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("worldcup_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    console.error("[worldcup_preferences] fetch error:", error)
    return null
  }

  if (!data) return null
  return rowToPreferences(data as WorldCupPreferencesRow)
}

export async function getCurrentUserWorldCupPreferences(): Promise<WorldCupPreferences | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null
  return getWorldCupPreferences(user.id)
}

export async function upsertWorldCupPreferences(
  userId: string,
  prefs: Partial<WorldCupPreferences>
): Promise<WorldCupPreferences | null> {
  const supabase = await createClient()
  const existing = await getWorldCupPreferences(userId)
  const merged = { ...DEFAULT_WORLDCUP_PREFERENCES, ...existing, ...prefs }
  const row = preferencesToRow(merged)

  const { data, error } = await supabase
    .from("worldcup_preferences")
    .upsert({ user_id: userId, ...row }, { onConflict: "user_id" })
    .select("*")
    .single()

  if (error) {
    console.error("[worldcup_preferences] upsert error:", error)
    return null
  }

  return rowToPreferences(data as WorldCupPreferencesRow)
}

export async function upsertCurrentUserWorldCupPreferences(
  prefs: Partial<WorldCupPreferences>
): Promise<WorldCupPreferences | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null
  return upsertWorldCupPreferences(user.id, prefs)
}
