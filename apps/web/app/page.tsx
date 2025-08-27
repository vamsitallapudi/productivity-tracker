"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { Database } from "@/lib/database.types"
import {
  Search,
  Bell,
  Home,
  Clock,
  BarChart3,
  Settings,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Target,
  Calendar,
  Timer,
  Brain,
  Zap,
  ChevronDown,
  Plus,
  ArrowRight,
  Sun,
  Moon,
} from "lucide-react"
import dynamic from "next/dynamic"
const AreaChart = dynamic(() => import("recharts").then((m) => m.AreaChart), { ssr: false })
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false })
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid), { ssr: false })
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false })
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false })
const Area = dynamic(() => import("recharts").then((m) => m.Area), { ssr: false })
import { FocusHoursPie, EfficiencyPie } from "@/components/charts/PieCharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"

const metricsData = [
  { label: "Focus Hours Today", value: "6.5h", change: "+1.2h", trend: "up", icon: Clock },
  { label: "Efficiency Rate", value: "87%", change: "+5%", trend: "up", icon: Target },
  { label: "Sessions Completed", value: "12", change: "+3", trend: "up", icon: CheckCircle },
  { label: "Weekly Goal", value: "92%", change: "+8%", trend: "up", icon: Zap },
]

const focusHoursData = [
  { name: "Deep Work", value: 4.5, color: "#8b5cf6" },
  { name: "Meetings", value: 2.0, color: "#3b82f6" },
  { name: "Admin Tasks", value: 1.5, color: "#10b981" },
  { name: "Breaks", value: 0.5, color: "#f59e0b" },
]

const efficiencyData = [
  { name: "Productive", value: 87, color: "#10b981" },
  { name: "Neutral", value: 8, color: "#f59e0b" },
  { name: "Distracted", value: 5, color: "#ef4444" },
]

const chartData = [
  { name: "Mon", focusHours: 7.2, efficiency: 85, sessions: 14 },
  { name: "Tue", focusHours: 6.8, efficiency: 82, sessions: 12 },
  { name: "Wed", focusHours: 8.1, efficiency: 91, sessions: 16 },
  { name: "Thu", focusHours: 5.9, efficiency: 78, sessions: 11 },
  { name: "Fri", focusHours: 7.5, efficiency: 88, sessions: 15 },
  { name: "Sat", focusHours: 4.2, efficiency: 75, sessions: 8 },
  { name: "Sun", focusHours: 3.8, efficiency: 72, sessions: 7 },
]

type Session = Database['public']['Tables']['sessions']['Row']

