// Blog-specific types and interfaces

import type { Database } from './database'

// Base blog type from database
export type Blog = Database['public']['Tables']['blogs']['Row']

// Blog insert type (for creating new blogs)
export type BlogInsert = Database['public']['Tables']['blogs']['Insert']

// Blog update type (for updating existing blogs)
export type BlogUpdate = Database['public']['Tables']['blogs']['Update']

// Blog form data interface (for form handling)
export interface BlogFormData {
  title: string
  subtitle?: string
  image?: string
  content: string
  author: string
}

// Blog creation payload (what we send to create a blog)
export interface CreateBlogPayload {
  title: string
  subtitle?: string
  image?: string
  content: string
  author: string
}

// Blog update payload (what we send to update a blog)
export interface UpdateBlogPayload {
  title?: string
  subtitle?: string
  image?: string
  content?: string
  author?: string
}

