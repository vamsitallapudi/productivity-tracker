import { createClient } from '@supabase/supabase-js'
import type { 
  Database, 
  UserStreak, 
  DailyActivity, 
  StreakAchievement,
  StreakData,
  StreakStats
} from './database.types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Key for localStorage backup
const STREAK_BACKUP_KEY = 'focusflow-streak-backup'
const OFFLINE_SESSIONS_KEY = 'focusflow-offline-sessions'

export class StreakService {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  /**
   * Record a session completion and update streak data
   */
  async recordSession(sessionMinutes: number, sessionCount: number = 1): Promise<{
    activity: DailyActivity
    streak: UserStreak
    newAchievements: StreakAchievement[]
  } | null> {
    try {
      // Try online update first
      const response = await fetch('/api/streaks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.userId,
          sessionMinutes,
          sessionCount
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Clear any offline backup since we successfully synced
        this.clearOfflineBackup()
        return data
      } else {
        throw new Error('API call failed')
      }
    } catch (error) {
      console.warn('Failed to record session online, storing offline:', error)
      // Store session data offline for later sync
      this.storeOfflineSession(sessionMinutes, sessionCount)
      return null
    }
  }

  /**
   * Get current streak data
   */
  async getStreakData(): Promise<{
    streak: UserStreak | null
    achievements: StreakAchievement[]
    activities: DailyActivity[]
  }> {
    try {
      const response = await fetch(`/api/streaks?userId=${this.userId}`)
      
      if (response.ok) {
        const data = await response.json()
        // Update local backup
        this.updateLocalBackup(data.streak)
        return data
      } else {
        throw new Error('API call failed')
      }
    } catch (error) {
      console.warn('Failed to fetch streak data online, using local backup:', error)
      return this.getLocalBackup()
    }
  }

  /**
   * Calculate streak statistics
   */
  async getStreakStats(): Promise<StreakStats> {
    const { streak, activities } = await this.getStreakData()
    
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const recentActivities = activities.filter(activity => 
      new Date(activity.activity_date) >= thirtyDaysAgo
    )
    const weeklyActivities = activities.filter(activity => 
      new Date(activity.activity_date) >= sevenDaysAgo
    )

    const totalSessions = recentActivities.reduce((sum, activity) => sum + activity.session_count, 0)
    const totalMinutes = recentActivities.reduce((sum, activity) => sum + activity.total_minutes, 0)
    const totalDays = recentActivities.length

    const weeklyMinutes = weeklyActivities.reduce((sum, activity) => sum + activity.total_minutes, 0)
    const weeklyAverage = weeklyActivities.length > 0 ? weeklyMinutes / weeklyActivities.length : 0
    const monthlyAverage = totalDays > 0 ? totalMinutes / totalDays : 0

    return {
      current: streak?.current_streak || 0,
      longest: streak?.longest_streak || 0,
      totalDays,
      totalSessions,
      totalMinutes,
      weeklyAverage,
      monthlyAverage
    }
  }

