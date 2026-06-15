// Profiles utility functions for server-side operations

import { createClient } from './supabase/server'
import type { Profile, ProfileUpdate } from '@/types/profile'

/**
 * Get a user's profile by user ID
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data
}

/**
 * Get the current user's profile
 */
export async function getCurrentUserProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  return getProfile(user.id)
}

/**
 * Update a user's profile
 */
export async function updateProfile(
  userId: string, 
  updates: ProfileUpdate
): Promise<Profile | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    return null
  }

  return data
}

/**
 * Update the current user's profile
 */
export async function updateCurrentUserProfile(
  updates: ProfileUpdate
): Promise<Profile | null> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  return updateProfile(user.id, updates)
}

/**
 * Check if a profile is complete (has required fields filled)
 */
export function isProfileComplete(profile: Profile): boolean {
  // For now, we consider a profile complete if it has an email
  // You can extend this logic based on your requirements
  return Boolean(profile.email && profile.email.trim().length > 0)
}

/**
 * Get user initials from profile
 */
export function getProfileInitials(profile: Profile): string {
  if (profile.first_name) {
    return profile.first_name.charAt(0).toUpperCase()
  }
  
  if (profile.email) {
    return profile.email.charAt(0).toUpperCase()
  }
  
  return 'U' // Default to 'U' for User
}

/**
 * Get full display name from profile
 */
export function getProfileDisplayName(profile: Profile): string {
  if (profile.first_name) {
    return profile.first_name
  }
  
  if (profile.email) {
    // Return the part before @ symbol
    return profile.email.split('@')[0]
  }
  
  return 'User'
}
