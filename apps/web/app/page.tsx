"use client"

import { useState, useEffect } from "react"
import { unstable_noStore as noStore } from 'next/cache'

// Force dynamic rendering
noStore()

import { supabase } from "@/lib/supabase"
import type { Database } from "@/lib/database.types"
import { initDatabase, getDatabaseSetupInstructions } from "@/lib/init-database"
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
import { FocusHoursPie, EfficiencyPie } from "../components/charts/PieCharts"
import { SessionSetupModal } from "../components/session-setup-modal"
import { DatabaseSetupModal } from "../components/database-setup-modal"
import { EfficiencyModal } from "../components/efficiency-modal"
import { TimerSound, playBeepSound } from "../components/timer-sound"
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

// Calculate real metrics from sessions
const calculateMetrics = (sessions: Session[]) => {
  const totalHours = sessions.reduce((sum, session) => sum + (session.duration_minutes / 60), 0)
  const avgEfficiency = sessions.length > 0 
    ? Math.round(sessions.reduce((sum, session) => sum + session.efficiency_percentage, 0) / sessions.length)
    : 0
  const sessionsCount = sessions.length
  
  return [
    { 
      label: "Focus Hours Today", 
      value: `${Math.round(totalHours * 10) / 10}h`, 
      change: sessions.length > 0 ? "+" + Math.round(totalHours * 10) / 10 + "h" : "0h", 
      trend: "up", 
      icon: Clock 
    },
    { 
      label: "Efficiency Rate", 
      value: `${avgEfficiency}%`, 
      change: sessions.length > 0 ? "+" + avgEfficiency + "%" : "0%", 
      trend: avgEfficiency >= 70 ? "up" : "down", 
      icon: Target 
    },
    { 
      label: "Sessions Completed", 
      value: sessionsCount.toString(), 
      change: sessions.length > 0 ? "+" + sessionsCount : "0", 
      trend: "up", 
      icon: CheckCircle 
    },
    { 
      label: "Weekly Goal", 
      value: `${Math.round((totalHours / 40) * 100)}%`, 
      change: "+" + Math.round((totalHours / 40) * 100) + "%", 
      trend: "up", 
      icon: Zap 
    },
  ]
}

// Calculate real data from sessions
const calculateFocusHoursData = (sessions: Session[]) => {
  const taskHours: { [key: string]: number } = {}
  
  sessions.forEach(session => {
    const hours = session.duration_minutes / 60
    taskHours[session.task] = (taskHours[session.task] || 0) + hours
  })
  
  // Convert to pie chart format
  const colors = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#84cc16", "#f97316"]
  const data = Object.entries(taskHours)
    .sort(([,a], [,b]) => b - a) // Sort by hours descending
    .slice(0, 6) // Top 6 tasks
    .map(([task, hours], index) => ({
      name: task,
      value: Math.round(hours * 10) / 10, // Round to 1 decimal
      color: colors[index % colors.length]
    }))
  
  return data.length > 0 ? data : [
    { name: "No Data", value: 1, color: "#6b7280" }
  ]
}

const calculateEfficiencyData = (sessions: Session[]) => {
  if (sessions.length === 0) {
    return [
      { name: "No Data", value: 100, color: "#6b7280" }
    ]
  }
  
  // Calculate weighted efficiency breakdown
  const totalEfficiency = sessions.reduce((sum, session) => sum + session.efficiency_percentage, 0)
  const avgEfficiency = totalEfficiency / sessions.length
  
  // Show efficiency as actual percentage vs remaining
  const efficient = Math.round(avgEfficiency)
  const inefficient = 100 - efficient
  
  const data = []
  if (efficient > 0) {
    data.push({ 
      name: `Efficient (${efficient}%)`, 
      value: efficient, 
      color: efficient >= 80 ? "#10b981" : efficient >= 60 ? "#f59e0b" : "#ef4444" 
    })
  }
  if (inefficient > 0) {
    data.push({ 
      name: `Room for Improvement`, 
      value: inefficient, 
      color: "#fb923c" 
    })
  }
  
  return data.length > 0 ? data : [
    { name: "No Data", value: 100, color: "#6b7280" }
  ]
}

