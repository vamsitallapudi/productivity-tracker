"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Save,
  User,
  Mail,
  Bell,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DashboardLayout } from "@/components/dashboard-layout"
import type { UserProfile, EmailPreferences } from "@/lib/database.types"

// Form validation schema
const ProfileFormSchema = z.object({
  display_name: z.string().min(1, "Display name is required").max(100, "Display name must be less than 100 characters"),
  email_preferences: z.object({
    session_reminders: z.boolean(),
    weekly_summaries: z.boolean(),
    achievement_notifications: z.boolean(),
  }),
})

type ProfileFormData = z.infer<typeof ProfileFormSchema>

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: {
      display_name: "",
      email_preferences: {
        session_reminders: true,
        weekly_summaries: true,
        achievement_notifications: true,
      },
    },
  })

  const watchedPreferences = watch("email_preferences")

  // Fetch profile data on component mount
  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/profile')
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch profile')
      }
      
      const profileData: UserProfile = result.data
      setProfile(profileData)
      
      // Update form with fetched data
      setValue("display_name", profileData.display_name || profileData.name)
      setValue("email_preferences", profileData.email_preferences)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile')
      }
      
      setProfile(result.data)
      setSuccess('Profile updated successfully!')
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePreferenceChange = (key: keyof EmailPreferences, value: boolean) => {
    setValue(`email_preferences.${key}`, value, { shouldDirty: true })
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading profile...
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
            <p className="text-muted-foreground mt-2">
              Manage your profile information and notification preferences
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your profile details and display preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback className="text-lg">
                    {profile?.display_name?.charAt(0) || profile?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{profile?.display_name || profile?.name}</h3>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                </div>
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  {...register("display_name")}
                  placeholder="Enter your display name"
                  className={errors.display_name ? "border-red-500" : ""}
                />
                {errors.display_name && (
                  <p className="text-sm text-red-500">{errors.display_name.message}</p>
                )}
              </div>

              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={profile?.email || ""}
                  disabled
                  className="bg-gray-50 dark:bg-gray-900"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed from this interface
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Email Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Email Preferences
              </CardTitle>
              <CardDescription>
                Choose which email notifications you'd like to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Session Reminders */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="session_reminders" className="text-sm font-medium">
                    Session Reminders
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when it's time to start a focus session
                  </p>
                </div>
                <Switch
                  id="session_reminders"
                  checked={watchedPreferences.session_reminders}
                  onCheckedChange={(checked) => 
                    handlePreferenceChange("session_reminders", checked)
                  }
                />
              </div>

              {/* Weekly Summaries */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="weekly_summaries" className="text-sm font-medium">
                    Weekly Summaries
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive weekly reports of your productivity and achievements
                  </p>
                </div>
                <Switch
                  id="weekly_summaries"
                  checked={watchedPreferences.weekly_summaries}
                  onCheckedChange={(checked) => 
                    handlePreferenceChange("weekly_summaries", checked)
                  }
                />
              </div>

              {/* Achievement Notifications */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="achievement_notifications" className="text-sm font-medium">
                    Achievement Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when you reach milestones and complete goals
                  </p>
                </div>
                <Switch
                  id="achievement_notifications"
                  checked={watchedPreferences.achievement_notifications}
                  onCheckedChange={(checked) => 
                    handlePreferenceChange("achievement_notifications", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={!isDirty || saving}
              className="flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}