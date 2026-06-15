// Profile-specific types and interfaces

import type { Database } from './database'

// Base profile type from database
export type Profile = Database['public']['Tables']['profiles']['Row']

// Profile insert type (for creating new profiles)
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']

// Profile update type (for updating existing profiles)
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

// Extended profile interface with additional computed properties
export interface ProfileWithMetadata extends Profile {
  full_name?: string
  initials?: string
  is_complete?: boolean
}

// Profile form data interface (for form handling)
export interface ProfileFormData {
  first_name?: string
  avatar_url?: string
  email: string
}

// Profile validation interface
export interface ProfileValidation {
  first_name?: {
    isValid: boolean
    message?: string
  }
  email: {
    isValid: boolean
    message?: string
  }
  avatar_url?: {
    isValid: boolean
    message?: string
  }
}

// Profile creation payload (what we send to create a profile)
export interface CreateProfilePayload {
  first_name?: string
  avatar_url?: string
  email: string
}

// Profile update payload (what we send to update a profile)
export interface UpdateProfilePayload {
  first_name?: string
  avatar_url?: string
  email?: string
}
