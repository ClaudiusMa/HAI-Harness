"use server"

import { revalidatePath } from "next/cache"
import { upsertCurrentUserWorldCupPreferences } from "@/lib/worldcup/preferences"
import type { WorldCupPreferences } from "@/types/worldcup-preferences"

interface ActionResult {
  success: boolean
  error?: string
  preferences?: WorldCupPreferences
}

export async function saveWorldCupPreferencesAction(
  prefs: Partial<WorldCupPreferences>
): Promise<ActionResult> {
  const saved = await upsertCurrentUserWorldCupPreferences(prefs)

  if (!saved) {
    return { success: false, error: "Could not save preferences. Please sign in and try again." }
  }

  revalidatePath("/worldcup")
  revalidatePath("/worldcup/my-team")

  return { success: true, preferences: saved }
}

export async function completeOnboardingAction(
  prefs: Partial<WorldCupPreferences>
): Promise<ActionResult> {
  return saveWorldCupPreferencesAction({
    ...prefs,
    onboardingCompleted: true,
  })
}
