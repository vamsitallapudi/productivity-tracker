export interface Database {
  public: {
    Tables: {
      streak_types: {
        Row: {
          id: string
          name: string
          default_icon: string
          default_color: string
          category: string
          description: string
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          default_icon: string
          default_color: string
          category: string
          description: string
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          default_icon?: string
          default_color?: string
          category?: string
          description?: string
          is_default?: boolean
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          name: string
          category: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          created_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          task: string
          duration_minutes: number
          efficiency_percentage: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          task: string
          duration_minutes: number
          efficiency_percentage: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          task?: string
          duration_minutes?: number
          efficiency_percentage?: number
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string
          display_name: string | null
          email_preferences: {
            session_reminders: boolean
            weekly_summaries: boolean
            achievement_notifications: boolean
          }
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          display_name?: string | null
          email_preferences?: {
            session_reminders: boolean
            weekly_summaries: boolean
            achievement_notifications: boolean
          }
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          display_name?: string | null
          email_preferences?: {
            session_reminders: boolean
            weekly_summaries: boolean
            achievement_notifications: boolean
          }
          created_at?: string
          updated_at?: string
        }
      }
      user_streaks: {
        Row: {
          id: string
          user_id: string
          name: string
          streak_type_id: string
          streak_type: string
          icon: string
          color: string
          category: string
          description: string
          current_streak: number
          longest_streak: number
          last_activity_date: string | null
          streak_start_date: string | null
          freeze_count: number
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          streak_type_id: string
          streak_type?: string
          icon: string
          color: string
          category: string
          description: string
          current_streak?: number
          longest_streak?: number
          last_activity_date?: string | null
          streak_start_date?: string | null
          freeze_count?: number
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          streak_type_id?: string
          streak_type?: string
          icon?: string
          color?: string
          category?: string
          description?: string
          current_streak?: number
          longest_streak?: number
          last_activity_date?: string | null
          streak_start_date?: string | null
          freeze_count?: number
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      streak_achievements: {
        Row: {
          id: string
          user_id: string
          streak_id: string | null
          achievement_type: string
          achievement_name: string
          unlocked_at: string
          metadata: Record<string, any>
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          streak_id?: string | null
          achievement_type: string
          achievement_name: string
          unlocked_at?: string
          metadata?: Record<string, any>
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          streak_id?: string | null
          achievement_type?: string
          achievement_name?: string
          unlocked_at?: string
          metadata?: Record<string, any>
          created_at?: string
        }
      }
      daily_activities: {
        Row: {
          id: string
          user_id: string
          streak_id: string
          activity_date: string
          session_count: number
          total_minutes: number
          streak_eligible: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          streak_id: string
          activity_date: string
          session_count?: number
          total_minutes?: number
          streak_eligible?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          streak_id?: string
          activity_date?: string
          session_count?: number
          total_minutes?: number
          streak_eligible?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Utility types for user profiles
export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type EmailPreferences = {
  session_reminders: boolean
  weekly_summaries: boolean
  achievement_notifications: boolean
}

export type UserProfile = {
  id: string
  email: string
  name: string
  display_name: string | null
  email_preferences: EmailPreferences
}

// Type for profile update payload
export type ProfileUpdatePayload = {
  display_name?: string
  email_preferences?: Partial<EmailPreferences>
}

// Utility types for streak types
export type StreakType = Database['public']['Tables']['streak_types']['Row']
export type StreakTypeInsert = Database['public']['Tables']['streak_types']['Insert']
export type StreakTypeUpdate = Database['public']['Tables']['streak_types']['Update']

// Utility types for streak functionality
export type UserStreak = Database['public']['Tables']['user_streaks']['Row']
export type UserStreakInsert = Database['public']['Tables']['user_streaks']['Insert']
export type UserStreakUpdate = Database['public']['Tables']['user_streaks']['Update']

export type StreakAchievement = Database['public']['Tables']['streak_achievements']['Row']
export type StreakAchievementInsert = Database['public']['Tables']['streak_achievements']['Insert']

export type DailyActivity = Database['public']['Tables']['daily_activities']['Row']
export type DailyActivityInsert = Database['public']['Tables']['daily_activities']['Insert']
export type DailyActivityUpdate = Database['public']['Tables']['daily_activities']['Update']

// Enhanced streak-specific types
export type StreakFrequency = 'daily' | 'weekly' | 'monthly'

export type AchievementType = 'milestone' | 'consistency' | 'special' | 'cross-streak'

export type StreakData = {
  id: string
  name: string
  icon: string
  color: string
  category: string
  description: string
  currentStreak: number
  longestStreak: number
  lastActivityDate?: string
  streakStartDate?: string
  freezeCount: number
  isActive: boolean
  displayOrder: number
}

export type StreakCard = {
  id: string
  name: string
  icon: string
  color: string
  category: string
  currentStreak: number
  isActive: boolean
  displayOrder: number
  lastActivityDate?: string
}

export type PredefinedStreakType = {
  id: string
  name: string
  defaultIcon: string
  defaultColor: string
  category: string
  description: string
}

export type CreateStreakPayload = {
  name: string
  streak_type_id: string
  icon: string
  color: string
  category: string
  description: string
}

export type UpdateStreakPayload = {
  name?: string
  icon?: string
  color?: string
  description?: string
}

export type StreakStats = {
  current: number
  longest: number
  totalDays: number
  totalSessions: number
  totalMinutes: number
  weeklyAverage: number
  monthlyAverage: number
}

export type Achievement = {
  id: string
  type: AchievementType
  name: string
  description: string
  icon?: string
  unlockedAt: string
  metadata: Record<string, any>
}

export type StreakCalendarData = {
  date: string
  sessionCount: number
  totalMinutes: number
  streakEligible: boolean
  intensity: 'none' | 'low' | 'medium' | 'high'
}
