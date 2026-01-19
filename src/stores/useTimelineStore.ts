import { create } from 'zustand'
import type { ScopeSnapshot, MemorySnapshot } from '@/core/js/types'

export interface ExecutionStep {
  id: number
  type: 'declaration' | 'assignment' | 'call' | 'return' | 'expression' | 'block-enter' | 'block-exit'
  description: string
  line: number
  column: number
  scopeSnapshot: ScopeSnapshot
  memorySnapshot: MemorySnapshot
  highlightedCode?: { start: number; end: number }
}

interface TimelineState {
  steps: ExecutionStep[]
  currentStepIndex: number
  isPlaying: boolean
  playSpeed: number

  setSteps: (steps: ExecutionStep[]) => void
  setCurrentStep: (index: number) => void
  nextStep: () => void
  prevStep: () => void
  play: () => void
  pause: () => void
  setPlaySpeed: (speed: number) => void
  reset: () => void

  getCurrentStep: () => ExecutionStep | null
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  steps: [],
  currentStepIndex: -1,
  isPlaying: false,
  playSpeed: 1000,

  setSteps: (steps) => set({ steps, currentStepIndex: steps.length > 0 ? 0 : -1 }),

  setCurrentStep: (index) => {
    const { steps } = get()
    if (index >= -1 && index < steps.length) {
      set({ currentStepIndex: index })
    }
  },

  nextStep: () => {
    const { steps, currentStepIndex } = get()
    if (currentStepIndex < steps.length - 1) {
      set({ currentStepIndex: currentStepIndex + 1 })
    }
  },

  prevStep: () => {
    const { currentStepIndex } = get()
    if (currentStepIndex > 0) {
      set({ currentStepIndex: currentStepIndex - 1 })
    }
  },

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  setPlaySpeed: (speed) => set({ playSpeed: speed }),

  reset: () => set({ steps: [], currentStepIndex: -1, isPlaying: false }),

  getCurrentStep: () => {
    const { steps, currentStepIndex } = get()
    return currentStepIndex >= 0 ? steps[currentStepIndex] : null
  },
}))
