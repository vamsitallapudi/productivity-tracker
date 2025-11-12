import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// POST /api/streaks/freeze - Use a streak freeze token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, days = 1 } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get current streak data
    const { data: currentStreak, error: streakError } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .eq('streak_type', 'daily')
      .single()

    if (streakError) {
      return NextResponse.json(
        { error: 'Streak not found' },
        { status: 404 }
      )
    }

    // Check if user has freeze tokens available (max 3 per month)
    const maxFreezeTokens = 3
    if (currentStreak.freeze_count >= maxFreezeTokens) {
      return NextResponse.json(
        { error: 'No freeze tokens remaining this month' },
        { status: 400 }
      )
    }

    // Use a freeze token
    const { data: updatedStreak, error: updateError } = await supabase
      .from('user_streaks')
      .update({
        freeze_count: currentStreak.freeze_count + 1
      })
      .eq('id', currentStreak.id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    // Create an achievement for first freeze use
    const { data: existingFreezeAchievement } = await supabase
      .from('streak_achievements')
      .select('id')
      .eq('user_id', userId)
      .eq('achievement_name', 'Freeze Master')
      .single()

    if (!existingFreezeAchievement) {
      await supabase
        .from('streak_achievements')
        .insert({
          user_id: userId,
          achievement_type: 'special',
          achievement_name: 'Freeze Master',
          metadata: {
            description: 'Used your first streak freeze token wisely!',
            icon: '🧊'
          }
        })
    }

    return NextResponse.json({
      success: true,
      updatedStreak,
      freezeTokensRemaining: maxFreezeTokens - updatedStreak.freeze_count,
      message: `Streak frozen for ${days} day(s). You have ${maxFreezeTokens - updatedStreak.freeze_count} freeze tokens remaining.`
    })

  } catch (error) {
    console.error('Error using streak freeze:', error)
    return NextResponse.json(
      { error: 'Failed to use streak freeze' },
      { status: 500 }
    )
  }
}

// GET /api/streaks/freeze - Get freeze token status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get current streak data
    const { data: currentStreak, error: streakError } = await supabase
      .from('user_streaks')
      .select('freeze_count')
      .eq('user_id', userId)
      .eq('streak_type', 'daily')
      .single()

    if (streakError && streakError.code !== 'PGRST116') {
      throw streakError
    }

    const maxFreezeTokens = 3
    const freezeCount = currentStreak?.freeze_count || 0
    const tokensRemaining = maxFreezeTokens - freezeCount

    return NextResponse.json({
      freezeTokensUsed: freezeCount,
      freezeTokensRemaining: Math.max(0, tokensRemaining),
      maxFreezeTokens,
      canUseFreeze: tokensRemaining > 0
    })

  } catch (error) {
    console.error('Error fetching freeze status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch freeze status' },
      { status: 500 }
    )
  }
}