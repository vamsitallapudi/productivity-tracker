"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Flame, ArrowRight } from "lucide-react"

interface StreakSummaryProps {
  userId: string
  className?: string
}

export const StreakSummarySimple: React.FC<StreakSummaryProps> = ({ userId, className = "" }) => {
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [streakData, setStreakData] = useState<{
    currentStreak: number
    longestStreak: number
    totalSessions: number
    totalHours: number
  } | null>(null)

  // Fix hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Simple fetch without the service for now
    const fetchStreakData = async () => {
      try {
        const response = await fetch(`/api/streaks?userId=${userId}`)
        
        if (response.ok) {
          const data = await response.json()
          
          setStreakData({
            currentStreak: data.streak?.current_streak || 0,
            longestStreak: data.streak?.longest_streak || 0,
            totalSessions: data.activities?.length || 0,
            totalHours: Math.round((data.activities?.reduce((sum: number, activity: any) => sum + activity.total_minutes, 0) || 0) / 60)
          })
        } else {
          console.warn('Streak API not available, showing default data')
          
          // Even if API fails, show default data
          setStreakData({
            currentStreak: 0,
            longestStreak: 0,
            totalSessions: 0,
            totalHours: 0
          })
        }
      } catch (error) {
        console.error('Error loading streak data:', error)
        
        // Set default data even on error
        setStreakData({
          currentStreak: 0,
          longestStreak: 0,
          totalSessions: 0,
          totalHours: 0
        })
      } finally {
        setLoading(false)
      }
    }

    if (mounted && userId) {
      fetchStreakData()
    }
  }, [mounted, userId])

  // Don't render anything until hydration is complete
  if (!mounted) {
    return null
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

  const isActive = streakData && streakData.currentStreak > 0

  return (
    <Card className={`border-gray-200 dark:border-gray-700 dark:bg-gray-900 ${className}`}>
      <CardHeader className="pb-4 flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold dark:text-white">
            <Flame className={`w-5 h-5 ${isActive ? 'text-orange-500' : 'text-gray-400'}`} />
            Learning Streak
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            Track your learning consistency
          </CardDescription>
        </div>
        <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
          {isActive ? "Active" : "Inactive"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Streak Display */}
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-2xl font-bold text-orange-500">
            {streakData?.currentStreak || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {(streakData?.currentStreak || 0) === 1 ? 'Day Streak' : 'Days Streak'}
          </div>
          {(streakData?.currentStreak || 0) === 0 && (
            <div className="text-xs text-gray-500 mt-1">
              Complete a session to start your streak!
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <div className="font-semibold text-blue-600 dark:text-blue-400">
              {streakData?.longestStreak || 0}
            </div>
            <div className="text-gray-500 dark:text-gray-400">Longest</div>
          </div>
          <div>
            <div className="font-semibold text-green-600 dark:text-green-400">
              {streakData?.totalSessions || 0}
            </div>
            <div className="text-gray-500 dark:text-gray-400">Sessions</div>
          </div>
          <div>
            <div className="font-semibold text-purple-600 dark:text-purple-400">
              {streakData?.totalHours || 0}h
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