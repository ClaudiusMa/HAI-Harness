// Blog utility functions for server-side operations

import { createClient } from './supabase/server'
import type { Blog, BlogInsert, BlogUpdate } from '@/types/blog'

/**
 * Get all blogs, ordered by created_at descending
 */
export async function getAllBlogs(): Promise<Blog[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('blogs')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching blogs:', error)
    return []
  }

  return data || []
}

/**
 * Get a blog by slug
 */
export async function getBlogBySlug(slug: string): Promise<Blog | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('blogs')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    console.error('Error fetching blog:', error)
    return null
  }

  return data
}

/**
 * Get a blog by ID
 */
export async function getBlogById(id: number): Promise<Blog | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('blogs')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('Error fetching blog:', error)
    return null
  }

  return data
}

/**
 * Create a new blog
 */
export async function createBlog(blog: BlogInsert): Promise<Blog | null> {
  const supabase = await createClient()
  
  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data, error } = await supabase
    .from('blogs')
    .insert(blog)
    .select()
    .single()

  if (error) {
    console.error('Error creating blog:', error)
    throw new Error(error.message || 'Failed to create blog')
  }

  return data
}

/**
 * Update a blog by ID
 */
export async function updateBlog(
  id: number,
  updates: BlogUpdate
): Promise<Blog | null> {
  const supabase = await createClient()
  
  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data, error } = await supabase
    .from('blogs')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating blog:', error)
    throw new Error(error.message || 'Failed to update blog')
  }

  return data
}

/**
 * Delete a blog by ID
 */
export async function deleteBlog(id: number): Promise<boolean> {
  const supabase = await createClient()
  
  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase
    .from('blogs')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting blog:', error)
    throw new Error(error.message || 'Failed to delete blog')
  }

  return true
}

