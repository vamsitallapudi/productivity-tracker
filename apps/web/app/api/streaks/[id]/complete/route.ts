import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database, StreakCard } from '@/lib/database.types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// POST /api/streaks/[id]/complete - Mark streak as completed for today
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: streakId } = await params
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get current streak data
    const { data: streak, error: streakError } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('id', streakId)
      .eq('user_id', userId)
      .single()

    if (streakError) {
      if (streakError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Streak not found' },
          { status: 404 }
        )
      }
      throw streakError
    }

    const today = new Date().toISOString().split('T')[0]

    // Check if already completed today
    const { data: existingActivity } = await supabase
      .from('daily_activities')
      .select('id')
      .eq('streak_id', streakId)
      .eq('activity_date', today)
      .single()

    if (existingActivity) {
      return NextResponse.json(
        { error: 'Streak already completed for today' },
        { status: 409 }
      )
    }

    // Add daily activity
    const { error: activityError } = await supabase
      .from('daily_activities')
      .insert({
        user_id: userId,
        streak_id: streakId,
        activity_date: today,
        session_count: 1,
        total_minutes: 0, // Can be updated if needed
        streak_eligible: true
      })

    if (activityError) {
      throw activityError
    }

    // Calculate new streak count
    let newCurrentStreak = streak.current_streak + 1
    let newLongestStreak = Math.max(streak.longest_streak, newCurrentStreak)
    let streakStartDate = streak.streak_start_date

    // If this is the start of a new streak
    if (streak.current_streak === 0) {
      streakStartDate = today
    }

    // Update streak data
    const { data: updatedStreak, error: updateError } = await supabase
      .from('user_streaks')
      .update({
        current_streak: newCurrentStreak,
        longest_streak: newLongestStreak,
        last_activity_date: today,
        streak_start_date: streakStartDate
      })
      .eq('id', streakId)
      .select(`
        id,
        name,
        icon,
        color,
        category,
        current_streak,
        is_active,
        display_order,
        last_activity_date
      `)
      .single()

    if (updateError) {
      throw updateError
    }

    // Transform to StreakCard format
    const streakCard: StreakCard = {
      id: updatedStreak.id,
      name: updatedStreak.name,
      icon: updatedStreak.icon,
      color: updatedStreak.color,
      category: updatedStreak.category,
      currentStreak: updatedStreak.current_streak,
      isActive: updatedStreak.is_active,
      displayOrder: updatedStreak.display_order,
      lastActivityDate: updatedStreak.last_activity_date || undefined
    }

    return NextResponse.json({
      success: true,
      streak: streakCard,
      message: `${streak.name} completed! Streak is now ${newCurrentStreak} days.`
    })

  } catch (error) {
    console.error('Error completing streak:', error)
    return NextResponse.json(
      { error: 'Failed to complete streak' },
      { status: 500 }
    )
  }
}