import { useState } from 'react'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { motion, AnimatePresence } from 'framer-motion'
import type { HeapObject, StackFrame, RuntimeValue, ClosureVariable } from '@/core/js/types'
import { ChevronDown, ChevronRight } from 'lucide-react'

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
  const [showVars, setShowVars] = useState(true)
  const hasVariables = frame.variables && frame.variables.length > 0

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

      {/* Local variables */}
      {hasVariables && (
        <div className="mt-2">
          <button
            onClick={() => setShowVars(!showVars)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showVars ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
            <span>Local Variables ({frame.variables!.length})</span>
          </button>

          <AnimatePresence>
            {showVars && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-1 space-y-0.5 text-xs font-mono">
                  {frame.variables!.map((v) => (
                    <div key={v.name} className="flex items-center gap-2 pl-2">
                      <span className={`px-1 rounded text-[10px] ${
                        v.kind === 'const'
                          ? 'bg-red-500/20 text-red-400'
                          : v.kind === 'let'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {v.kind}
                      </span>
                      <span className="text-foreground">{v.name}</span>
                      <span className="text-muted-foreground">=</span>
                      <span className="text-primary">{formatValue(v.value)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

interface HeapObjectBoxProps {
  object: HeapObject
}

function HeapObjectBox({ object }: HeapObjectBoxProps) {
  const [showClosure, setShowClosure] = useState(false)
  const properties = Array.from(object.properties.entries()).filter(
    ([key]) => !key.startsWith('__')
  )

  const typeColor =
    object.type === 'function'
      ? 'border-yellow-500/50 bg-yellow-500/10'
      : object.type === 'array'
      ? 'border-blue-500/50 bg-blue-500/10'
      : 'border-purple-500/50 bg-purple-500/10'

  const hasClosure = object.type === 'function' && object.closure && object.closure.length > 0

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
        {hasClosure && (
          <span className="text-xs bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded">
            closure
          </span>
        )}
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

      {/* Closure section for functions */}
      {hasClosure && (
        <div className="mt-2">
          <button
            onClick={() => setShowClosure(!showClosure)}
            className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors"
          >
            {showClosure ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
            <span>Captured Variables ({object.closure!.length})</span>
          </button>

          <AnimatePresence>
            {showClosure && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 pl-2 border-l-2 border-orange-500/30 space-y-1">
                  {object.closure!.map((cv, index) => (
                    <ClosureVariableRow key={`${cv.name}-${index}`} variable={cv} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

interface ClosureVariableRowProps {
  variable: ClosureVariable
}

function ClosureVariableRow({ variable }: ClosureVariableRowProps) {
  return (
    <div className="text-xs font-mono flex items-center gap-2">
      <span className="text-muted-foreground">{variable.fromScope}:</span>
      <span className="text-foreground">{variable.name}</span>
      <span className="text-muted-foreground">=</span>
      <span className="text-primary">{formatValue(variable.value)}</span>
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
