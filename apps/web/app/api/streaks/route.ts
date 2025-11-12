import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { 
  Database, 
  UserStreak, 
  StreakAchievement, 
  DailyActivity,
  StreakCard,
  CreateStreakPayload 
} from '@/lib/database.types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET /api/streaks - Fetch all user streaks for grid display OR single streak data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const streakId = searchParams.get('streakId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // If streakId is provided, return single streak data (legacy support)
    if (streakId) {
      return getSingleStreakData(userId, streakId)
    }

    // Otherwise, return all user streaks for grid display
    const { data: streaks, error } = await supabase
      .from('user_streaks')
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
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching user streaks:', error)
      return NextResponse.json(
        { error: 'Failed to fetch streaks' },
        { status: 500 }
      )
    }

    // Transform to StreakCard format
    const streakCards: StreakCard[] = (streaks || []).map(streak => ({
      id: streak.id,
      name: streak.name,
      icon: streak.icon,
      color: streak.color,
      category: streak.category,
      currentStreak: streak.current_streak,
      isActive: streak.is_active,
      displayOrder: streak.display_order,
      lastActivityDate: streak.last_activity_date || undefined
    }))

    return NextResponse.json({
      success: true,
      streaks: streakCards
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function for single streak data (legacy support)
async function getSingleStreakData(userId: string, streakId?: string) {
  // Get current streak data
  let streakQuery = supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)

  if (streakId) {
    streakQuery = streakQuery.eq('id', streakId)
  } else {
    // Legacy: get first daily streak
    streakQuery = streakQuery.eq('streak_type', 'daily').limit(1)
  }

  const { data: streakData, error: streakError } = await streakQuery.single()

  if (streakError && streakError.code !== 'PGRST116') {
    throw streakError
  }

  // Get recent achievements
  const { data: achievements, error: achievementsError } = await supabase
    .from('streak_achievements')
    .select('*')
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false })
    .limit(10)

  if (achievementsError) {
    throw achievementsError
  }

  // Get recent daily activities (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  let activitiesQuery = supabase
    .from('daily_activities')
    .select('*')
    .eq('user_id', userId)
    .gte('activity_date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('activity_date', { ascending: false })

  // If we have a specific streak, filter activities for that streak
  if (streakData?.id) {
    activitiesQuery = activitiesQuery.eq('streak_id', streakData.id)
  }

  const { data: activities, error: activitiesError } = await activitiesQuery

  if (activitiesError) {
    throw activitiesError
  }

  return NextResponse.json({
    streak: streakData || {
      current_streak: 0,
      longest_streak: 0,
      last_activity_date: null,
      streak_start_date: null,
      freeze_count: 0
    },
    achievements: achievements || [],
    activities: activities || []
  })
}

// POST /api/streaks - Create new streak OR update streak data (called when session completes)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Check if this is a create streak request
    if (body.name && body.streak_type_id) {
      return createNewStreak(body)
    }
    
    // Otherwise, it's a session completion update (legacy)
    const { userId, sessionMinutes, sessionCount = 1, streakId } = body

    if (!userId || !sessionMinutes) {
      return NextResponse.json(
        { error: 'User ID and session minutes are required' },
        { status: 400 }
      )
    }

    const today = new Date().toISOString().split('T')[0]
    
    // Update or insert daily activity
    const { data: existingActivity, error: activityFetchError } = await supabase
      .from('daily_activities')
      .select('*')
      .eq('user_id', userId)
      .eq('activity_date', today)
      .single()

    if (activityFetchError && activityFetchError.code !== 'PGRST116') {
      throw activityFetchError
    }

    let activityData
    if (existingActivity) {
      // Update existing activity
      const { data, error } = await supabase
        .from('daily_activities')
        .update({
          session_count: existingActivity.session_count + sessionCount,
          total_minutes: existingActivity.total_minutes + sessionMinutes,
          streak_eligible: true // Mark as streak eligible if user completes sessions
        })
        .eq('id', existingActivity.id)
        .select()
        .single()

      if (error) throw error
      activityData = data
    } else {
      // Insert new activity
      const { data, error } = await supabase
        .from('daily_activities')
        .insert({
          user_id: userId,
          activity_date: today,
          session_count: sessionCount,
          total_minutes: sessionMinutes,
          streak_eligible: true
        })
        .select()
        .single()

      if (error) throw error
      activityData = data
    }

    // Calculate and update streak
    const streakResult = await calculateAndUpdateStreak(userId)
    
    return NextResponse.json({
      activity: activityData,
      streak: streakResult.streak,
      newAchievements: streakResult.newAchievements
    })

  } catch (error) {
    console.error('Error updating streak:', error)
    return NextResponse.json(
      { error: 'Failed to update streak' },
      { status: 500 }
    )
  }
}