// Determine the best default period based on data availability
const getBestDefaultPeriod = (sessions: Session[]) => {
  if (sessions.length === 0) return "Today"
  
  const todaySessions = filterSessionsByPeriod(sessions, "Today")
  if (todaySessions.length > 0) return "Today"
  
  const thisWeekSessions = filterSessionsByPeriod(sessions, "This Week")
  if (thisWeekSessions.length > 0) return "This Week"
  
  const thisMonthSessions = filterSessionsByPeriod(sessions, "This Month")
  if (thisMonthSessions.length > 0) return "This Month"
  
  // Fallback to Today if no data exists
  return "Today"
}

// Filter sessions by selected period
const filterSessionsByPeriod = (sessions: Session[], period: string) => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  switch (period) {
    case "Today":
      return sessions.filter(session => {
        const sessionDate = new Date(session.created_at)
        return sessionDate >= today
      })
    
    case "This Week":
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)
      return sessions.filter(session => {
        const sessionDate = new Date(session.created_at)
        return sessionDate >= startOfWeek
      })
    
    case "This Month":
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      return sessions.filter(session => {
        const sessionDate = new Date(session.created_at)
        return sessionDate >= startOfMonth
      })
    
    default:
      return sessions
  }
}

// Build trend data for AreaChart from filtered sessions
const calculateTrendData = (sessions: Session[], period: string) => {
  const now = new Date()

  if (period === 'Today') {
    // X-axis: hours (0-23)
    const buckets: { totalMinutes: number; effSum: number; count: number }[] = Array.from({ length: 24 }, () => ({ totalMinutes: 0, effSum: 0, count: 0 }))
    sessions.forEach(s => {
      const d = new Date(s.created_at)
      const h = d.getHours()
      buckets[h].totalMinutes += s.duration_minutes
      buckets[h].effSum += s.efficiency_percentage
      buckets[h].count += 1
    })
    return buckets.map((b, h) => ({
      name: String(h),
      focusHours: Math.round((b.totalMinutes / 60) * 10) / 10,
      efficiency: b.count > 0 ? Math.round(b.effSum / b.count) : 0,
      sessions: b.count,
    }))
  }

  if (period === 'This Week') {
    // X-axis: days (Sun..Sat)
    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    const buckets: { totalMinutes: number; effSum: number; count: number }[] = Array.from({ length: 7 }, () => ({ totalMinutes: 0, effSum: 0, count: 0 }))
    sessions.forEach(s => {
      const d = new Date(s.created_at)
      const idx = d.getDay()
      buckets[idx].totalMinutes += s.duration_minutes
      buckets[idx].effSum += s.efficiency_percentage
      buckets[idx].count += 1
    })
    return buckets.map((b, i) => ({
      name: dayNames[i],
      focusHours: Math.round((b.totalMinutes / 60) * 10) / 10,
      efficiency: b.count > 0 ? Math.round(b.effSum / b.count) : 0,
      sessions: b.count,
    }))
  }

  // This Month -> X-axis: weeks within the month (W1..W5/W6), weeks start Sunday
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const weeksInMonth = (() => {
    const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    // Max 6 buckets to cover offset + days
    return 6
  })()
  const buckets: { totalMinutes: number; effSum: number; count: number }[] = Array.from({ length: weeksInMonth }, () => ({ totalMinutes: 0, effSum: 0, count: 0 }))

  const getWeekIndexInMonth = (d: Date) => {
    const offset = startOfMonth.getDay() // 0=Sun
    return Math.floor((d.getDate() - 1 + offset) / 7)
  }

  sessions.forEach(s => {
    const d = new Date(s.created_at)
    const idx = Math.max(0, Math.min(weeksInMonth - 1, getWeekIndexInMonth(d)))
    buckets[idx].totalMinutes += s.duration_minutes
    buckets[idx].effSum += s.efficiency_percentage
    buckets[idx].count += 1
  })

  return buckets.map((b, i) => ({
    name: `W${i + 1}`,
    focusHours: Math.round((b.totalMinutes / 60) * 10) / 10,
    efficiency: b.count > 0 ? Math.round(b.effSum / b.count) : 0,
    sessions: b.count,
  }))
}

type Session = Database['public']['Tables']['sessions']['Row']

