import { useEffect, useRef, useState } from 'react'
import { Coffee, Pause, Play, RotateCcw, Zap } from 'lucide-react'
import { Button } from './Button'

type TimerMode = 'focus' | 'break'

interface PomodoroTimerProps {
  onComplete?: (mode: TimerMode) => void
  focusMinutes?: number
  breakMinutes?: number
}

export function PomodoroTimer({ onComplete, focusMinutes = 25, breakMinutes = 5 }: PomodoroTimerProps) {
  const [mode, setMode] = useState<TimerMode>('focus')
  const [timeLeft, setTimeLeft] = useState(focusMinutes * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [sessionsCompleted, setSessionsCompleted] = useState(0)
  const intervalRef = useRef<number>()

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft])

  function handleTimerComplete() {
    setIsRunning(false)
    playNotificationSound()

    if (mode === 'focus') {
      setSessionsCompleted((prev) => prev + 1)
      onComplete?.('focus')
      setMode('break')
      setTimeLeft(breakMinutes * 60)
      return
    }

    onComplete?.('break')
    setMode('focus')
    setTimeLeft(focusMinutes * 60)
  }

  function playNotificationSound() {
    const AudioContextConstructor =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextConstructor) return

    const audioContext = new AudioContextConstructor()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.25, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.4)
  }

  function toggleTimer() {
    setIsRunning((prev) => !prev)
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
  const totalSeconds = mode === 'focus' ? focusMinutes * 60 : breakMinutes * 60
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100

  return (
    <div className="surface-card rounded-2xl border p-6">
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => switchMode('focus')}
          className="flex-1 rounded-xl px-4 py-2 font-semibold transition-all duration-300"
          style={
            mode === 'focus'
              ? { background: 'var(--gradient-primary)', color: '#04131f' }
              : { background: 'rgba(8, 17, 33, 0.7)', color: 'var(--color-text-secondary)' }
          }
        >
          <div className="flex items-center justify-center gap-2">
            <Zap className="h-4 w-4" />
            <span>Foco</span>
          </div>
        </button>
        <button
          onClick={() => switchMode('break')}
          className="flex-1 rounded-xl px-4 py-2 font-semibold transition-all duration-300"
          style={
            mode === 'break'
              ? { background: 'linear-gradient(135deg, #34d399, #10b981)', color: '#04131f' }
              : { background: 'rgba(8, 17, 33, 0.7)', color: 'var(--color-text-secondary)' }
          }
        >
          <div className="flex items-center justify-center gap-2">
            <Coffee className="h-4 w-4" />
            <span>Pausa</span>
          </div>
        </button>
      </div>

      <div className="relative mb-6">
        <svg className="mx-auto w-full max-w-xs" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(139, 161, 203, 0.2)" strokeWidth="8" />
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke={mode === 'focus' ? 'url(#gradient-focus)' : 'url(#gradient-break)'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${progress * 5.65} 565`}
            transform="rotate(-90 100 100)"
            className="transition-all duration-1000 ease-linear"
          />
          <defs>
            <linearGradient id="gradient-focus" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5ef7e2" />
              <stop offset="100%" stopColor="#8fa1ff" />
            </linearGradient>
            <linearGradient id="gradient-break" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="mb-2 font-mono text-5xl font-bold">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--color-text-secondary)' }}>
              {mode === 'focus' ? 'Modo foco' : 'Modo pausa'}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-center gap-3">
        <Button
          onClick={toggleTimer}
          variant="primary"
          size="lg"
          icon={isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        >
          {isRunning ? 'Pausar' : 'Iniciar'}
        </Button>
        <Button onClick={resetTimer} variant="ghost" size="lg" icon={<RotateCcw className="h-5 w-5" />}>
          Reset
        </Button>
      </div>

      <p className="text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        Sessoes concluidas hoje: <span className="font-bold text-cyan-200">{sessionsCompleted}</span>
      </p>
    </div>
  )
}