// Helper function to create a new streak
async function createNewStreak(body: any) {
  const { userId, name, streak_type_id, icon, color, category, description } = body

  if (!userId || !name || !streak_type_id) {
    return NextResponse.json(
      { error: 'Missing required fields: userId, name, streak_type_id' },
      { status: 400 }
    )
  }

  // Check if streak name already exists for this user
  const { data: existingStreak } = await supabase
    .from('user_streaks')
    .select('id')
    .eq('user_id', userId)
    .eq('name', name)
    .single()

  if (existingStreak) {
    return NextResponse.json(
      { error: 'A streak with this name already exists' },
      { status: 409 }
    )
  }

  // Get the next display order
  const { data: maxOrderResult } = await supabase
    .from('user_streaks')
    .select('display_order')
    .eq('user_id', userId)
    .order('display_order', { ascending: false })
    .limit(1)
    .single()

  const nextOrder = (maxOrderResult?.display_order || 0) + 1

  // Create the new streak
  const { data: newStreak, error } = await supabase
    .from('user_streaks')
    .insert({
      user_id: userId,
      name,
      streak_type_id,
      streak_type: 'daily', // Default frequency
      icon,
      color,
      category,
      description,
      is_active: true,
      display_order: nextOrder,
      current_streak: 0,
      longest_streak: 0,
      freeze_count: 0
    })
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
    console.error('Error creating streak:', error)
    return NextResponse.json(
      { error: 'Failed to create streak' },
      { status: 500 }
    )
  }

  // Transform to StreakCard format
  const streakCard: StreakCard = {
    id: newStreak.id,
    name: newStreak.name,
    icon: newStreak.icon,
    color: newStreak.color,
    category: newStreak.category,
    currentStreak: newStreak.current_streak,
    isActive: newStreak.is_active,
    displayOrder: newStreak.display_order,
    lastActivityDate: newStreak.last_activity_date || undefined
  }

  return NextResponse.json({
    success: true,
    streak: streakCard
  })
}

// Helper function to calculate and update streak
async function calculateAndUpdateStreak(userId: string) {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  // Get current streak data
  const { data: currentStreak, error: streakError } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .eq('streak_type', 'daily')
    .single()

  if (streakError && streakError.code !== 'PGRST116') {
    throw streakError
  }

  // Get recent activities to calculate streak
  const { data: recentActivities, error: activitiesError } = await supabase
    .from('daily_activities')
    .select('*')
    .eq('user_id', userId)
    .eq('streak_eligible', true)
    .order('activity_date', { ascending: false })
    .limit(100) // Get enough data to calculate streak properly

  if (activitiesError) {
    throw activitiesError
  }

  // Calculate new streak
  let newStreakCount = 0
  let lastActivityDate: Date | null = null
  
  if (recentActivities && recentActivities.length > 0) {
    const sortedActivities = recentActivities.sort((a, b) => 
      new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime()
    )
    
    lastActivityDate = new Date(sortedActivities[0].activity_date)
    
    // Calculate consecutive days
    for (let i = 0; i < sortedActivities.length; i++) {
      const activityDate = new Date(sortedActivities[i].activity_date)
      const expectedDate = new Date(today)
      expectedDate.setDate(expectedDate.getDate() - i)
      
      // Check if activity date matches expected consecutive date
      if (activityDate.toDateString() === expectedDate.toDateString()) {
        newStreakCount++
      } else {
        break
      }
    }
  }

  const longestStreak = Math.max(currentStreak?.longest_streak || 0, newStreakCount)
  const streakStartDate = newStreakCount > 0 ? 
    (new Date(today.getTime() - (newStreakCount - 1) * 24 * 60 * 60 * 1000)).toISOString().split('T')[0] : 
    null

  // Update streak data
  let updatedStreak
  if (currentStreak) {
    const { data, error } = await supabase
      .from('user_streaks')
      .update({
        current_streak: newStreakCount,
        longest_streak: longestStreak,
        last_activity_date: lastActivityDate?.toISOString().split('T')[0] || null,
        streak_start_date: streakStartDate
      })
      .eq('id', currentStreak.id)
      .select()
      .single()

    if (error) throw error
    updatedStreak = data
  } else {
    const { data, error } = await supabase
      .from('user_streaks')
      .insert({
        user_id: userId,
        streak_type: 'daily',
        current_streak: newStreakCount,
        longest_streak: longestStreak,
        last_activity_date: lastActivityDate?.toISOString().split('T')[0] || null,
        streak_start_date: streakStartDate
      })
      .select()
      .single()

    if (error) throw error
    updatedStreak = data
  }

  // Check for new achievements
  const newAchievements = await checkAndUnlockAchievements(userId, newStreakCount, longestStreak)

  return {
    streak: updatedStreak,
    newAchievements
  }
}

// Helper function to check and unlock achievements
async function checkAndUnlockAchievements(userId: string, currentStreak: number, longestStreak: number) {
  const newAchievements: StreakAchievement[] = []
  
  // Get existing achievements to avoid duplicates
  const { data: existingAchievements, error: achievementsError } = await supabase
    .from('streak_achievements')
    .select('achievement_name')
    .eq('user_id', userId)

  if (achievementsError) {
    throw achievementsError
  }

  const existingNames = new Set(existingAchievements?.map(a => a.achievement_name) || [])

  // Define achievement thresholds
  const milestones = [
    { days: 1, name: 'First Streak', description: 'Completed your first day streak!' },
    { days: 3, name: 'Getting Started', description: 'Maintained a 3-day streak!' },
    { days: 7, name: 'Week Warrior', description: 'Maintained a 7-day streak!' },
    { days: 14, name: 'Two Week Champion', description: 'Maintained a 14-day streak!' },
    { days: 30, name: 'Month Master', description: 'Maintained a 30-day streak!' },
    { days: 50, name: 'Halfway Hero', description: 'Maintained a 50-day streak!' },
    { days: 100, name: 'Century Achiever', description: 'Maintained a 100-day streak!' },
    { days: 365, name: 'Year of Focus', description: 'Maintained a 365-day streak!' }
  ]

  // Check milestone achievements
  for (const milestone of milestones) {
    if (longestStreak >= milestone.days && !existingNames.has(milestone.name)) {
      const { data, error } = await supabase
        .from('streak_achievements')
        .insert({
          user_id: userId,
          achievement_type: 'milestone',
          achievement_name: milestone.name,
          metadata: {
            days: milestone.days,
            description: milestone.description,
            streak_type: 'daily'
          }
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating achievement:', error)
      } else {
        newAchievements.push(data)
      }
    }
  }

  return newAchievements
}