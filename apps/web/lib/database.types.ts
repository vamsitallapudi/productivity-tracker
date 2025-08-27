export interface Database {
  public: {
    Tables: {
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
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          created_at?: string
        }
      }
    }
  }
}
