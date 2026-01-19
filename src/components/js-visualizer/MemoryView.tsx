import { useTimelineStore } from '@/stores/useTimelineStore'
import { motion, AnimatePresence } from 'framer-motion'
import type { HeapObject, StackFrame, RuntimeValue } from '@/core/js/types'

export function MemoryView() {
  const currentStep = useTimelineStore((s) => s.getCurrentStep())

  if (!currentStep) {
    return (
      <div className="text-center text-muted-foreground text-sm py-8">
        Run the code to see memory visualization
      </div>
    )
  }

  const { heap, stack } = currentStep.memorySnapshot

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Stack */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <span className="w-3 h-3 bg-green-500 rounded-sm"></span>
          Call Stack
        </h3>

        <div className="flex flex-col-reverse gap-2">
          <AnimatePresence mode="popLayout">
            {stack.map((frame, index) => (
              <motion.div
                key={frame.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <StackFrameBox frame={frame} isTop={index === stack.length - 1} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {stack.length === 0 && (
          <div className="text-xs text-muted-foreground italic text-center py-4 border border-dashed rounded">
            Stack is empty
          </div>
        )}
      </div>

      {/* Heap */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <span className="w-3 h-3 bg-purple-500 rounded-sm"></span>
          Heap
        </h3>

        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {heap.map((obj) => (
              <motion.div
                key={obj.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <HeapObjectBox object={obj} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {heap.length === 0 && (
          <div className="text-xs text-muted-foreground italic text-center py-4 border border-dashed rounded">
            Heap is empty
          </div>
        )}
      </div>
    </div>
  )
}

interface StackFrameBoxProps {
  frame: StackFrame
  isTop: boolean
}

function StackFrameBox({ frame, isTop }: StackFrameBoxProps) {
  return (
    <div
      className={`rounded border p-2 ${
        isTop
          ? 'bg-green-500/10 border-green-500/50'
          : 'bg-secondary border-border'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm">{frame.name}()</span>
        {isTop && (
          <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded">
            executing
          </span>
        )}
      </div>
    </div>
  )
}

interface HeapObjectBoxProps {
  object: HeapObject
}

function HeapObjectBox({ object }: HeapObjectBoxProps) {
  const properties = Array.from(object.properties.entries()).filter(
    ([key]) => !key.startsWith('__')
  )

  const typeColor =
    object.type === 'function'
      ? 'border-yellow-500/50 bg-yellow-500/10'
      : object.type === 'array'
      ? 'border-blue-500/50 bg-blue-500/10'
      : 'border-purple-500/50 bg-purple-500/10'

  return (
    <div className={`rounded border p-2 ${typeColor}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs text-muted-foreground font-mono">
          {object.id}
        </span>
        <span className="text-xs bg-background px-1.5 py-0.5 rounded">
          {object.type}
          {object.name && `: ${object.name}`}
        </span>
      </div>

      {object.type !== 'function' && properties.length > 0 && (
        <div className="text-xs font-mono space-y-0.5 mt-2">
          {properties.slice(0, 5).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="text-muted-foreground">{key}:</span>
              <span className="text-primary">{formatValue(value)}</span>
            </div>
          ))}
          {properties.length > 5 && (
            <div className="text-muted-foreground">
              ... {properties.length - 5} more
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function formatValue(value: RuntimeValue): string {
  if (value === undefined) return 'undefined'
  if (value === null) return 'null'
  if (typeof value === 'string') return `"${value.slice(0, 20)}${value.length > 20 ? '...' : ''}"`
  if (typeof value === 'object' && 'type' in value && value.type === 'reference') {
    return `-> ${value.heapId}`
  }
  return String(value)
}
