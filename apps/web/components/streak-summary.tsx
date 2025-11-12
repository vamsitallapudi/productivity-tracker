"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Flame, ArrowRight, Trophy, Target, TrendingUp } from "lucide-react"
import { StreakService, formatStreakData, isStreakActive, getStreakMessage } from "@/lib/streak-service"
import type { UserStreak, StreakStats } from "@/lib/database.types"

interface StreakSummaryProps {
  userId: string
  className?: string
}

export const StreakSummary: React.FC<StreakSummaryProps> = ({ userId, className = "" }) => {
  const [streakData, setStreakData] = useState<UserStreak | null>(null)
  const [stats, setStats] = useState<StreakStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const streakService = new StreakService(userId)

  useEffect(() => {
    if (userId) {
      loadStreakSummary()
    }
  }, [userId])

  const loadStreakSummary = async () => {
    try {
      setLoading(true)
      setError(null)

      const [streakResult, statsResult] = await Promise.all([
        streakService.getStreakData(),
        streakService.getStreakStats()
      ])

      setStreakData(streakResult.streak)
      setStats(statsResult)

    } catch (err) {
      console.error('Error loading streak summary:', err)
      setError('Failed to load streak data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className={`border-gray-200 dark:border-gray-700 dark:bg-gray-900 ${className}`}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold dark:text-white">
            <Flame className="w-5 h-5 text-gray-400" />
            Learning Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`border-gray-200 dark:border-gray-700 dark:bg-gray-900 ${className}`}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold dark:text-white">
            <Flame className="w-5 h-5 text-orange-500" />
            Learning Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <Button onClick={loadStreakSummary} size="sm" className="mt-2">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  const formattedStreak = formatStreakData(streakData)
  const streakActive = isStreakActive(streakData)
  const streakMsg = getStreakMessage(streakData)

  return (
    <Card className={`border-gray-200 dark:border-gray-700 dark:bg-gray-900 ${className}`}>
      <CardHeader className="pb-4 flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold dark:text-white">
            <Flame className={`w-5 h-5 ${streakActive ? 'text-orange-500' : 'text-gray-400'}`} />
            Learning Streak
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            Track your learning consistency
          </CardDescription>
        </div>
        <Badge variant={streakActive ? "default" : "secondary"} className="text-xs">
          {streakActive ? "Active" : "Inactive"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Streak Display */}
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-2xl font-bold text-orange-500">
            {formattedStreak.currentStreak}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {formattedStreak.currentStreak === 1 ? 'Day Streak' : 'Days Streak'}
          </div>
        </div>

        {/* Streak Message */}
        <p className="text-sm text-center text-gray-700 dark:text-gray-300">
          {streakMsg}
        </p>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <div className="font-semibold text-blue-600 dark:text-blue-400">
              {formattedStreak.longestStreak}
            </div>
            <div className="text-gray-500 dark:text-gray-400">Longest</div>
          </div>
          <div>
            <div className="font-semibold text-green-600 dark:text-green-400">
              {stats?.totalSessions || 0}
            </div>
            <div className="text-gray-500 dark:text-gray-400">Sessions</div>
          </div>
          <div>
            <div className="font-semibold text-purple-600 dark:text-purple-400">
              {Math.round((stats?.totalMinutes || 0) / 60)}h
            </div>
            <div className="text-gray-500 dark:text-gray-400">Total</div>
          </div>
        </div>

        {/* Action Button */}
        <Link href="/streaks">
          <Button variant="outline" size="sm" className="w-full gap-2 bg-transparent dark:border-gray-600 dark:text-gray-300">
            View Details
            <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}