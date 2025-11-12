"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  Flame,
  Trophy,
  Target,
  Dumbbell,
  BookOpen,
  Code,
  Users,
  ChefHat,
  Brain,
  Calendar,
  MoreHorizontal,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Check,
  RotateCcw
} from "lucide-react"
import type { 
  UserStreak, 
  StreakCard,
  PredefinedStreakType,
  CreateStreakPayload,
  UpdateStreakPayload
} from "@/lib/database.types"

interface StreakGridDashboardProps {
  userId: string
  className?: string
}

interface StreakCardComponentProps {
  streak: StreakCard
  onEdit: (streak: StreakCard) => void
  onDelete: (streakId: string) => void
  onView: (streakId: string) => void
  onComplete: (streakId: string) => void
  onReset: (streakId: string) => void
}

// Icon mapping for Lucide React icons
const ICON_MAP = {
  Dumbbell,
  BookOpen,
  Code,
  Users,
  ChefHat,
  Brain,
  Target,
  Trophy,
  Flame,
  Calendar,
  Settings,
  CheckCircle
} as const

type IconName = keyof typeof ICON_MAP

// Color scheme mapping
const COLOR_SCHEMES = {
  red: {
    bg: 'bg-red-50 dark:bg-red-950',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-300',
    accent: 'text-red-600 dark:text-red-400'
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    accent: 'text-blue-600 dark:text-blue-400'
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-950',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-700 dark:text-green-300',
    accent: 'text-green-600 dark:text-green-400'
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-700 dark:text-purple-300',
    accent: 'text-purple-600 dark:text-purple-400'
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-950',
    border: 'border-orange-200 dark:border-orange-800',
    text: 'text-orange-700 dark:text-orange-300',
    accent: 'text-orange-600 dark:text-orange-400'
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-950',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-700 dark:text-yellow-300',
    accent: 'text-yellow-600 dark:text-yellow-400'
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-950',
    border: 'border-indigo-200 dark:border-indigo-800',
    text: 'text-indigo-700 dark:text-indigo-300',
    accent: 'text-indigo-600 dark:text-indigo-400'
  }
} as const

