"use client"

import { useState, useEffect } from "react"
import { X, Play, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import type { Database } from "@/lib/database.types"

type Task = Database['public']['Tables']['tasks']['Row']

interface SessionSetupModalProps {
  isOpen: boolean
  onClose: () => void
  onStartSession: (taskName: string, duration: number) => void
  defaultTask?: string
}

const durationOptions = [
  { value: 25, label: "25 min (Pomodoro)" },
  { value: 50, label: "50 min (Deep Work)" },
  { value: 90, label: "90 min (Extended)" },
]

export function SessionSetupModal({ isOpen, onClose, onStartSession, defaultTask }: SessionSetupModalProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState("")
  const [customTask, setCustomTask] = useState("")
  const [duration, setDuration] = useState(25)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchTasks()
      // Set default task if provided
      if (defaultTask) {
        setSelectedTask(defaultTask)
      }
    }
  }, [isOpen, defaultTask])

  async function fetchTasks() {
    try {
      console.log('Fetching tasks from database...')
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('name')
      
      if (error) {
        console.error('Supabase error fetching tasks:', error)
        throw error
      }
      
             console.log('Tasks fetched successfully:', data)
       console.log('Setting tasks in dropdown:', data?.map((t: any) => t.name))
       setTasks(data || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
             // Fallback to hardcoded tasks if database fails
       const fallbackTasks = [
         { id: '1', name: 'Project Planning', category: 'Planning', created_at: new Date().toISOString() },
         { id: '2', name: 'Code Review', category: 'Development', created_at: new Date().toISOString() },
         { id: '3', name: 'Design Work', category: 'Design', created_at: new Date().toISOString() },
         { id: '4', name: 'Email Processing', category: 'Communication', created_at: new Date().toISOString() },
         { id: '5', name: 'Research', category: 'Learning', created_at: new Date().toISOString() },
         { id: '6', name: 'Bug Fixing', category: 'Development', created_at: new Date().toISOString() },
         { id: '7', name: 'Documentation', category: 'Writing', created_at: new Date().toISOString() },
         { id: '8', name: 'Team Meeting', category: 'Communication', created_at: new Date().toISOString() },
         { id: '9', name: 'Data Analysis', category: 'Analysis', created_at: new Date().toISOString() },
         { id: '10', name: 'Testing', category: 'Quality Assurance', created_at: new Date().toISOString() }
       ] as any
       setTasks(fallbackTasks)
    }
  }

  async function handleStartSession() {
    const taskName = selectedTask === "custom" ? customTask : selectedTask
    if (!taskName.trim()) return
    
    setLoading(true)
    
    // If it's a custom task, save it to the database
    if (selectedTask === "custom" && customTask.trim()) {
      try {
        console.log('Saving custom task to database:', customTask)
        
        // First check if the task already exists
        const { data: existingTask, error: checkError } = await supabase
          .from('tasks')
          .select('id')
          .eq('name', customTask.trim())
          .maybeSingle() // Use maybeSingle instead of single to avoid errors
        
        if (checkError) {
          console.error('Error checking for existing task:', checkError)
        }
        
        // Only insert if task doesn't exist
        if (!existingTask) {
          const { error } = await supabase
            .from('tasks')
            .insert({
              name: customTask.trim(),
              category: 'Custom'
            } as any)
          
                     if (error) {
             console.error('Error saving custom task:', error)
             // Continue anyway - the session will still start
           } else {
             console.log('Custom task saved successfully')
             
             // Verify the task was saved by querying it directly
             const { data: verifyData, error: verifyError } = await supabase
               .from('tasks')
               .select('*')
               .eq('name', customTask.trim())
               .maybeSingle()
             
             if (verifyData) {
               console.log('Task verified in database:', verifyData)
             } else {
               console.log('Task not found in database after save')
             }
             
             // Refresh the tasks list to include the new task
             await fetchTasks()
           }
        } else {
          console.log('Task already exists, skipping save')
        }
      } catch (error) {
        console.error('Error saving custom task:', error)
        // Continue anyway - the session will still start
      }
    }
    
    onStartSession(taskName, duration)
    setLoading(false)
    onClose()
    
    // Reset form
    setSelectedTask("")
    setCustomTask("")
    setDuration(25)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold dark:text-white">Start Focus Session</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="dark:text-gray-300"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Task Selection */}
          <div>
            <Label htmlFor="task" className="text-sm font-medium dark:text-gray-300">
              What are you working on?
            </Label>
            <Select value={selectedTask} onValueChange={setSelectedTask}>
              <SelectTrigger className="mt-1 dark:bg-gray-800 dark:border-gray-600">
                <SelectValue placeholder="Select a task or create custom" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-600">
                {tasks.map((task) => (
                  <SelectItem key={task.id} value={task.name}>
                    {task.name}
                  </SelectItem>
                ))}
                <SelectItem value="custom">+ Add custom task</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Task Input */}
          {selectedTask === "custom" && (
            <div>
              <Label htmlFor="customTask" className="text-sm font-medium dark:text-gray-300">
                Custom Task Name
              </Label>
              <Input
                id="customTask"
                value={customTask}
                onChange={(e) => setCustomTask(e.target.value)}
                placeholder="Enter task name..."
                className="mt-1 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            </div>
          )}

          {/* Duration Selection */}
          <div>
            <Label htmlFor="duration" className="text-sm font-medium dark:text-gray-300">
              Session Duration
            </Label>
            <Select value={duration.toString()} onValueChange={(value) => setDuration(Number(value))}>
              <SelectTrigger className="mt-1 dark:bg-gray-800 dark:border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-600">
                {durationOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 dark:border-gray-600 dark:text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartSession}
              disabled={!selectedTask || (selectedTask === "custom" && !customTask.trim()) || loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Session
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
