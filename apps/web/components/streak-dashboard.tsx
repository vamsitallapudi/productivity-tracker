"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Flame, 
  Trophy, 
  Calendar, 
  Target, 
  Zap, 
  Star,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  Snowflake,
  BarChart3,
  Gift
} from "lucide-react"
import { StreakService, formatStreakData, isStreakActive, getStreakMessage } from "@/lib/streak-service"
import type { 
  UserStreak, 
  StreakAchievement, 
  DailyActivity, 
  StreakStats,
  StreakCalendarData 
} from "@/lib/database.types"

interface StreakDashboardProps {
  userId: string
  className?: string
}

interface CalendarHeatmapProps {
  activities: DailyActivity[]
  className?: string
}

// Calendar heatmap component for showing daily activity intensity
const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({ activities, className = "" }) => {
  const today = new Date()
  const days = []
  
  // Generate last 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    days.push(date)
  }

  const getActivityForDate = (date: Date): DailyActivity | undefined => {
    const dateStr = date.toISOString().split('T')[0]
    return activities.find(activity => activity.activity_date === dateStr)
  }

  const getIntensityClass = (activity?: DailyActivity): string => {
    if (!activity || activity.total_minutes === 0) return "bg-gray-100 dark:bg-gray-800"
    if (activity.total_minutes < 30) return "bg-green-200 dark:bg-green-900"
    if (activity.total_minutes < 90) return "bg-green-400 dark:bg-green-700"
    return "bg-green-600 dark:bg-green-500"
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Last 30 Days</h4>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-gray-100 dark:bg-gray-800 rounded-sm"></div>
            <div className="w-2 h-2 bg-green-200 dark:bg-green-900 rounded-sm"></div>
            <div className="w-2 h-2 bg-green-400 dark:bg-green-700 rounded-sm"></div>
            <div className="w-2 h-2 bg-green-600 dark:bg-green-500 rounded-sm"></div>
          </div>
          <span>More</span>
        </div>
      </div>
      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(15, minmax(0, 1fr))' }}>
        {days.map((date, index) => {
          const activity = getActivityForDate(date)
          const isToday = date.toDateString() === today.toDateString()
          
          return (
            <div
              key={index}
              className={`
                w-3 h-3 rounded-sm cursor-pointer transition-all hover:scale-110
                ${getIntensityClass(activity)}
                ${isToday ? 'ring-2 ring-blue-500' : ''}
              `}
              title={`${date.toLocaleDateString()}: ${activity ? `${activity.session_count} sessions, ${activity.total_minutes} minutes` : 'No activity'}`}
            />
          )
        })}
      </div>
    </div>
  )
}

// Progress ring component for circular progress indicators
const ProgressRing: React.FC<{
  progress: number
  size?: number
  strokeWidth?: number
  children?: React.ReactNode
  className?: string
}> = ({ progress, size = 120, strokeWidth = 8, children, className = "" }) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-blue-500 transition-all duration-300"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}

