import { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, Coffee, Zap } from 'lucide-react'
import { Button } from './Button'

type TimerMode = 'focus' | 'break'

interface PomodoroTimerProps {
  onComplete?: (mode: TimerMode) => void
  focusMinutes?: number
  breakMinutes?: number
}

export function PomodoroTimer({ 
  onComplete, 
  focusMinutes = 25, 
  breakMinutes = 5 
}: PomodoroTimerProps) {
  const [mode, setMode] = useState<TimerMode>('focus')
  const [timeLeft, setTimeLeft] = useState(focusMinutes * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [sessionsCompleted, setSessionsCompleted] = useState(0)
  const intervalRef = useRef<number>()

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft])

  function handleTimerComplete() {
    setIsRunning(false)
    
    // Play sound (optional)
    playNotificationSound()
    
    if (mode === 'focus') {
      setSessionsCompleted(prev => prev + 1)
      onComplete?.('focus')
    } else {
      onComplete?.('break')
    }

    // Auto-switch mode
    if (mode === 'focus') {
      setMode('break')
      setTimeLeft(breakMinutes * 60)
    } else {
      setMode('focus')
      setTimeLeft(focusMinutes * 60)
    }
  }

  function playNotificationSound() {
    // Simple beep using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  }

  function toggleTimer() {
    setIsRunning(!isRunning)
  }

  function resetTimer() {
    setIsRunning(false)
    setTimeLeft(mode === 'focus' ? focusMinutes * 60 : breakMinutes * 60)
  }

  function switchMode(newMode: TimerMode) {
    setMode(newMode)
    setIsRunning(false)
    setTimeLeft(newMode === 'focus' ? focusMinutes * 60 : breakMinutes * 60)
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const progress = mode === 'focus'
    ? ((focusMinutes * 60 - timeLeft) / (focusMinutes * 60)) * 100
    : ((breakMinutes * 60 - timeLeft) / (breakMinutes * 60)) * 100

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-dark-secondary to-brand-dark-tertiary border border-white/10">
      {/* Mode Switcher */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => switchMode('focus')}
          className={`
            flex-1 py-2 px-4 rounded-xl font-semibold transition-all duration-300
            ${mode === 'focus' 
              ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white' 
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }
          `}
        >
          <div className="flex items-center justify-center gap-2">
            <Zap className="w-4 h-4" />
            <span>Foco</span>
          </div>
        </button>
        <button
          onClick={() => switchMode('break')}
          className={`
            flex-1 py-2 px-4 rounded-xl font-semibold transition-all duration-300
            ${mode === 'break' 
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }
          `}
        >
          <div className="flex items-center justify-center gap-2">
            <Coffee className="w-4 h-4" />
            <span>Pausa</span>
          </div>
        </button>
      </div>

      {/* Timer Display */}
      <div className="relative mb-6">
        {/* Circular Progress */}
        <svg className="w-full max-w-xs mx-auto" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke={mode === 'focus' ? 'url(#gradient-purple)' : 'url(#gradient-green)'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${progress * 5.65} 565`}
            transform="rotate(-90 100 100)"
            className="transition-all duration-1000 ease-linear"
          />
          <defs>
            <linearGradient id="gradient-purple" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
            <linearGradient id="gradient-green" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
        </svg>

        {/* Time Display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl font-bold font-mono mb-2">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <div className="text-sm text-gray-400 uppercase tracking-wider">
              {mode === 'focus' ? '⚡ Modo Foco' : '☕ Pausa'}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <Button
          onClick={toggleTimer}
          variant="primary"
          size="lg"
          icon={isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        >
          {isRunning ? 'Pausar' : 'Iniciar'}
        </Button>
        <Button
          onClick={resetTimer}
          variant="ghost"
          size="lg"
          icon={<RotateCcw className="w-5 h-5" />}
        >
          Reset
        </Button>
      </div>

      {/* Stats */}
      <div className="text-center">
        <p className="text-sm text-gray-400">
          Sessões completadas hoje: <span className="font-bold text-brand-purple">{sessionsCompleted}</span>
        </p>
      </div>
    </div>
  )
}