// Individual streak card component with elegant design
const StreakCardComponent: React.FC<StreakCardComponentProps> = ({ 
  streak, 
  onEdit, 
  onDelete, 
  onView,
  onComplete,
  onReset
}) => {
  const IconComponent = ICON_MAP[streak.icon as IconName] || Target
  const colorScheme = COLOR_SCHEMES[streak.color as keyof typeof COLOR_SCHEMES] || COLOR_SCHEMES.blue
  
  const getDaysAgo = (dateString?: string) => {
    if (!dateString) return null
    const lastActivity = new Date(dateString)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - lastActivity.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysAgo = getDaysAgo(streak.lastActivityDate)
  const isRecent = daysAgo !== null && daysAgo <= 1

  return (
    <Card className={`
      group relative overflow-hidden transition-all duration-500 ease-out
      hover:shadow-2xl hover:shadow-${streak.color}-500/10 hover:scale-[1.02] cursor-pointer
      bg-gradient-to-br from-gray-950/95 via-gray-900/95 to-gray-800/95 
      backdrop-blur-sm border-gray-800/50 hover:border-${streak.color}-500/30
      ${!streak.isActive ? 'opacity-70' : ''}
      min-h-[320px]
    `}>
      {/* Animated gradient overlay */}
      <div className={`
        absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700
        bg-gradient-to-br from-${streak.color}-600/5 via-transparent to-${streak.color}-500/5
      `} />
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`
          absolute -top-4 -right-4 w-24 h-24 rounded-full 
          bg-gradient-to-br from-${streak.color}-500/10 to-transparent
          group-hover:scale-150 transition-transform duration-1000 ease-out
        `} />
        <div className={`
          absolute -bottom-6 -left-6 w-32 h-32 rounded-full 
          bg-gradient-to-tr from-${streak.color}-400/5 to-transparent
          group-hover:scale-125 group-hover:rotate-45 transition-all duration-1000 ease-out
        `} />
      </div>

      <CardContent className="p-6 h-full flex flex-col relative z-10">
        {/* Header with icon and actions */}
        <div className="flex items-start justify-between mb-6">
          {/* Fire emoji icon with animations */}
          <div className="relative transition-all duration-300 group-hover:scale-110">
            <div 
              className={`
                text-4xl transition-all duration-300 drop-shadow-lg
                ${isRecent ? 'animate-pulse' : 'opacity-60'}
              `}
              style={{
                filter: isRecent ? 'brightness(1.2) contrast(1.1)' : 'grayscale(100%) brightness(0.7)',
                animation: isRecent ? 'pulse 2s ease-in-out infinite' : 'none'
              }}
            >
              🔥
            </div>
            
            {/* Glow effect for active streaks */}
            {isRecent && (
              <div className="absolute inset-0 bg-orange-400/30 rounded-full blur-lg animate-pulse"></div>
            )}
          </div>
          
          {/* Action menu - appears on hover */}
          <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(streak)
              }}
              className="h-8 w-8 p-0 text-gray-500 hover:text-white hover:bg-gray-700/80 backdrop-blur-sm border border-gray-700/50"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(streak.id)
              }}
              className="h-8 w-8 p-0 text-gray-500 hover:text-red-400 hover:bg-red-900/20 backdrop-blur-sm border border-gray-700/50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Streak count with animated emphasis */}
        <div className="text-center mb-6 group-hover:scale-105 transition-transform duration-300">
          <div className={`
            text-7xl font-black leading-none mb-2 transition-all duration-500
            bg-gradient-to-br from-white via-gray-100 to-gray-300 bg-clip-text text-transparent
            group-hover:from-${streak.color}-200 group-hover:via-white group-hover:to-${streak.color}-100
            drop-shadow-lg
          `}>
            {streak.currentStreak}
          </div>
          <div className="text-gray-400 font-medium text-sm uppercase tracking-wider">
            Day{streak.currentStreak !== 1 ? 's' : ''} Strong
          </div>
        </div>

        {/* Streak info */}
        <div className="text-center mb-6">
          <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-gray-100 transition-colors">
            {streak.name}
          </h3>
          <Badge 
            variant="secondary" 
            className={`
              bg-${streak.color}-500/10 text-${streak.color}-300 border-${streak.color}-500/20
              hover:bg-${streak.color}-500/20 transition-colors
            `}
          >
            {streak.category}
          </Badge>
        </div>

        <Separator className="bg-gray-700/50 mb-6" />

        {/* Status indicator with animated fire SVG */}
        <div className="flex items-center justify-center gap-3 text-sm mb-6">
          {streak.isActive ? (
            <>
              {isRecent ? (
                <>
                  {/* Fire emoji for active today */}
                  <div className="relative">
                    <span 
                      className="text-lg drop-shadow-lg"
                      style={{
                        filter: 'brightness(1.2) contrast(1.1)',
                        animation: 'pulse 2s ease-in-out infinite'
                      }}
                    >
                      🔥
                    </span>
                    
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-orange-400/20 rounded-full blur-sm animate-pulse"></div>
                  </div>
                  <span className="text-orange-400 font-medium">On Fire Today!</span>
                </>
              ) : (
                <>
                  {/* Grey fire emoji for inactive days */}
                  <div className="relative">
                    <span 
                      className="text-base"
                      style={{
                        filter: 'grayscale(100%) brightness(0.7)',
                        opacity: '0.6'
                      }}
                    >
                      🔥
                    </span>
                  </div>
                  <span className="text-gray-500 font-medium">
                    {daysAgo} {daysAgo === 1 ? 'day' : 'days'} ago
                  </span>
                </>
              )}
            </>
          ) : (
            <>
              {/* Grey fire emoji for inactive streaks */}
              <div className="relative">
                <span 
                  className="text-base"
                  style={{
                    filter: 'grayscale(100%) brightness(0.5)',
                    opacity: '0.4'
                  }}
                >
                  🔥
                </span>
              </div>
              <span className="text-gray-600">Streak Paused</span>
            </>
          )}
        </div>

        {/* Action buttons with enhanced styling */}
        <div className="mt-auto space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button 
              size="sm" 
              className={`
                bg-gradient-to-r from-emerald-500 to-green-600 
                hover:from-emerald-600 hover:to-green-700 
                text-white border-0 rounded-xl font-semibold
                shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40
                transform hover:scale-105 transition-all duration-200
              `}
              onClick={(e) => {
                e.stopPropagation()
                onComplete(streak.id)
              }}
            >
              <Check className="w-4 h-4 mr-2" />
              Complete
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className={`
                border-gray-600 text-gray-300 hover:bg-gray-700/80 hover:text-white 
                rounded-xl font-semibold backdrop-blur-sm
                transform hover:scale-105 transition-all duration-200
              `}
              onClick={(e) => {
                e.stopPropagation()
                onReset(streak.id)
              }}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`
              w-full text-gray-400 hover:text-white hover:bg-gray-700/50 
              rounded-xl font-medium backdrop-blur-sm border border-gray-700/30
              hover:border-gray-600/50 transition-all duration-200
            `}
            onClick={() => onView(streak.id)}
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>

      {/* Decorative elements */}
      <div className="absolute bottom-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
        <IconComponent className="w-12 h-12 text-gray-400" />
      </div>
      
      {/* Subtle border glow effect */}
      <div className={`
        absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500
        shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]
      `} />
    </Card>
  )
}

