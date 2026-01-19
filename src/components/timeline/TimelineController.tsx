import { useEffect, useRef } from 'react'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { Button } from '@/components/ui/button'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function TimelineController() {
  const {
    steps,
    currentStepIndex,
    isPlaying,
    playSpeed,
    nextStep,
    prevStep,
    play,
    pause,
    setCurrentStep,
    setPlaySpeed,
  } = useTimelineStore()

  const intervalRef = useRef<number | null>(null)

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = window.setInterval(() => {
        const state = useTimelineStore.getState()
        if (state.currentStepIndex < state.steps.length - 1) {
          nextStep()
        } else {
          pause()
        }
      }, playSpeed)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, playSpeed, nextStep, pause])

  const currentStep = steps[currentStepIndex]
  const progress = steps.length > 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0

  return (
    <div className="h-full flex flex-col px-4 py-2">
      {/* Progress bar */}
      <div className="relative h-2 bg-muted rounded-full mb-2 cursor-pointer group">
        <div
          className="absolute h-full bg-primary rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
        {/* Step markers */}
        <div className="absolute inset-0 flex items-center">
          {steps.map((_, index) => (
            <button
              key={index}
              className={cn(
                'absolute w-2 h-2 rounded-full transition-all transform -translate-x-1/2',
                index <= currentStepIndex
                  ? 'bg-primary'
                  : 'bg-muted-foreground/30',
                index === currentStepIndex && 'scale-150 ring-2 ring-primary/50'
              )}
              style={{ left: `${((index + 0.5) / steps.length) * 100}%` }}
              onClick={() => setCurrentStep(index)}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentStep(0)}
            disabled={steps.length === 0}
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={prevStep}
            disabled={currentStepIndex <= 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="default"
            size="icon"
            onClick={isPlaying ? pause : play}
            disabled={steps.length === 0}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={nextStep}
            disabled={currentStepIndex >= steps.length - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentStep(steps.length - 1)}
            disabled={steps.length === 0}
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {/* Step info */}
        <div className="flex-1 px-4">
          {currentStep ? (
            <div className="text-sm">
              <span className="text-muted-foreground">
                Step {currentStepIndex + 1}/{steps.length}:
              </span>{' '}
              <span className="font-medium">{currentStep.description}</span>
              <span className="text-muted-foreground ml-2">
                (Line {currentStep.line})
              </span>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              {steps.length === 0
                ? 'Click "Run" to start visualization'
                : 'No step selected'}
            </div>
          )}
        </div>

        {/* Speed control */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Speed:</span>
          <select
            value={playSpeed}
            onChange={(e) => setPlaySpeed(Number(e.target.value))}
            className="bg-muted rounded px-2 py-1 text-sm"
          >
            <option value={2000}>0.5x</option>
            <option value={1000}>1x</option>
            <option value={500}>2x</option>
            <option value={250}>4x</option>
          </select>
        </div>
      </div>
    </div>
  )
}