// Achievement badge component
const AchievementBadge: React.FC<{
  achievement: StreakAchievement
  onClick?: () => void
}> = ({ achievement, onClick }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'milestone': return <Trophy className="w-4 h-4" />
      case 'consistency': return <Target className="w-4 h-4" />
      case 'special': return <Star className="w-4 h-4" />
      default: return <Award className="w-4 h-4" />
    }
  }

  const getColor = (type: string) => {
    switch (type) {
      case 'milestone': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'consistency': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'special': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div
      className={`
        flex items-center gap-2 p-3 rounded-lg border cursor-pointer
        transition-all hover:shadow-md hover:scale-105
        ${getColor(achievement.achievement_type)}
      `}
      onClick={onClick}
      title={achievement.metadata?.description || achievement.achievement_name}
    >
      {getIcon(achievement.achievement_type)}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{achievement.achievement_name}</div>
        <div className="text-xs opacity-70">
          {new Date(achievement.unlocked_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}

export const StreakDashboard: React.FC<StreakDashboardProps> = ({ userId, className = "" }) => {
  const [streakData, setStreakData] = useState<UserStreak | null>(null)
  const [achievements, setAchievements] = useState<StreakAchievement[]>([])
  const [activities, setActivities] = useState<DailyActivity[]>([])
  const [stats, setStats] = useState<StreakStats | null>(null)
  const [freezeStatus, setFreezeStatus] = useState<{
    tokensUsed: number
    tokensRemaining: number
    canUseFreeze: boolean
  }>({ tokensUsed: 0, tokensRemaining: 3, canUseFreeze: true })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const streakService = new StreakService(userId)

  useEffect(() => {
    loadStreakData()
  }, [userId])

  const loadStreakData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load all streak data
      const [streakResult, achievementsResult, statsResult, freezeResult] = await Promise.all([
        streakService.getStreakData(),
        streakService.getAchievements(),
        streakService.getStreakStats(),
        streakService.getFreezeStatus()
      ])

      setStreakData(streakResult.streak)
      setAchievements(achievementsResult.achievements.slice(0, 6)) // Show latest 6
      setActivities(streakResult.activities)
      setStats(statsResult)
      setFreezeStatus(freezeResult)

    } catch (err) {
      console.error('Error loading streak data:', err)
      setError('Failed to load streak data')
    } finally {
      setLoading(false)
    }
  }

  const handleUseFreeze = async () => {
    try {
      const result = await streakService.useStreakFreeze(1)
      if (result.success) {
        // Refresh freeze status
        const newFreezeStatus = await streakService.getFreezeStatus()
        setFreezeStatus(newFreezeStatus)
        // You could show a success notification here
      }
    } catch (err) {
      console.error('Error using freeze:', err)
    }
  }

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{error}</p>
            <Button onClick={loadStreakData} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const formattedStreak = formatStreakData(streakData)
  const streakActive = isStreakActive(streakData)
  const streakMsg = getStreakMessage(streakData)

  // Calculate weekly and monthly progress
  const weeklyGoal = 7 // 7 days
  const monthlyGoal = 30 // 30 days
  const weeklyProgress = Math.min(100, (formattedStreak.currentStreak / weeklyGoal) * 100)
  const monthlyProgress = Math.min(100, (formattedStreak.currentStreak / monthlyGoal) * 100)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Current Streak Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Flame className={`w-6 h-6 ${streakActive ? 'text-orange-500' : 'text-gray-400'}`} />
                Learning Streak
              </CardTitle>
              <CardDescription>{streakMsg}</CardDescription>
            </div>
            <Badge variant={streakActive ? "default" : "secondary"}>
              {streakActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Current Streak */}
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-500">
                {formattedStreak.currentStreak}
              </div>
              <div className="text-sm text-muted-foreground">Current Streak</div>
            </div>

            {/* Longest Streak */}
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500">
                {formattedStreak.longestStreak}
              </div>
              <div className="text-sm text-muted-foreground">Longest Streak</div>
            </div>

            {/* Total Sessions */}
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500">
                {stats?.totalSessions || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Sessions</div>
            </div>

            {/* Freeze Tokens */}
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-500">
                {freezeStatus.tokensRemaining}
              </div>
              <div className="text-sm text-muted-foreground">Freeze Tokens</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Progress Rings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Progress Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              {/* Weekly Progress */}
              <div className="text-center">
                <ProgressRing progress={weeklyProgress} size={100}>
                  <div className="text-center">
                    <div className="text-lg font-bold">{Math.round(weeklyProgress)}%</div>
                    <div className="text-xs text-muted-foreground">Weekly</div>
                  </div>
                </ProgressRing>
                <div className="mt-2 text-sm text-muted-foreground">
                  {formattedStreak.currentStreak} / {weeklyGoal} days
                </div>
              </div>

              {/* Monthly Progress */}
              <div className="text-center">
                <ProgressRing progress={monthlyProgress} size={100}>
                  <div className="text-center">
                    <div className="text-lg font-bold">{Math.round(monthlyProgress)}%</div>
                    <div className="text-xs text-muted-foreground">Monthly</div>
                  </div>
                </ProgressRing>
                <div className="mt-2 text-sm text-muted-foreground">
                  {formattedStreak.currentStreak} / {monthlyGoal} days
                </div>
              </div>
            </div>

            {/* Freeze Button */}
            {freezeStatus.canUseFreeze && (
              <div className="mt-6 pt-4 border-t">
                <Button 
                  onClick={handleUseFreeze}
                  variant="outline"
                  className="w-full"
                  disabled={!freezeStatus.canUseFreeze}
                >
                  <Snowflake className="w-4 h-4 mr-2" />
                  Use Streak Freeze ({freezeStatus.tokensRemaining} left)
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Protect your streak for a day when you can't complete sessions
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Activity Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CalendarHeatmap activities={activities} />
            
            {/* Activity Stats */}
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Weekly Average</div>
                <div className="font-medium">{Math.round(stats?.weeklyAverage || 0)} min/day</div>
              </div>
              <div>
                <div className="text-muted-foreground">Monthly Average</div>
                <div className="font-medium">{Math.round(stats?.monthlyAverage || 0)} min/day</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Achievements */}
      {achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Recent Achievements
            </CardTitle>
            <CardDescription>
              Your latest milestones and accomplishments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {achievements.map((achievement) => (
                <AchievementBadge 
                  key={achievement.id} 
                  achievement={achievement}
                  onClick={() => {
                    // You could open an achievement detail modal here
                    console.log('Achievement clicked:', achievement)
                  }}
                />
              ))}
            </div>
            
            {achievements.length >= 6 && (
              <div className="mt-4 text-center">
                <Button variant="outline" size="sm">
                  <Gift className="w-4 h-4 mr-2" />
                  View All Achievements
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}