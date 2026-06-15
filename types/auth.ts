// Authentication-related types and interfaces

import { User } from '@supabase/supabase-js'
import { Profile } from './profile'

// Extended user interface combining Supabase auth user with profile
export interface UserWithProfile extends User {
  profile?: Profile
}

// Authentication state interface
export interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  error: string | null
}

// Sign up form data interface
export interface SignUpFormData {
  email: string
  password: string
  first_name?: string
}

// Sign in form data interface
export interface SignInFormData {
  email: string
  password: string
}

// Password reset form data interface
export interface PasswordResetFormData {
  email: string
}

// Update password form data interface
export interface UpdatePasswordFormData {
  password: string
  confirmPassword: string
}

// Authentication error types
export type AuthError = 
  | 'invalid_credentials'
  | 'user_not_found'
  | 'email_already_exists'
  | 'weak_password'
  | 'invalid_email'
  | 'network_error'
  | 'unknown_error'

// Authentication action results
export interface AuthResult {
  success: boolean
  error?: AuthError
  message?: string
}

// Session state interface
export interface SessionState {
  isAuthenticated: boolean
  user: User | null
  profile: Profile | null
  expires_at?: number
}
