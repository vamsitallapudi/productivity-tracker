import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { 
  Database, 
  StreakCard,
  UpdateStreakPayload 
} from '@/lib/database.types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET /api/streaks/[id] - Get individual streak details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: streakId } = await params

    // Get full streak data
    const { data: streak, error } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('id', streakId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Streak not found' },
          { status: 404 }
        )
      }
      throw error
    }

    // Get recent activities for this streak (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data: activities, error: activitiesError } = await supabase
      .from('daily_activities')
      .select('*')
      .eq('streak_id', streakId)
      .gte('activity_date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('activity_date', { ascending: false })

    if (activitiesError) {
      throw activitiesError
    }

    // Get achievements for this streak
    const { data: achievements, error: achievementsError } = await supabase
      .from('streak_achievements')
      .select('*')
      .eq('streak_id', streakId)
      .order('unlocked_at', { ascending: false })

    if (achievementsError) {
      throw achievementsError
    }

    return NextResponse.json({
      success: true,
      streak,
      activities: activities || [],
      achievements: achievements || []
    })

  } catch (error) {
    console.error('Error fetching streak details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch streak details' },
      { status: 500 }
    )
  }
}

// PUT /api/streaks/[id] - Update streak properties
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: streakId } = await params
    const body = await request.json()
    const { name, icon, color, description } = body as UpdateStreakPayload

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Streak name is required' },
        { status: 400 }
      )
    }

    // Check if the streak exists
    const { data: existingStreak, error: fetchError } = await supabase
      .from('user_streaks')
      .select('user_id, name')
      .eq('id', streakId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Streak not found' },
          { status: 404 }
        )
      }
      throw fetchError
    }

    // Check if name is being changed and if new name conflicts
    if (name !== existingStreak.name) {
      const { data: nameConflict } = await supabase
        .from('user_streaks')
        .select('id')
        .eq('user_id', existingStreak.user_id)
        .eq('name', name)
        .neq('id', streakId)
        .single()

      if (nameConflict) {
        return NextResponse.json(
          { error: 'A streak with this name already exists' },
          { status: 409 }
        )
      }
    }

    // Update the streak
    const updateData: any = { name: name.trim() }
    if (icon) updateData.icon = icon
    if (color) updateData.color = color
    if (description !== undefined) updateData.description = description

    const { data: updatedStreak, error } = await supabase
      .from('user_streaks')
      .update(updateData)
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

    if (error) {
      console.error('Error updating streak:', error)
      return NextResponse.json(
        { error: 'Failed to update streak' },
        { status: 500 }
      )
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
      streak: streakCard
    })

  } catch (error) {
    console.error('Error updating streak:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/streaks/[id] - Delete a streak
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: streakId } = await params

    // Check if the streak exists
    const { data: existingStreak, error: fetchError } = await supabase
      .from('user_streaks')
      .select('id, name')
      .eq('id', streakId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Streak not found' },
          { status: 404 }
        )
      }
      throw fetchError
    }

    // Soft delete by setting is_active to false
    // This preserves data for potential recovery
    const { error } = await supabase
      .from('user_streaks')
      .update({ is_active: false })
      .eq('id', streakId)

    if (error) {
      console.error('Error deleting streak:', error)
      return NextResponse.json(
        { error: 'Failed to delete streak' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Streak deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting streak:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}