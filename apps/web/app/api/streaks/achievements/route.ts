import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database, StreakAchievement } from '@/lib/database.types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET /api/streaks/achievements - Get all achievements for user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const type = searchParams.get('type') // Filter by achievement type
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('streak_achievements')
      .select('*')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false })
      .limit(limit)

    if (type) {
      query = query.eq('achievement_type', type)
    }

    const { data: achievements, error } = await query

    if (error) {
      throw error
    }

    // Get achievement stats
    const { data: stats, error: statsError } = await supabase
      .from('streak_achievements')
      .select('achievement_type')
      .eq('user_id', userId)

    if (statsError) {
      throw statsError
    }

    const achievementStats = {
      total: stats?.length || 0,
      milestone: stats?.filter(a => a.achievement_type === 'milestone').length || 0,
      consistency: stats?.filter(a => a.achievement_type === 'consistency').length || 0,
      special: stats?.filter(a => a.achievement_type === 'special').length || 0
    }

    // Add available achievements (not yet unlocked)
    const availableAchievements = getAvailableAchievements()
    const unlockedNames = new Set(achievements?.map(a => a.achievement_name) || [])
    const lockedAchievements = availableAchievements.filter(
      achievement => !unlockedNames.has(achievement.name)
    )

    return NextResponse.json({
      achievements: achievements || [],
      stats: achievementStats,
      availableAchievements: lockedAchievements
    })

  } catch (error) {
    console.error('Error fetching achievements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    )
  }
}

// Helper function to get all available achievements
function getAvailableAchievements() {
  return [
    // Milestone achievements
    {
      name: 'First Streak',
      type: 'milestone',
      description: 'Completed your first day streak!',
      icon: '🎯',
      requirement: '1 day streak',
      points: 10
    },
    {
      name: 'Getting Started',
      type: 'milestone',
      description: 'Maintained a 3-day streak!',
      icon: '🚀',
      requirement: '3 day streak',
      points: 30
    },
    {
      name: 'Week Warrior',
      type: 'milestone',
      description: 'Maintained a 7-day streak!',
      icon: '⚔️',
      requirement: '7 day streak',
      points: 70
    },
    {
      name: 'Two Week Champion',
      type: 'milestone',
      description: 'Maintained a 14-day streak!',
      icon: '🏆',
      requirement: '14 day streak',
      points: 140
    },
    {
      name: 'Month Master',
      type: 'milestone',
      description: 'Maintained a 30-day streak!',
      icon: '👑',
      requirement: '30 day streak',
      points: 300
    },
    {
      name: 'Halfway Hero',
      type: 'milestone',
      description: 'Maintained a 50-day streak!',
      icon: '⭐',
      requirement: '50 day streak',
      points: 500
    },
    {
      name: 'Century Achiever',
      type: 'milestone',
      description: 'Maintained a 100-day streak!',
      icon: '💯',
      requirement: '100 day streak',
      points: 1000
    },
    {
      name: 'Year of Focus',
      type: 'milestone',
      description: 'Maintained a 365-day streak!',
      icon: '🌟',
      requirement: '365 day streak',
      points: 3650
    },
    // Consistency achievements
    {
      name: 'Weekend Warrior',
      type: 'consistency',
      description: 'Maintained your streak through the weekend!',
      icon: '🌅',
      requirement: 'Focus session on Saturday and Sunday',
      points: 50
    },
    {
      name: 'Early Bird',
      type: 'consistency',
      description: 'Completed morning sessions 5 days in a row!',
      icon: '🐦',
      requirement: 'Sessions before 10 AM for 5 days',
      points: 100
    },
    {
      name: 'Night Owl',
      type: 'consistency',
      description: 'Completed evening sessions 5 days in a row!',
      icon: '🦉',
      requirement: 'Sessions after 8 PM for 5 days',
      points: 100
    },
    {
      name: 'Marathon Master',
      type: 'consistency',
      description: 'Completed sessions over 2 hours in a single day!',
      icon: '🏃',
      requirement: 'Total daily sessions > 2 hours',
      points: 150
    },
    // Special achievements
    {
      name: 'Freeze Master',
      type: 'special',
      description: 'Used your first streak freeze token wisely!',
      icon: '🧊',
      requirement: 'Use a streak freeze',
      points: 25
    },
    {
      name: 'Comeback Kid',
      type: 'special',
      description: 'Started a new streak after breaking one!',
      icon: '💪',
      requirement: 'Start new streak after breaking previous',
      points: 75
    },
    {
      name: 'Perfectionist',
      type: 'special',
      description: 'Completed 100% of planned sessions for 7 days!',
      icon: '✨',
      requirement: 'Meet daily goals for 7 consecutive days',
      points: 200
    },
    {
      name: 'Social Sharer',
      type: 'special',
      description: 'Shared your streak achievement on social media!',
      icon: '📱',
      requirement: 'Share streak on social media',
      points: 50
    }
  ]
}