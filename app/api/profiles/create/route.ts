import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { CreateProfilePayload } from '@/types/profile'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: CreateProfilePayload & { user_id: string } = await request.json()
    
    // Validate required fields
    if (!body.email || !body.user_id) {
      return NextResponse.json(
        { error: 'Email and user_id are required' },
        { status: 400 }
      )
    }

    // Ensure the user_id matches the authenticated user
    if (body.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Cannot create profile for another user' },
        { status: 403 }
      )
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Profile already exists' },
        { status: 409 }
      )
    }

    // Create the profile
    const { data: profile, error: createError } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        email: body.email,
        first_name: body.first_name || null,
        avatar_url: body.avatar_url || null,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating profile:', createError)
      return NextResponse.json(
        { error: createError.message || 'Failed to create profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({ profile }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error creating profile:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

