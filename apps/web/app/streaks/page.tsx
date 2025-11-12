"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StreakGridDashboard } from "@/components/streak-grid-dashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Flame, 
  Trophy, 
  Target, 
  Star, 
  Info,
  TrendingUp,
  Calendar,
  Gift,
  RefreshCw,
  Users
} from "lucide-react"
import { StreakService } from "@/lib/streak-service"
import { supabase } from "@/lib/supabase"

interface Achievement {
  id: string
  name: string
  type: 'milestone' | 'consistency' | 'special'
  description: string
  icon: string
  requirement: string
  points: number
  unlocked?: boolean
  unlockedAt?: string
}

export default function StreaksPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([])
  const [achievementStats, setAchievementStats] = useState<{
    total: number
    milestone: number
    consistency: number
    special: number
  }>({ total: 0, milestone: 0, consistency: 0, special: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("dashboard")

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      // Get user ID from database (using alex@example.com for now)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', 'alex@example.com')
        .single()

      if (userError) throw userError

      setUserId(userData.id)

      // Fetch achievement data
      if (userData.id) {
        const streakService = new StreakService(userData.id)
        const achievementsData = await streakService.getAchievements()
        
        // Merge unlocked achievements with available achievements
        const unlockedNames = new Set(achievementsData.achievements.map(a => a.achievement_name))
        
        const mergedAchievements = achievementsData.availableAchievements.map(available => ({
          id: available.name,
          name: available.name,
          type: available.type as 'milestone' | 'consistency' | 'special',
          description: available.description,
          icon: available.icon,
          requirement: available.requirement,
          points: available.points,
          unlocked: unlockedNames.has(available.name),
          unlockedAt: achievementsData.achievements.find(a => a.achievement_name === available.name)?.unlocked_at
        }))

        setAllAchievements(mergedAchievements)
        setAchievementStats(achievementsData.stats)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRecalculateStreak = async () => {
    if (!userId) return
    
    try {
      const streakService = new StreakService(userId)
      await streakService.recalculateStreak(true)
      // Refresh the page data
      window.location.reload()
    } catch (error) {
      console.error('Error recalculating streak:', error)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Learning Streaks</h1>
              <p className="text-muted-foreground mt-2">
                Track your consistency and unlock achievements
              </p>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!userId) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Unable to load user data. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    )
  }

  const getAchievementIcon = (iconStr: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      '🎯': <Target className="w-5 h-5" />,
      '🚀': <TrendingUp className="w-5 h-5" />,
      '⚔️': <Trophy className="w-5 h-5" />,
      '🏆': <Trophy className="w-5 h-5" />,
      '👑': <Star className="w-5 h-5" />,
      '⭐': <Star className="w-5 h-5" />,
      '💯': <Trophy className="w-5 h-5" />,
      '🌟': <Star className="w-5 h-5" />,
      '🌅': <Calendar className="w-5 h-5" />,
      '🐦': <Calendar className="w-5 h-5" />,
      '🦉': <Calendar className="w-5 h-5" />,
      '🏃': <TrendingUp className="w-5 h-5" />,
      '🧊': <Target className="w-5 h-5" />,
      '💪': <TrendingUp className="w-5 h-5" />,
      '✨': <Star className="w-5 h-5" />,
      '📱': <Gift className="w-5 h-5" />
    }
    
    return iconMap[iconStr] || <Trophy className="w-5 h-5" />
  }

  const getTypeColor = (type: string, unlocked: boolean) => {
    if (!unlocked) return "text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
    
    switch (type) {
      case 'milestone': return "text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
      case 'consistency': return "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
      case 'special': return "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
      default: return "text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
    }
  }

  const filterAchievements = (type?: string) => {
    return allAchievements.filter(achievement => 
      !type || achievement.type === type
    ).sort((a, b) => {
      // Sort by unlocked status (unlocked first), then by name
      if (a.unlocked && !b.unlocked) return -1
      if (!a.unlocked && b.unlocked) return 1
      return a.name.localeCompare(b.name)
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Flame className="w-8 h-8 text-orange-500" />
              My Streaks
            </h1>
            <p className="text-muted-foreground mt-2">
              Track multiple goals, build consistency, and unlock achievements
            </p>
          </div>
          <Button onClick={handleRecalculateStreak} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Recalculate
          </Button>
        </div>

        {/* Achievement Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold">{achievementStats.total}</div>
                  <div className="text-sm text-muted-foreground">Total Unlocked</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-yellow-600" />
                <div>
                  <div className="text-2xl font-bold">{achievementStats.milestone}</div>
                  <div className="text-sm text-muted-foreground">Milestones</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{achievementStats.consistency}</div>
                  <div className="text-sm text-muted-foreground">Consistency</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">{achievementStats.special}</div>
                  <div className="text-sm text-muted-foreground">Special</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="leaderboard">Community</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <StreakGridDashboard userId={userId} />
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Achievements</CardTitle>
                <CardDescription>
                  Complete challenges to unlock achievements and earn points
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all">
                  <TabsList className="mb-6">
                    <TabsTrigger value="all">All ({allAchievements.length})</TabsTrigger>
                    <TabsTrigger value="milestone">Milestones ({allAchievements.filter(a => a.type === 'milestone').length})</TabsTrigger>
                    <TabsTrigger value="consistency">Consistency ({allAchievements.filter(a => a.type === 'consistency').length})</TabsTrigger>
                    <TabsTrigger value="special">Special ({allAchievements.filter(a => a.type === 'special').length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {filterAchievements().map((achievement) => (
                        <Card 
                          key={achievement.id}
                          className={`transition-all hover:shadow-md ${
                            achievement.unlocked ? 'border-green-200 dark:border-green-700' : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${getTypeColor(achievement.type, achievement.unlocked || false)}`}>
                                {getAchievementIcon(achievement.icon)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <h4 className={`font-medium ${achievement.unlocked ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                    {achievement.name}
                                  </h4>
                                  {achievement.unlocked && (
                                    <Badge variant="success" className="ml-2">
                                      Unlocked
                                    </Badge>
                                  )}
                                </div>
                                <p className={`text-sm mt-1 ${achievement.unlocked ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                                  {achievement.description}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className={`text-xs ${achievement.unlocked ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                    {achievement.requirement}
                                  </span>
                                  <span className={`text-xs font-medium ${achievement.unlocked ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                    {achievement.points} pts
                                  </span>
                                </div>
                                {achievement.unlockedAt && (
                                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                    Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  {(['milestone', 'consistency', 'special'] as const).map(type => (
                    <TabsContent key={type} value={type}>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filterAchievements(type).map((achievement) => (
                          <Card 
                            key={achievement.id}
                            className={`transition-all hover:shadow-md ${
                              achievement.unlocked ? 'border-green-200 dark:border-green-700' : 'border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${getTypeColor(achievement.type, achievement.unlocked || false)}`}>
                                  {getAchievementIcon(achievement.icon)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between">
                                    <h4 className={`font-medium ${achievement.unlocked ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                      {achievement.name}
                                    </h4>
                                    {achievement.unlocked && (
                                      <Badge variant="default" className="ml-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                                        Unlocked
                                      </Badge>
                                    )}
                                  </div>
                                  <p className={`text-sm mt-1 ${achievement.unlocked ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                                    {achievement.description}
                                  </p>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className={`text-xs ${achievement.unlocked ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                      {achievement.requirement}
                                    </span>
                                    <span className={`text-xs font-medium ${achievement.unlocked ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                      {achievement.points} pts
                                    </span>
                                  </div>
                                  {achievement.unlockedAt && (
                                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                      Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Community Features</CardTitle>
                <CardDescription>
                  Connect with other learners and share your achievements
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-12">
                <div className="text-gray-400 dark:text-gray-500 mb-4">
                  <Users className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Coming Soon
                </h3>
                <p className="text-gray-600 dark:text-gray-300 max-w-sm mx-auto">
                  Community leaderboards, social sharing, and team challenges are in development.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}