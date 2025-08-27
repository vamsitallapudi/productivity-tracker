"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, Target } from 'lucide-react'

interface EfficiencyModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (efficiency: number) => void
  taskName: string
  duration: number
}

export function EfficiencyModal({ isOpen, onClose, onSave, taskName, duration }: EfficiencyModalProps) {
  const [efficiency, setEfficiency] = useState('85')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSave = async () => {
    const efficiencyNum = parseInt(efficiency)
    if (efficiencyNum < 0 || efficiencyNum > 100) {
      alert('Efficiency must be between 0 and 100')
      return
    }

    setIsSubmitting(true)
    try {
      await onSave(efficiencyNum)
      onClose()
    } catch (error) {
      console.error('Error saving session:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            <CardTitle>Session Complete!</CardTitle>
          </div>
          <CardDescription>
            How productive were you during this focus session?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Task:</strong> {taskName}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Duration:</strong> {duration} minutes
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="efficiency">Efficiency Percentage</Label>
            <div className="flex items-center gap-2">
              <Input
                id="efficiency"
                type="number"
                min="0"
                max="100"
                value={efficiency}
                onChange={(e) => setEfficiency(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="85"
                className="flex-1"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
            <div className="text-xs text-gray-500">
              Rate your productivity from 0-100%
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Quick Tips:</strong>
              <ul className="mt-1 space-y-1">
                <li>• 90-100%: Highly focused, no distractions</li>
                <li>• 70-89%: Mostly focused, minor interruptions</li>
                <li>• 50-69%: Somewhat distracted, moderate focus</li>
                <li>• 0-49%: Very distracted, low productivity</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Session
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