// Add new streak card with elegant design
const AddStreakCard: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <Card 
      className="
        group cursor-pointer transition-all duration-500 ease-out
        hover:shadow-2xl hover:shadow-blue-500/10 hover:scale-[1.02]
        border-2 border-dashed border-gray-700/50 hover:border-blue-500/30
        bg-gradient-to-br from-gray-950/50 via-gray-900/50 to-gray-800/50
        backdrop-blur-sm min-h-[320px] flex items-center justify-center
        relative overflow-hidden
      "
      onClick={onClick}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br from-blue-600/5 via-transparent to-purple-500/5" />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/10 to-transparent group-hover:scale-150 transition-transform duration-1000 ease-out" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-gradient-to-tr from-purple-400/5 to-transparent group-hover:scale-125 group-hover:rotate-45 transition-all duration-1000 ease-out" />
      </div>

      <CardContent className="text-center p-6 relative z-10">
        <div className="mb-6">
          <div className="
            w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-500/20 via-purple-600/15 to-blue-700/10
            border-2 border-blue-500/20 group-hover:border-blue-400/40 
            flex items-center justify-center transition-all duration-300 group-hover:scale-110
            shadow-lg shadow-blue-500/10
          ">
            <Plus className="w-8 h-8 text-blue-400 group-hover:text-blue-300 transition-colors group-hover:rotate-90 duration-300" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-gray-100 transition-colors">
          Add New Streak
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          Start tracking a new goal and build consistent habits
        </p>
        
        {/* Subtle call-to-action indicator */}
        <div className="mt-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <div className="text-xs text-blue-400 font-medium uppercase tracking-wider">
            Click to Create
          </div>
        </div>
      </CardContent>
      
      {/* Subtle border glow effect */}
      <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]" />
    </Card>
  )
}

