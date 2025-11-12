import { supabase } from './supabase'
import type { 
  User, 
  UserProfile, 
  ProfileUpdatePayload, 
  EmailPreferences 
} from './database.types'

/**
 * Error types for profile operations
 */
export class ProfileError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'ProfileError'
  }
}

/**
 * Fetch user profile by user ID
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, display_name, email_preferences')
      .eq('id', userId)
      .single()

    if (error) {
      throw new ProfileError(`Failed to fetch user profile: ${error.message}`, error.code)
    }

    if (!data) {
      throw new ProfileError('User profile not found', 'USER_NOT_FOUND')
    }

    return data as UserProfile
  } catch (error) {
    if (error instanceof ProfileError) {
      throw error
    }
    throw new ProfileError(`Unexpected error fetching profile: ${error}`)
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string, 
  updates: ProfileUpdatePayload
): Promise<UserProfile> {
  try {
    // Prepare the update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (updates.display_name !== undefined) {
      updateData.display_name = updates.display_name
    }

    if (updates.email_preferences) {
      // Get current preferences first
      const currentProfile = await getUserProfile(userId)
      updateData.email_preferences = {
        ...currentProfile.email_preferences,
        ...updates.email_preferences
      }
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('id, email, name, display_name, email_preferences')
      .single()

    if (error) {
      throw new ProfileError(`Failed to update profile: ${error.message}`, error.code)
    }

    if (!data) {
      throw new ProfileError('Profile update failed - no data returned', 'UPDATE_FAILED')
    }

    return data as UserProfile
  } catch (error) {
    if (error instanceof ProfileError) {
      throw error
    }
    throw new ProfileError(`Unexpected error updating profile: ${error}`)
  }
}

/**
 * Update email preferences only
 */
export async function updateEmailPreferences(
  userId: string,
  preferences: Partial<EmailPreferences>
): Promise<EmailPreferences> {
  try {
    const updatedProfile = await updateUserProfile(userId, {
      email_preferences: preferences
    })
    
    return updatedProfile.email_preferences
  } catch (error) {
    throw new ProfileError(`Failed to update email preferences: ${error}`)
  }
}

/**
 * Get user display name with fallback to regular name
 */
export function getDisplayName(user: User | UserProfile): string {
  return user.display_name || user.name
}

/**
 * Validate profile update payload
 */
export function validateProfileUpdate(updates: ProfileUpdatePayload): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Validate display_name
  if (updates.display_name !== undefined) {
    if (typeof updates.display_name !== 'string' && updates.display_name !== null) {
      errors.push('Display name must be a string or null')
    } else if (updates.display_name && updates.display_name.trim().length === 0) {
      errors.push('Display name cannot be empty')
    } else if (updates.display_name && updates.display_name.length > 100) {
      errors.push('Display name cannot exceed 100 characters')
    }
  }

  // Validate email_preferences
  if (updates.email_preferences) {
    const validKeys = ['session_reminders', 'weekly_summaries', 'achievement_notifications']
    
    for (const [key, value] of Object.entries(updates.email_preferences)) {
      if (!validKeys.includes(key)) {
        errors.push(`Invalid email preference key: ${key}`)
      } else if (typeof value !== 'boolean') {
        errors.push(`Email preference ${key} must be a boolean`)
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Get default email preferences
 */
export function getDefaultEmailPreferences(): EmailPreferences {
  return {
    session_reminders: true,
    weekly_summaries: true,
    achievement_notifications: true
  }
}