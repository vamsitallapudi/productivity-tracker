import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// POST /api/streaks/calculate - Recalculate streaks (for maintenance)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, recalculateAll = false } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get all daily activities for the user
    const { data: activities, error: activitiesError } = await supabase
      .from('daily_activities')
      .select('*')
      .eq('user_id', userId)
      .order('activity_date', { ascending: false })

    if (activitiesError) {
      throw activitiesError
    }

    if (!activities || activities.length === 0) {
      return NextResponse.json({
        message: 'No activities found for user',
        streak: {
          current_streak: 0,
          longest_streak: 0,
          last_activity_date: null,
          streak_start_date: null
        }
      })
    }

    // Calculate streaks from activities
    const streakData = calculateStreakFromActivities(activities)
    
    // Update or create streak record
    const { data: existingStreak, error: streakFetchError } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .eq('streak_type', 'daily')
      .single()

    if (streakFetchError && streakFetchError.code !== 'PGRST116') {
      throw streakFetchError
    }

    let updatedStreak
    if (existingStreak) {
      const { data, error } = await supabase
        .from('user_streaks')
        .update({
          current_streak: streakData.currentStreak,
          longest_streak: Math.max(existingStreak.longest_streak, streakData.longestStreak),
          last_activity_date: streakData.lastActivityDate,
          streak_start_date: streakData.streakStartDate
        })
        .eq('id', existingStreak.id)
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
          current_streak: streakData.currentStreak,
          longest_streak: streakData.longestStreak,
          last_activity_date: streakData.lastActivityDate,
          streak_start_date: streakData.streakStartDate
        })
        .select()
        .single()

      if (error) throw error
      updatedStreak = data
    }

    // If recalculateAll is true, also recalculate achievements
    let newAchievements = []
    if (recalculateAll) {
      newAchievements = await recalculateAchievements(userId, streakData, activities)
    }

    return NextResponse.json({
      success: true,
      streak: updatedStreak,
      streakData,
      newAchievements,
      message: 'Streak recalculated successfully'
    })

  } catch (error) {
    console.error('Error recalculating streak:', error)
    return NextResponse.json(
      { error: 'Failed to recalculate streak' },
      { status: 500 }
    )
  }
}

// Helper function to calculate streak from activities
function calculateStreakFromActivities(activities: any[]) {
  if (!activities || activities.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      streakStartDate: null
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Sort activities by date (most recent first)
  const sortedActivities = activities
    .filter(activity => activity.streak_eligible)
    .sort((a, b) => new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime())

  if (sortedActivities.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      streakStartDate: null
    }
  }

  const lastActivityDate = sortedActivities[0].activity_date

  // Calculate current streak (consecutive days from today backwards)
  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0
  let streakStartDate: string | null = null

  // Create a set of activity dates for quick lookup
  const activityDates = new Set(sortedActivities.map(a => a.activity_date))

  // Check current streak (starting from today or yesterday)
  let checkDate = new Date(today)
  let currentStreakStarted = false

  // If there's no activity today, check if there was activity yesterday
  const todayStr = today.toISOString().split('T')[0]
  const yesterdayStr = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  if (activityDates.has(todayStr)) {
    currentStreakStarted = true
  } else if (activityDates.has(yesterdayStr)) {
    currentStreakStarted = true
    checkDate = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  }

  if (currentStreakStarted) {
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0]
      if (activityDates.has(dateStr)) {
        currentStreak++
        if (currentStreak === 1) {
          streakStartDate = dateStr
        }
        checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000)
      } else {
        break
      }
    }
    
    // Update streak start date to be the earliest date of current streak
    if (currentStreak > 0) {
      const startDate = new Date(checkDate.getTime() + 24 * 60 * 60 * 1000)
      streakStartDate = startDate.toISOString().split('T')[0]
    }
  }

  // Calculate longest streak ever
  tempStreak = 0
  let maxStreak = 0
  
  // Go through all activities to find longest consecutive streak
  const allDates = sortedActivities.map(a => new Date(a.activity_date)).sort((a, b) => a.getTime() - b.getTime())
  
  for (let i = 0; i < allDates.length; i++) {
    if (i === 0) {
      tempStreak = 1
    } else {
      const prevDate = allDates[i - 1]
      const currentDate = allDates[i]
      const dayDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000))
      
      if (dayDiff === 1) {
        tempStreak++
      } else {
        maxStreak = Math.max(maxStreak, tempStreak)
        tempStreak = 1
      }
    }
  }
  maxStreak = Math.max(maxStreak, tempStreak)
  longestStreak = maxStreak

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    lastActivityDate,
    streakStartDate: currentStreak > 0 ? streakStartDate : null
  }
}

// Helper function to recalculate achievements
async function recalculateAchievements(userId: string, streakData: any, activities: any[]) {
  // This is a simplified version - in a real app you'd want to be more careful about duplicates
  const newAchievements = []
  
  // Get existing achievements
  const { data: existingAchievements } = await supabase
    .from('streak_achievements')
    .select('achievement_name')
    .eq('user_id', userId)

  const existingNames = new Set(existingAchievements?.map(a => a.achievement_name) || [])

  // Check milestone achievements
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

  for (const milestone of milestones) {
    if (streakData.longestStreak >= milestone.days && !existingNames.has(milestone.name)) {
      try {
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

        if (!error && data) {
          newAchievements.push(data)
        }
      } catch (error) {
        console.error('Error creating achievement:', error)
      }
    }
  }

  return newAchievements
}