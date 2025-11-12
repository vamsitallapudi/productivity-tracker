import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { 
  getUserProfile, 
  updateUserProfile, 
  validateProfileUpdate,
  ProfileError 
} from '@/lib/profile-service'

// Validation schema for profile updates
const ProfileUpdateSchema = z.object({
  display_name: z.string().min(1).max(100).nullable().optional(),
  email_preferences: z.object({
    session_reminders: z.boolean().optional(),
    weekly_summaries: z.boolean().optional(),
    achievement_notifications: z.boolean().optional(),
  }).optional(),
})

// Helper function to get current user ID
// For now, using the hardcoded user like the rest of the app
async function getCurrentUserId(): Promise<string | null> {
  try {
    const { supabase } = await import('@/lib/supabase')
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'alex@example.com')
      .single()
    
    if (error || !data) {
      return null
    }
    
    return data.id
  } catch (error) {
    console.error('Error getting current user ID:', error)
    return null
  }
}

/**
 * GET /api/profile
 * Fetch current user's profile
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const profile = await getUserProfile(userId)
    
    return NextResponse.json({ 
      success: true,
      data: profile 
    })
  } catch (error) {
    console.error('Profile GET error:', error)
    
    if (error instanceof ProfileError) {
      const status = error.code === 'USER_NOT_FOUND' ? 404 : 400
      return NextResponse.json(
        { 
          error: error.message,
          code: error.code 
        },
        { status }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/profile
 * Update current user's profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Validate with Zod schema
    const parseResult = ProfileUpdateSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: parseResult.error.errors 
        },
        { status: 400 }
      )
    }

    const updates = parseResult.data

    // Additional validation using custom validator
    const validation = validateProfileUpdate(updates)
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Profile validation failed',
          details: validation.errors 
        },
        { status: 400 }
      )
    }

    // Update the profile
    const updatedProfile = await updateUserProfile(userId, updates)
    
    return NextResponse.json({ 
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully'
    })
  } catch (error) {
    console.error('Profile PATCH error:', error)
    
    if (error instanceof ProfileError) {
      return NextResponse.json(
        { 
          error: error.message,
          code: error.code 
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS /api/profile
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}