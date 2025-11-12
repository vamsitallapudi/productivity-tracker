import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database, StreakType } from '@/lib/database.types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Fetch all predefined streak types
    const { data: types, error } = await supabase
      .from('streak_types')
      .select('*')
      .eq('is_default', true)
      .order('category', { ascending: true })

    if (error) {
      console.error('Error fetching streak types:', error)
      return NextResponse.json(
        { error: 'Failed to fetch streak types' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      types: types || []
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}