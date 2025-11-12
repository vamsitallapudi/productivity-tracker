import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database, StreakCard } from '@/lib/database.types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// POST /api/streaks/[id]/reset - Reset streak count to 0
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

    // Reset streak data
    const { data: updatedStreak, error: updateError } = await supabase
      .from('user_streaks')
      .update({
        current_streak: 0,
        last_activity_date: null,
        streak_start_date: null
        // Note: We don't reset longest_streak as it's a record
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
      message: `${streak.name} has been reset to 0 days.`
    })

  } catch (error) {
    console.error('Error resetting streak:', error)
    return NextResponse.json(
      { error: 'Failed to reset streak' },
      { status: 500 }
    )
  }
}