// Empty state component with elegant design
const EmptyState: React.FC<{ onAddStreak: () => void }> = ({ onAddStreak }) => {
  return (
    <div className="text-center py-16 px-6">
      <div className="relative mx-auto w-32 h-32 mb-8">
        {/* Animated background circles */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/10 via-purple-600/5 to-blue-700/10 animate-pulse"></div>
        <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 flex items-center justify-center">
          <Target className="w-16 h-16 text-gray-400" />
        </div>
        
        {/* Floating particles */}
        <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-blue-400/20 animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="absolute -bottom-1 -left-1 w-3 h-3 rounded-full bg-purple-400/20 animate-bounce" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-4 -left-3 w-2 h-2 rounded-full bg-green-400/30 animate-bounce" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <h3 className="text-2xl font-bold text-white mb-4">
        Ready to Start Your Journey?
      </h3>
      <p className="text-gray-400 mb-8 max-w-lg mx-auto leading-relaxed">
        Build lasting habits with our streak tracking system. Whether it's exercise, learning, 
        coding practice, or personal growth - start small, stay consistent, and watch your 
        progress compound over time.
      </p>
      
      <div className="space-y-4">
        <Button 
          onClick={onAddStreak} 
          className="
            gap-3 px-8 py-3 text-lg font-semibold
            bg-gradient-to-r from-blue-500 to-purple-600 
            hover:from-blue-600 hover:to-purple-700 
            shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40
            transform hover:scale-105 transition-all duration-200
            rounded-xl
          "
        >
          <Plus className="w-5 h-5" />
          Create Your First Streak
        </Button>
        
        <div className="text-xs text-gray-500 uppercase tracking-wider">
          Join thousands building better habits
        </div>
      </div>
    </div>
  )
}

// Main component
export const StreakGridDashboard: React.FC<StreakGridDashboardProps> = ({ 
  userId, 
  className = "" 
}) => {
  const [streaks, setStreaks] = useState<StreakCard[]>([])
  const [predefinedTypes, setPredefinedTypes] = useState<PredefinedStreakType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [editingStreak, setEditingStreak] = useState<StreakCard | null>(null)
  const [actionStreak, setActionStreak] = useState<StreakCard | null>(null)
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  
  // Form states
  const [createForm, setCreateForm] = useState<CreateStreakPayload>({
    name: "",
    streak_type_id: "",
    icon: "Target",
    color: "blue",
    category: "",
    description: ""
  })

  useEffect(() => {
    loadData()
  }, [userId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load streaks and predefined types in parallel
      const [streaksResponse, typesResponse] = await Promise.all([
        fetch(`/api/streaks?userId=${userId}`),
        fetch('/api/streak-types')
      ])

      if (!streaksResponse.ok || !typesResponse.ok) {
        throw new Error('Failed to load data')
      }

      const [streaksData, typesData] = await Promise.all([
        streaksResponse.json(),
        typesResponse.json()
      ])

      setStreaks(streaksData.streaks || [])
      setPredefinedTypes(typesData.types || [])

    } catch (err) {
      console.error('Error loading streak data:', err)
      setError('Failed to load streak data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateStreak = async () => {
    try {
      const response = await fetch('/api/streaks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...createForm
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create streak')
      }

      const newStreak = await response.json()
      setStreaks(prev => [...prev, newStreak.streak])
      setShowCreateModal(false)
      resetCreateForm()
    } catch (err) {
      console.error('Error creating streak:', err)
    }
  }

  const handleEditStreak = async () => {
    if (!editingStreak) return

    try {
      const response = await fetch(`/api/streaks/${editingStreak.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm)
      })

      if (!response.ok) {
        throw new Error('Failed to update streak')
      }

      const updatedStreak = await response.json()
      setStreaks(prev => 
        prev.map(s => s.id === editingStreak.id ? updatedStreak.streak : s)
      )
      setShowEditModal(false)
      setEditingStreak(null)
      resetCreateForm()
    } catch (err) {
      console.error('Error updating streak:', err)
    }
  }

  const handleDeleteStreak = async (streakId: string) => {
    if (!confirm('Are you sure you want to delete this streak? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/streaks/${streakId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete streak')
      }

      setStreaks(prev => prev.filter(s => s.id !== streakId))
    } catch (err) {
      console.error('Error deleting streak:', err)
    }
  }

  const handleViewStreak = (streakId: string) => {
    // Navigate to individual streak detail view
    window.location.href = `/streaks/${streakId}`
  }

  const handleCompleteStreak = (streakId: string) => {
    const streak = streaks.find(s => s.id === streakId)
    if (streak) {
      setActionStreak(streak)
      setShowCompleteModal(true)
    }
  }

  const handleResetStreak = (streakId: string) => {
    const streak = streaks.find(s => s.id === streakId)
    if (streak) {
      setActionStreak(streak)
      setShowResetModal(true)
    }
  }

  const confirmCompleteStreak = async () => {
    if (!actionStreak) return

    try {
      const response = await fetch(`/api/streaks/${actionStreak.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) {
        throw new Error('Failed to complete streak')
      }

      const updatedStreak = await response.json()
      setStreaks(prev => 
        prev.map(s => s.id === actionStreak.id ? updatedStreak.streak : s)
      )
      
      setShowCompleteModal(false)
      setActionStreak(null)
    } catch (err) {
      console.error('Error completing streak:', err)
    }
  }

  const confirmResetStreak = async () => {
    if (!actionStreak) return

    try {
      const response = await fetch(`/api/streaks/${actionStreak.id}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) {
        throw new Error('Failed to reset streak')
      }

      const updatedStreak = await response.json()
      setStreaks(prev => 
        prev.map(s => s.id === actionStreak.id ? updatedStreak.streak : s)
      )
      
      setShowResetModal(false)
      setActionStreak(null)
    } catch (err) {
      console.error('Error resetting streak:', err)
    }
  }

  const handleEditClick = (streak: StreakCard) => {
    setEditingStreak(streak)
    setCreateForm({
      name: streak.name,
      streak_type_id: "", // Will be populated from predefined types
      icon: streak.icon,
      color: streak.color,
      category: streak.category,
      description: ""
    })
    setShowEditModal(true)
  }

  const resetCreateForm = () => {
    setCreateForm({
      name: "",
      streak_type_id: "",
      icon: "Target",
      color: "blue",
      category: "",
      description: ""
    })
  }

  const handlePredefinedTypeSelect = (typeId: string) => {
    const selectedType = predefinedTypes.find(t => t.id === typeId)
    if (selectedType) {
      setCreateForm(prev => ({
        ...prev,
        streak_type_id: typeId,
        name: selectedType.name,
        icon: selectedType.defaultIcon,
        color: selectedType.defaultColor,
        category: selectedType.category,
        description: selectedType.description
      }))
    }
  }

  // Filter streaks based on search and category
  const filteredStreaks = streaks.filter(streak => {
    const matchesSearch = streak.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || streak.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  // Get unique categories for filter dropdown
  const categories = Array.from(new Set(streaks.map(s => s.category)))

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadData}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Streaks</h1>
          <p className="text-muted-foreground">Track your daily goals and build consistency</p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search streaks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Streaks grid */}
      {streaks.length === 0 ? (
        <EmptyState onAddStreak={() => setShowCreateModal(true)} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredStreaks.map((streak) => (
            <StreakCardComponent
              key={streak.id}
              streak={streak}
              onEdit={handleEditClick}
              onDelete={handleDeleteStreak}
              onView={handleViewStreak}
              onComplete={handleCompleteStreak}
              onReset={handleResetStreak}
            />
          ))}

          <AddStreakCard onClick={() => setShowCreateModal(true)} />
        </div>
      )}

      {/* Create Streak Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Streak</DialogTitle>
            <DialogDescription>
              Choose a predefined streak type or create a custom one
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Streak Type</label>
              <Select value={createForm.streak_type_id} onValueChange={handlePredefinedTypeSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a streak type" />
                </SelectTrigger>
                <SelectContent>
                  {predefinedTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} - {type.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter streak name"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={createForm.description}
                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What is this streak about?"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateStreak} disabled={!createForm.name.trim()}>
              Create Streak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Streak Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Streak</DialogTitle>
            <DialogDescription>
              Update your streak settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter streak name"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={createForm.description}
                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What is this streak about?"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditStreak} disabled={!createForm.name.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Streak Confirmation Modal */}
      <Dialog open={showCompleteModal} onOpenChange={setShowCompleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Streak</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark "{actionStreak?.name}" as completed for today? 
              This will increase your streak count by 1.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            <div>
              <div className="font-medium text-green-800 dark:text-green-200">
                Current Streak: {actionStreak?.currentStreak} days
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">
                Will become: {(actionStreak?.currentStreak || 0) + 1} days
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteModal(false)}>
              Cancel
            </Button>
            <Button onClick={confirmCompleteStreak} className="bg-green-600 hover:bg-green-700">
              <Check className="w-4 h-4 mr-2" />
              Complete Streak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Streak Confirmation Modal */}
      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Streak</DialogTitle>
            <DialogDescription>
              Are you sure you want to reset "{actionStreak?.name}"? 
              This will set your current streak count back to 0. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950 rounded-lg">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            <div>
              <div className="font-medium text-red-800 dark:text-red-200">
                Current Streak: {actionStreak?.currentStreak} days
              </div>
              <div className="text-sm text-red-600 dark:text-red-400">
                Will become: 0 days
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetModal(false)}>
              Cancel
            </Button>
            <Button onClick={confirmResetStreak} variant="destructive">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Streak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}