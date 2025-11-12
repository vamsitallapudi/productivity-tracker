import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('Testing streak tables...')

    // Test 1: Check if user exists
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', 'alex@example.com')
      .single()

    if (userError) {
      return NextResponse.json({
        error: 'User not found',
        details: userError
      }, { status: 404 })
    }

    console.log('User found:', userData)

    // Test 2: Check if streak tables exist
    const { data: streakData, error: streakError } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userData.id)
      .limit(1)

    // Test 3: Check if activities table exists
    const { data: activitiesData, error: activitiesError } = await supabase
      .from('daily_activities')
      .select('*')
      .eq('user_id', userData.id)
      .limit(5)

    // Test 4: Check if achievements table exists
    const { data: achievementsData, error: achievementsError } = await supabase
      .from('streak_achievements')
      .select('*')
      .eq('user_id', userData.id)
      .limit(5)

    // Test 5: Check recent sessions
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      success: true,
      userId: userData.id,
      userEmail: userData.email,
      tests: {
        userStreaks: {
          error: streakError?.message || null,
          data: streakData,
          count: streakData?.length || 0
        },
        dailyActivities: {
          error: activitiesError?.message || null,
          data: activitiesData,
          count: activitiesData?.length || 0
        },
        achievements: {
          error: achievementsError?.message || null,
          data: achievementsData,
          count: achievementsData?.length || 0
        },
        recentSessions: {
          error: sessionsError?.message || null,
          data: sessionsData,
          count: sessionsData?.length || 0
        }
      }
    })

  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}