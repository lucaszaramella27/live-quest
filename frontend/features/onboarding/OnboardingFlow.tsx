import { useState } from 'react'
import { Button, Modal } from '@/shared/ui'
import { Target, CheckSquare, Flame, Trophy, Sparkles, ArrowRight } from 'lucide-react'

interface OnboardingFlowProps {
  onComplete: () => void
}

const steps = [
  {
    icon: Sparkles,
    title: 'Bem-vindo ao LiveQuest! 🎉',
    description: 'Transforme sua jornada de streaming em um jogo! Ganhe XP, moedas e conquistas enquanto cresce como streamer.'
  },
  {
    icon: Target,
    title: 'Defina suas Metas',
    description: 'Crie metas personalizadas como "10 lives essa semana" ou "100 novos seguidores". Acompanhe seu progresso e ganhe XP ao completar!'
  },
  {
    icon: CheckSquare,
    title: 'Checklist Diário',
    description: 'Organize sua rotina com tarefas diárias. Cada tarefa concluída te dá +10 XP e 2 moedas!'
  },
  {
    icon: Flame,
    title: 'Mantenha seu Streak',
    description: 'Faça live todos os dias para manter seu streak ativo. Quanto maior o streak, mais recompensas especiais você desbloqueia!'
  },
  {
    icon: Trophy,
    title: 'Conquistas e Títulos',
    description: 'Desbloqueie títulos raros, conquistas épicas e temas exclusivos. Mostre seu progresso no ranking global!'
  }
]

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const step = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1

  const handleNext = () => {
    if (isLastStep) {
      onComplete()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  return (
    <Modal isOpen={true} onClose={() => {}} title="">
      <div className="text-center">
        {/* Progress */}
        <div className="flex gap-2 mb-8 justify-center">
          {steps.map((_, index) => (
            <div
              key={index}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: '40px',
                background: index <= currentStep ? 'var(--gradient-primary)' : 'var(--color-background-tertiary)'
              }}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div 
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
            style={{ background: 'var(--gradient-primary)' }}
          >
            <step.icon className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Content */}
        <h2 className="text-2xl font-bold mb-3">{step.title}</h2>
        <p className="text-lg mb-8" style={{ color: 'var(--color-text-secondary)' }}>
          {step.description}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          {!isLastStep && (
            <Button variant="ghost" onClick={handleSkip} className="flex-1">
              Pular Tutorial
            </Button>
          )}
          <Button 
            variant="primary" 
            onClick={handleNext}
            className="flex-1"
            icon={isLastStep ? <Sparkles className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          >
            {isLastStep ? 'Começar!' : 'Próximo'}
          </Button>
        </div>

        {/* Step indicator */}
        <p className="text-sm mt-4" style={{ color: 'var(--color-text-secondary)' }}>
          {currentStep + 1} de {steps.length}
        </p>
      </div>
    </Modal>
  )
}