  /**
   * Use a streak freeze token
   */
  async useStreakFreeze(days: number = 1): Promise<{
    success: boolean
    tokensRemaining: number
    message: string
  }> {
    try {
      const response = await fetch('/api/streaks/freeze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.userId,
          days
        })
      })

      if (response.ok) {
        const data = await response.json()
        return {
          success: data.success,
          tokensRemaining: data.freezeTokensRemaining,
          message: data.message
        }
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to use streak freeze')
      }
    } catch (error) {
      console.error('Error using streak freeze:', error)
      return {
        success: false,
        tokensRemaining: 0,
        message: 'Failed to use streak freeze. Please try again.'
      }
    }
  }

  /**
   * Get freeze token status
   */
  async getFreezeStatus(): Promise<{
    tokensUsed: number
    tokensRemaining: number
    canUseFreeze: boolean
  }> {
    try {
      const response = await fetch(`/api/streaks/freeze?userId=${this.userId}`)
      
      if (response.ok) {
        const data = await response.json()
        return {
          tokensUsed: data.freezeTokensUsed,
          tokensRemaining: data.freezeTokensRemaining,
          canUseFreeze: data.canUseFreeze
        }
      } else {
        throw new Error('API call failed')
      }
    } catch (error) {
      console.warn('Failed to fetch freeze status:', error)
      return {
        tokensUsed: 0,
        tokensRemaining: 3,
        canUseFreeze: true
      }
    }
  }

  /**
   * Get achievements
   */
  async getAchievements(type?: 'milestone' | 'consistency' | 'special'): Promise<{
    achievements: StreakAchievement[]
    stats: {
      total: number
      milestone: number
      consistency: number
      special: number
    }
    availableAchievements: any[]
  }> {
    try {
      const url = type 
        ? `/api/streaks/achievements?userId=${this.userId}&type=${type}`
        : `/api/streaks/achievements?userId=${this.userId}`
      
      const response = await fetch(url)
      
      if (response.ok) {
        return await response.json()
      } else {
        throw new Error('API call failed')
      }
    } catch (error) {
      console.warn('Failed to fetch achievements:', error)
      return {
        achievements: [],
        stats: { total: 0, milestone: 0, consistency: 0, special: 0 },
        availableAchievements: []
      }
    }
  }

  /**
   * Recalculate streak data (maintenance function)
   */
  async recalculateStreak(recalculateAll: boolean = false): Promise<{
    success: boolean
    streak: UserStreak | null
    message: string
  }> {
    try {
      const response = await fetch('/api/streaks/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.userId,
          recalculateAll
        })
      })

      if (response.ok) {
        const data = await response.json()
        return {
          success: data.success,
          streak: data.streak,
          message: data.message
        }
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to recalculate streak')
      }
    } catch (error) {
      console.error('Error recalculating streak:', error)
      return {
        success: false,
        streak: null,
        message: 'Failed to recalculate streak. Please try again.'
      }
    }
  }

  /**
   * Sync offline sessions when connection is restored
   */
  async syncOfflineSessions(): Promise<number> {
    const offlineSessions = this.getOfflineSessions()
    let syncedCount = 0

    for (const session of offlineSessions) {
      try {
        await this.recordSession(session.minutes, session.count)
        syncedCount++
      } catch (error) {
        console.error('Failed to sync offline session:', error)
        break
      }
    }

    if (syncedCount > 0) {
      // Remove synced sessions
      const remainingSessions = offlineSessions.slice(syncedCount)
      localStorage.setItem(OFFLINE_SESSIONS_KEY, JSON.stringify(remainingSessions))
    }

    return syncedCount
  }

  /**
   * Check if there are offline sessions to sync
   */
  hasOfflineSessions(): boolean {
    const sessions = this.getOfflineSessions()
    return sessions.length > 0
  }

  // Private helper methods

  private storeOfflineSession(minutes: number, count: number): void {
    const sessions = this.getOfflineSessions()
    sessions.push({
      minutes,
      count,
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0]
    })
    localStorage.setItem(OFFLINE_SESSIONS_KEY, JSON.stringify(sessions))
  }

  private getOfflineSessions(): Array<{
    minutes: number
    count: number
    timestamp: string
    date: string
  }> {
    try {
      const stored = localStorage.getItem(OFFLINE_SESSIONS_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  private updateLocalBackup(streak: UserStreak | null): void {
    if (streak) {
      localStorage.setItem(STREAK_BACKUP_KEY, JSON.stringify({
        streak,
        lastUpdated: new Date().toISOString()
      }))
    }
  }

  private getLocalBackup(): {
    streak: UserStreak | null
    achievements: StreakAchievement[]
    activities: DailyActivity[]
  } {
    try {
      const stored = localStorage.getItem(STREAK_BACKUP_KEY)
      if (stored) {
        const { streak } = JSON.parse(stored)
        return {
          streak,
          achievements: [],
          activities: []
        }
      }
    } catch {
      // Ignore errors
    }

    return {
      streak: null,
      achievements: [],
      activities: []
    }
  }

  private clearOfflineBackup(): void {
    localStorage.removeItem(OFFLINE_SESSIONS_KEY)
  }
}

// Utility functions for calculating streak data
export function calculateStreakIntensity(sessionCount: number, totalMinutes: number): 'none' | 'low' | 'medium' | 'high' {
  if (sessionCount === 0 || totalMinutes === 0) return 'none'
  if (totalMinutes < 30) return 'low'
  if (totalMinutes < 90) return 'medium'
  return 'high'
}

export function formatStreakData(streak: UserStreak | null): StreakData {
  return {
    currentStreak: streak?.current_streak || 0,
    longestStreak: streak?.longest_streak || 0,
    lastActivityDate: streak?.last_activity_date || undefined,
    streakStartDate: streak?.streak_start_date || undefined,
    freezeCount: streak?.freeze_count || 0,
    streakType: (streak?.streak_type as any) || 'daily'
  }
}

export function isStreakActive(streak: UserStreak | null): boolean {
  if (!streak || !streak.last_activity_date) return false
  
  const lastActivity = new Date(streak.last_activity_date)
  const today = new Date()
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  
  // Normalize dates to compare only date parts
  lastActivity.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  yesterday.setHours(0, 0, 0, 0)
  
  // Streak is active if last activity was today or yesterday
  return lastActivity.getTime() === today.getTime() || 
         lastActivity.getTime() === yesterday.getTime()
}

export function getStreakMessage(streak: UserStreak | null): string {
  if (!streak || streak.current_streak === 0) {
    return "Start your learning streak today!"
  }
  
  const isActive = isStreakActive(streak)
  const current = streak.current_streak
  
  if (!isActive) {
    return "Your streak has ended. Start a new one!"
  }
  
  if (current === 1) {
    return "Great start! Keep going to build your streak!"
  }
  
  if (current < 7) {
    return `${current} days strong! You're building momentum!`
  }
  
  if (current < 30) {
    return `Amazing! ${current} days of consistency!`
  }
  
  return `Incredible! ${current} days of dedicated learning!`
}