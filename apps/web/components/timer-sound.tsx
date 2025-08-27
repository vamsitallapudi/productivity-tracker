"use client"

import { useEffect, useRef } from 'react'

interface TimerSoundProps {
  shouldPlay: boolean
  onPlayed?: () => void
}

export function TimerSound({ shouldPlay, onPlayed }: TimerSoundProps) {
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (shouldPlay && audioRef.current) {
      // Play the chime sound
      audioRef.current.play().catch(error => {
        console.log('Audio play failed:', error)
        // Still call onPlayed even if audio fails
        onPlayed?.()
      })
    }
  }, [shouldPlay, onPlayed])

  return (
    <audio
      ref={audioRef}
      onEnded={() => onPlayed?.()}
      preload="auto"
    >
      <source src="/timer-complete.mp3" type="audio/mpeg" />
      <source src="/timer-complete.wav" type="audio/wav" />
    </audio>
  )
}

// Fallback function to create a beep sound if audio files don't exist
export function playBeepSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime) // 800Hz frequency
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime) // Volume
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  } catch (error) {
    console.log('Could not play beep sound:', error)
  }
}