export default function ProductivityDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("This Week")
  const [defaultPeriodSet, setDefaultPeriodSet] = useState(false)
  const [timerMinutes, setTimerMinutes] = useState(50)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [currentTask, setCurrentTask] = useState("DSA")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [themeInitialized, setThemeInitialized] = useState(false)
  const [recentSessions, setRecentSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [initialDuration, setInitialDuration] = useState(50)
  const [isClient, setIsClient] = useState(false)
  const [databaseReady, setDatabaseReady] = useState(false)
  const [showDatabaseSetup, setShowDatabaseSetup] = useState(false)
  const [showEfficiencyModal, setShowEfficiencyModal] = useState(false)
  const [shouldPlaySound, setShouldPlaySound] = useState(false)
  const [isZenMode, setIsZenMode] = useState(false)

  // Persist active session across refresh
  type ActiveSession = {
    taskName: string
    initialDuration: number
    remainingSeconds: number
    isRunning: boolean
    startedAt: number
    lastUpdated: number
  }
  const ACTIVE_SESSION_KEY = 'activeSessionV1'
  const THEME_KEY = 'themeV1'

  const loadActiveSession = (): ActiveSession | null => {
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem(ACTIVE_SESSION_KEY)
      if (!raw) return null
      return JSON.parse(raw) as ActiveSession
    } catch {
      return null
    }
  }

  const saveActiveSession = (session: ActiveSession | null) => {
    if (typeof window === 'undefined') return
    try {
      if (session) {
        localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session))
      } else {
        localStorage.removeItem(ACTIVE_SESSION_KEY)
      }
    } catch {}
  }

  // Keyboard shortcuts: Z to toggle Zen Mode, Esc to exit
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'z') {
        setIsZenMode((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setIsZenMode(false)
      }
    }
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [])

  // Initialize theme on client load (only once)
  useEffect(() => {
    if (typeof window !== 'undefined' && !themeInitialized) {
      try {
        const savedTheme = localStorage.getItem(THEME_KEY)
        if (savedTheme === 'dark') {
          setIsDarkMode(true)
        } else if (savedTheme === 'light') {
          setIsDarkMode(false)
        } else {
          // Check system preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          setIsDarkMode(prefersDark)
        }
      } catch {}
      setThemeInitialized(true)
    }
  }, [themeInitialized])

  useEffect(() => {
    setIsClient(true)
    
    // Check database tables on client load
    if (isClient) {
      // Restore active session if present
      const restored = loadActiveSession()
      if (restored) {
        setCurrentTask(restored.taskName)
        setInitialDuration(restored.initialDuration)
        // Restore the original session start time
        setSessionStartTime(new Date(restored.startedAt))
        
        // Adjust remaining based on elapsed time if running
        let remaining = restored.remainingSeconds
        if (restored.isRunning) {
          const elapsed = Math.floor((Date.now() - restored.lastUpdated) / 1000)
          remaining = Math.max(0, remaining - elapsed)
        }
        
        // Check if timer has completed during restoration
        if (remaining <= 0 && restored.isRunning) {
          // Timer completed while away - trigger completion flow
          setTimerMinutes(0)
          setTimerSeconds(0)
          setIsTimerRunning(false)
          setShouldPlaySound(true)
          if (typeof window !== 'undefined') {
            playBeepSound()
          }
          // DON'T clear the active session yet - we need the start time for saving
          // It will be cleared after the efficiency modal is submitted
          // Trigger efficiency modal after a short delay to ensure UI is ready
          setTimeout(() => {
            handleSessionComplete()
          }, 100)
        } else {
          setTimerMinutes(Math.floor(remaining / 60))
          setTimerSeconds(remaining % 60)
          setIsTimerRunning(restored.isRunning && remaining > 0)
        }
      }

      initDatabase().then((tablesExist) => {
        setDatabaseReady(tablesExist)
        if (!tablesExist) {
          console.warn('Database tables may not exist. Please run the SQL schema.')
          console.log(getDatabaseSetupInstructions())
          setShowDatabaseSetup(true)
        }
      })
    }
  }, [isClient])

  useEffect(() => {
    if (themeInitialized) {
      if (isDarkMode) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
      // Persist theme
      try {
        localStorage.setItem(THEME_KEY, isDarkMode ? 'dark' : 'light')
      } catch {}
    }
  }, [isDarkMode, themeInitialized])

  // Watch for timer completion (00:00 while running)
  useEffect(() => {
    if (isClient && isTimerRunning && timerMinutes === 0 && timerSeconds === 0) {
      // Timer just hit 00:00 while running - trigger completion
      setIsTimerRunning(false)
      setShouldPlaySound(true)
      if (typeof window !== 'undefined') {
        playBeepSound()
      }
      handleSessionComplete()
    }
  }, [isClient, isTimerRunning, timerMinutes, timerSeconds])

  // Timer countdown effect
  useEffect(() => {
    if (!isClient) return

    let interval: NodeJS.Timeout | null = null

    if (isTimerRunning && (timerMinutes > 0 || timerSeconds > 0)) {
      interval = setInterval(() => {
        if (timerSeconds > 0) {
          setTimerSeconds(timerSeconds - 1)
        } else if (timerMinutes > 0) {
          setTimerMinutes(timerMinutes - 1)
          setTimerSeconds(59)
        } else {
          // Timer finished
          setIsTimerRunning(false)
          setShouldPlaySound(true) // Trigger sound
          // Also play fallback beep sound
          if (typeof window !== 'undefined') {
            playBeepSound()
          }
          handleSessionComplete()
        }
        // Persist tick
        const remaining = (timerMinutes * 60 + timerSeconds) - 1
        saveActiveSession({
          taskName: currentTask,
          initialDuration,
          remainingSeconds: Math.max(0, remaining),
          isRunning: true,
          startedAt: sessionStartTime ? sessionStartTime.getTime() : Date.now(),
          lastUpdated: Date.now(),
        })
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isTimerRunning, timerMinutes, timerSeconds, isClient])

  useEffect(() => {
    async function fetchRecentSessions() {
      try {
        // Fetch all sessions for charts and metrics
        const { data: allSessions, error: allError } = await supabase
          .from('sessions')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (allError) throw allError
        
        // Get recent 5 sessions for the recent sessions list
        const recent5 = allSessions?.slice(0, 5) || []
        
        setRecentSessions(allSessions || [])
        console.log('Fetched all sessions:', allSessions?.length || 0)
        
        // Set default period based on data availability (only on first load)
        if (!defaultPeriodSet && allSessions && allSessions.length > 0) {
          const bestPeriod = getBestDefaultPeriod(allSessions)
          setSelectedPeriod(bestPeriod)
          setDefaultPeriodSet(true)
          console.log('Set default period to:', bestPeriod)
        }
      } catch (error) {
        console.error('Error fetching sessions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentSessions()
  }, [])

  const startTimer = () => setIsTimerRunning(true)
  const pauseTimer = () => {
    setIsTimerRunning(false)
    // Save paused state
    const remaining = timerMinutes * 60 + timerSeconds
    saveActiveSession({
      taskName: currentTask,
      initialDuration,
      remainingSeconds: remaining,
      isRunning: false,
      startedAt: sessionStartTime ? sessionStartTime.getTime() : Date.now(),
      lastUpdated: Date.now(),
    })
  }

  const resumeTimer = () => {
    setIsTimerRunning(true)
    // Save running state
    const remaining = timerMinutes * 60 + timerSeconds
    saveActiveSession({
      taskName: currentTask,
      initialDuration,
      remainingSeconds: remaining,
      isRunning: true,
      startedAt: sessionStartTime ? sessionStartTime.getTime() : Date.now(),
      lastUpdated: Date.now(),
    })
  }
  const resetTimer = () => {
    setIsTimerRunning(false)
    setTimerMinutes(50)
    setTimerSeconds(0)
    setInitialDuration(50)
    setCurrentTask("Focus Session")
    setSessionStartTime(null)
    saveActiveSession(null)
  }

  const handleStartSession = (taskName: string, duration: number) => {
    if (!isClient) return
    
    setCurrentTask(taskName)
    setTimerMinutes(duration)
    setTimerSeconds(0)
    setInitialDuration(duration)
    setSessionStartTime(new Date())
    setIsTimerRunning(true)

    // Persist
    saveActiveSession({
      taskName,
      initialDuration: duration,
      remainingSeconds: duration * 60,
      isRunning: true,
      startedAt: Date.now(),
      lastUpdated: Date.now(),
    })
  }

  const handleSessionComplete = async () => {
    // Show efficiency modal instead of auto-calculating
    setShowEfficiencyModal(true)
  }

  const handleSaveSession = async (efficiency: number) => {
    try {
      // Calculate duration based on initial duration minus remaining time
      const remainingTime = timerMinutes * 60 + timerSeconds
      const actualDuration = Math.max(1, initialDuration - Math.floor(remainingTime / 60)) // At least 1 minute

      console.log('Completing session:', {
        task: currentTask,
        actualDuration,
        efficiency,
        remainingTime,
        initialDuration
      })

      // First, get the user ID from the database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', 'alex@example.com')
        .single()

      if (userError) {
        console.error('Error fetching user:', userError)
        throw userError
      }

      console.log('User found:', userData)

      // Use the original session start time if available, otherwise use current time
      const sessionStartTimeToUse = sessionStartTime || new Date()
      
      // Insert the session with the correct user ID and start time
      const { error } = await supabase
        .from('sessions')
        .insert({
          user_id: (userData as any).id,
          task: currentTask,
          duration_minutes: actualDuration,
          efficiency_percentage: efficiency,
          created_at: sessionStartTimeToUse.toISOString()
        } as any)

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Session saved successfully')

      // Refresh all sessions
      const { data: allSessions, error: fetchError } = await supabase
        .from('sessions')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (!fetchError && allSessions) {
        setRecentSessions(allSessions)
        console.log('All sessions updated:', allSessions.length)
        
        // If this is the first session, update default period
        if (!defaultPeriodSet) {
          const bestPeriod = getBestDefaultPeriod(allSessions)
          setSelectedPeriod(bestPeriod)
          setDefaultPeriodSet(true)
          console.log('Set default period to:', bestPeriod, 'after first session')
        }
      } else if (fetchError) {
        console.error('Error fetching sessions:', fetchError)
      }
    } catch (error) {
      console.error('Error saving session:', error)
    }

    resetTimer()
    // Clear persisted active session after completion
    saveActiveSession(null)
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

      {/* Zen Mode Overlay */}
      {isZenMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-black">
          <div className="absolute top-4 right-4 flex gap-2">
            <Button variant="outline" onClick={() => setIsZenMode(false)} className="dark:border-gray-600 dark:text-gray-300">
              Exit Zen
            </Button>
          </div>
          <div className="text-center px-6 w-full max-w-2xl">
            <div className="text-7xl sm:text-8xl font-mono font-bold text-gray-900 dark:text-white mb-6">
              {formatTime(timerMinutes, timerSeconds)}
            </div>
            <div className="text-lg text-gray-600 dark:text-gray-400 mb-6">{currentTask}</div>
            <Progress value={((timerMinutes * 60 + timerSeconds) / (initialDuration * 60)) * 100} className="h-3 mb-8" />
            <div className="flex gap-3 justify-center">
              {!isTimerRunning ? (
                // Show Resume if timer has time remaining (paused), Start Session if fresh
                (timerMinutes > 0 || timerSeconds > 0) ? (
                  <Button onClick={resumeTimer} className="bg-green-600 hover:bg-green-700">
                    <Play className="w-4 h-4 mr-2" /> Resume
                  </Button>
                ) : (
                  <Button onClick={() => setShowSessionModal(true)} className="bg-green-600 hover:bg-green-700">
                    <Play className="w-4 h-4 mr-2" /> Start Session
                  </Button>
                )
              ) : (
                <>
                  <Button onClick={() => setIsTimerRunning(false)} className="bg-yellow-600 hover:bg-yellow-700">
                    <Pause className="w-4 h-4 mr-2" /> Pause
                  </Button>
                  <Button onClick={handleSessionComplete} className="bg-red-600 hover:bg-red-700">
                    <CheckCircle className="w-4 h-4 mr-2" /> Complete
                  </Button>
                </>
              )}
              <Button onClick={resetTimer} variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                <RotateCcw className="w-4 h-4 mr-2" /> Reset
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* When not in Zen Mode, render the full dashboard */}
      {!isZenMode && (
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
              {calculateMetrics(filterSessionsByPeriod(recentSessions, selectedPeriod)).map((metric, index) => (
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
                  <FocusHoursPie 
                    title="Focus Hours Breakdown" 
                    description={`How you spent your time ${selectedPeriod.toLowerCase()}`} 
                    data={calculateFocusHoursData(filterSessionsByPeriod(recentSessions, selectedPeriod))} 
                  />

                  <EfficiencyPie 
                    title="Focus Efficiency" 
                    description={`Your productivity quality ${selectedPeriod.toLowerCase()}`} 
                    data={calculateEfficiencyData(filterSessionsByPeriod(recentSessions, selectedPeriod))} 
                  />
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
                        <AreaChart data={calculateTrendData(filterSessionsByPeriod(recentSessions, selectedPeriod), selectedPeriod)}>
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
                  <CardHeader className="pb-4 flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold dark:text-white">Pomodoro Timer</CardTitle>
                      <CardDescription className="dark:text-gray-400">
                        Stay focused with timed work sessions
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 bg-transparent dark:border-gray-600 dark:text-gray-300"
                      onClick={() => setIsZenMode(true)}
                    >
                      <Timer className="w-4 h-4" /> Zen
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-6">
                      {!isClient ? (
                        <div className="text-4xl font-mono font-bold text-gray-900 dark:text-white mb-2">
                          Loading...
                        </div>
                      ) : (
                        <>
                          <div className="text-4xl font-mono font-bold text-gray-900 dark:text-white mb-2">
                            {formatTime(timerMinutes, timerSeconds)}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">{currentTask}</div>
                          <Progress
                            value={((timerMinutes * 60 + timerSeconds) / (initialDuration * 60)) * 100}
                            className="h-2 mb-4"
                          />
                        </>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!isTimerRunning ? (
                        // Show Resume if timer has time remaining (paused), Start Session if fresh
                        (timerMinutes > 0 || timerSeconds > 0) ? (
                          <Button onClick={resumeTimer} className="flex-1 bg-green-600 hover:bg-green-700">
                            <Play className="w-4 h-4 mr-2" />
                            Resume
                          </Button>
                        ) : (
                          <Button onClick={() => setShowSessionModal(true)} className="flex-1 bg-green-600 hover:bg-green-700">
                            <Play className="w-4 h-4 mr-2" />
                            Start Session
                          </Button>
                        )
                      ) : (
                        <>
                          <Button onClick={pauseTimer} className="flex-1 bg-yellow-600 hover:bg-yellow-700">
                            <Pause className="w-4 h-4 mr-2" />
                            Pause
                          </Button>
                          <Button
                            onClick={handleSessionComplete}
                            className="flex-1 bg-red-600 hover:bg-red-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Complete
                          </Button>
                        </>
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
                    <CardTitle className="text-lg font-semibold dark:text-white">{selectedPeriod}'s Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Daily Goal</span>
                        <span className="text-sm font-medium dark:text-white">8 hours</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
                        <span className="text-sm font-medium dark:text-white">
                          {Math.round(filterSessionsByPeriod(recentSessions, selectedPeriod).reduce((sum, session) => sum + (session.duration_minutes / 60), 0) * 10) / 10} hours
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(100, Math.round((filterSessionsByPeriod(recentSessions, selectedPeriod).reduce((sum, session) => sum + (session.duration_minutes / 60), 0) / 8) * 100))} 
                        className="h-2" 
                      />
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                          {filterSessionsByPeriod(recentSessions, selectedPeriod).length > 0 
                            ? Math.round(filterSessionsByPeriod(recentSessions, selectedPeriod).reduce((sum, session) => sum + session.efficiency_percentage, 0) / filterSessionsByPeriod(recentSessions, selectedPeriod).length)
                            : 0}%
                        </div>
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
                        recentSessions.slice(0, 5).map((session, index) => (
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
      )}
      
      <SessionSetupModal
        isOpen={showSessionModal}
        onClose={() => setShowSessionModal(false)}
        onStartSession={handleStartSession}
      />
      
      {showDatabaseSetup && (
        <DatabaseSetupModal />
      )}

      <EfficiencyModal
        isOpen={showEfficiencyModal}
        onClose={() => setShowEfficiencyModal(false)}
        onSave={handleSaveSession}
        taskName={currentTask}
        duration={initialDuration}
      />

      <TimerSound
        shouldPlay={shouldPlaySound}
        onPlayed={() => setShouldPlaySound(false)}
      />
    </div>
  )
}