export default function ProductivityDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("This Week")
  const [timerMinutes, setTimerMinutes] = useState(50)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [currentTask, setCurrentTask] = useState("Focus Session")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [recentSessions, setRecentSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDarkMode])

  useEffect(() => {
    async function fetchRecentSessions() {
      try {
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5)
        
        if (error) throw error
        setRecentSessions(data || [])
      } catch (error) {
        console.error('Error fetching sessions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentSessions()
  }, [])

  const startTimer = () => setIsTimerRunning(true)
  const pauseTimer = () => setIsTimerRunning(false)
  const resetTimer = () => {
    setIsTimerRunning(false)
    setTimerMinutes(50)
    setTimerSeconds(0)
  }

  const formatTime = (minutes: number, seconds: number) => {
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">FocusFlow</span>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <span>Dashboard</span> <span className="mx-1">/</span> <span>Overview</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search tasks, sessions..."
              className="pl-10 w-80 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-700 dark:text-white"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="dark:text-gray-300 dark:hover:text-white"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="relative dark:text-gray-300 dark:hover:text-white">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" />
                  <AvatarFallback>AE</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 dark:bg-gray-800 dark:border-gray-700">
              <DropdownMenuLabel className="dark:text-white">Alex Evans</DropdownMenuLabel>
              <DropdownMenuSeparator className="dark:border-gray-600" />
              <DropdownMenuItem className="dark:text-gray-300 dark:hover:bg-gray-700">Profile</DropdownMenuItem>
              <DropdownMenuItem className="dark:text-gray-300 dark:hover:bg-gray-700">Settings</DropdownMenuItem>
              <DropdownMenuItem className="dark:text-gray-300 dark:hover:bg-gray-700">Support</DropdownMenuItem>
              <DropdownMenuSeparator className="dark:border-gray-600" />
              <DropdownMenuItem className="dark:text-gray-300 dark:hover:bg-gray-700">Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-60 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="p-4">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search anything..."
                className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-sm dark:text-white"
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 w-6 h-6 dark:text-gray-400"
              >
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>

            <nav className="space-y-1">
              <Button
                variant="ghost"
                className="flex items-center w-full justify-start bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 px-3 py-2 rounded-md text-sm font-medium"
              >
                <Home className="w-4 h-4 mr-3" />
                Overview
              </Button>
              <Button
                variant="ghost"
                className="flex items-center w-full justify-start text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-md text-sm font-medium"
              >
                <Timer className="w-4 h-4 mr-3" />
                Focus Timer
              </Button>
              <Button
                variant="ghost"
                className="flex items-center w-full justify-start text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-md text-sm font-medium"
              >
                <BarChart3 className="w-4 h-4 mr-3" />
                Analytics
              </Button>
              <Button
                variant="ghost"
                className="flex items-center w-full justify-start text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-md text-sm font-medium"
              >
                <Calendar className="w-4 h-4 mr-3" />
                Schedule
              </Button>
              <Button
                variant="ghost"
                className="flex items-center w-full justify-start text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-md text-sm font-medium"
              >
                <Target className="w-4 h-4 mr-3" />
                Goals
              </Button>
              <Button
                variant="ghost"
                className="flex items-center w-full justify-start text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-md text-sm font-medium"
              >
                <Settings className="w-4 h-4 mr-3" />
                Settings
              </Button>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 bg-gray-50 dark:bg-gray-800">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Productivity Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Track your focus, efficiency, and achieve your goals
                </p>
              </div>
              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 bg-transparent dark:border-gray-600 dark:text-gray-300">
                      {selectedPeriod} <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="dark:bg-gray-800 dark:border-gray-700">
                    <DropdownMenuItem
                      onClick={() => setSelectedPeriod("Today")}
                      className="dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      Today
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedPeriod("This Week")}
                      className="dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      This Week
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedPeriod("This Month")}
                      className="dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      This Month
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Goal
                </Button>
              </div>
            </div>
          </div>

          {/* Metrics Overview */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            {metricsData.map((metric, index) => (
              <Card key={index} className="border-gray-200 dark:border-gray-700 dark:bg-gray-900">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      <metric.icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </div>
                    <div
                      className={`flex items-center gap-1 text-sm ${metric.trend === "up" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                    >
                      {metric.trend === "up" ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {metric.change}
                    </div>
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">{metric.value}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{metric.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-8">
            {/* Main Content Area */}
            <div className="col-span-2 space-y-8">
              {/* Charts Section */}
              <div className="grid grid-cols-2 gap-6">
                <FocusHoursPie title="Focus Hours Breakdown" description="How you spent your time today" data={focusHoursData} />

                <EfficiencyPie title="Focus Efficiency" description="Your productivity quality today" data={efficiencyData} />
              </div>

              {/* Weekly Trends */}
              <Card className="border-gray-200 dark:border-gray-700 dark:bg-gray-900">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold dark:text-white">Weekly Productivity Trends</CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Your focus hours and efficiency over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="focusHours"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.1}
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="efficiency"
                          stroke="#10b981"
                          fill="#10b981"
                          fillOpacity={0.1}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Pomodoro Timer */}
              <Card className="border-gray-200 dark:border-gray-700 dark:bg-gray-900">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold dark:text-white">Pomodoro Timer</CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Stay focused with timed work sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    <div className="text-4xl font-mono font-bold text-gray-900 dark:text-white mb-2">
                      {formatTime(timerMinutes, timerSeconds)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">{currentTask}</div>
                    <Progress
                      value={((50 * 60 - (timerMinutes * 60 + timerSeconds)) / (50 * 60)) * 100}
                      className="h-2 mb-4"
                    />
                  </div>
                  <div className="flex gap-2">
                    {!isTimerRunning ? (
                      <Button onClick={startTimer} className="flex-1 bg-green-600 hover:bg-green-700">
                        <Play className="w-4 h-4 mr-2" />
                        Start
                      </Button>
                    ) : (
                      <Button onClick={pauseTimer} className="flex-1 bg-yellow-600 hover:bg-yellow-700">
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </Button>
                    )}
                    <Button
                      onClick={resetTimer}
                      variant="outline"
                      className="flex-1 bg-transparent dark:border-gray-600 dark:text-gray-300"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Today's Progress */}
              <Card className="border-gray-200 dark:border-gray-700 dark:bg-gray-900">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold dark:text-white">Today's Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Daily Goal</span>
                      <span className="text-sm font-medium dark:text-white">8 hours</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
                      <span className="text-sm font-medium dark:text-white">6.5 hours</span>
                    </div>
                    <Progress value={81} className="h-2" />
                    <div className="text-center">
                      <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400">87%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Efficiency Score</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Sessions */}
              <Card className="border-gray-200 dark:border-gray-700 dark:bg-gray-900">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold dark:text-white">Recent Sessions</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-0">
                    {loading ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        Loading sessions...
                      </div>
                    ) : recentSessions.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        No sessions yet. Start your first focus session!
                      </div>
                    ) : (
                      recentSessions.map((session, index) => (
                        <div
                          key={session.id}
                          className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                        >
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                              {session.task}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {session.duration_minutes} min • {session.efficiency_percentage}% efficiency • {new Date(session.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
