'use server'

import { createBlog, updateBlog, deleteBlog } from '@/lib/blogs'
import type { CreateBlogPayload, UpdateBlogPayload } from '@/types/blog'
import { revalidatePath } from 'next/cache'

/**
 * Server action to create a new blog
 */
export async function createBlogAction(payload: CreateBlogPayload) {
  try {
    const blog = await createBlog({
      title: payload.title,
      subtitle: payload.subtitle || null,
      image: payload.image || null,
      content: payload.content,
      author: payload.author,
    })

    // Revalidate blog list and detail pages
    revalidatePath('/blogs')
    revalidatePath(`/blogs/${blog?.slug}`)

    return { success: true, blog, error: null }
  } catch (error) {
    console.error('Error in createBlogAction:', error)
    return {
      success: false,
      blog: null,
      error: error instanceof Error ? error.message : 'Failed to create blog',
    }
  }
}

/**
 * Server action to update a blog
 */
export async function updateBlogAction(
  id: number,
  payload: UpdateBlogPayload
) {
  try {
    const blog = await updateBlog(id, payload)

    // Revalidate blog list and detail pages
    revalidatePath('/blogs')
    revalidatePath(`/blogs/${blog?.slug}`)

    return { success: true, blog, error: null }
  } catch (error) {
    console.error('Error in updateBlogAction:', error)
    return {
      success: false,
      blog: null,
      error: error instanceof Error ? error.message : 'Failed to update blog',
    }
  }
}

/**
 * Server action to delete a blog
 */
export async function deleteBlogAction(id: number) {
  try {
    await deleteBlog(id)

    // Revalidate blog list
    revalidatePath('/blogs')

    return { success: true, error: null }
  } catch (error) {
    console.error('Error in deleteBlogAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete blog',
    }
  }
}

