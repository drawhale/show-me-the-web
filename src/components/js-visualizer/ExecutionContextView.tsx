import { useTimelineStore } from '@/stores/useTimelineStore'
import { motion, AnimatePresence } from 'framer-motion'

export function ExecutionContextView() {
  const currentStep = useTimelineStore((s) => s.getCurrentStep())

  if (!currentStep) {
    return (
      <div className="text-center text-muted-foreground text-sm py-8">
        Run the code to see execution context visualization
      </div>
    )
  }

  const { stack } = currentStep.memorySnapshot
  const { scopes, currentScopeId } = currentStep.scopeSnapshot

  const currentScope = scopes.find((s) => s.id === currentScopeId)

  return (
    <div className="space-y-6">
      {/* Current Execution Context */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Current Execution Context
        </h3>

        <motion.div
          className="bg-secondary rounded-lg p-4 space-y-3"
          animate={{ opacity: 1 }}
          initial={{ opacity: 0 }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Type:</span>
            <span className="font-mono text-sm">
              {currentScope?.type === 'global'
                ? 'Global Execution Context'
                : `Function Execution Context (${currentScope?.name})`}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">this binding:</span>
            <span className="font-mono text-sm text-primary">
              {currentScope?.type === 'global' ? 'window (global)' : 'depends on call'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Lexical Environment:</span>
            <span className="font-mono text-sm">{currentScopeId}</span>
          </div>
        </motion.div>
      </div>

      {/* Execution Context Stack */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Execution Context Stack
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
                className={`rounded-lg border-2 p-3 ${
                  index === stack.length - 1
                    ? 'bg-primary/10 border-primary'
                    : 'bg-secondary border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {frame.name === 'global' ? 'Global' : frame.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Execution Context
                    </span>
                  </div>
                  {index === stack.length - 1 && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                      running
                    </span>
                  )}
                </div>

                <div className="mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span>Scope: {frame.scopeId}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Step Information */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Current Step
        </h3>

        <div className="bg-secondary rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                currentStep.type === 'declaration'
                  ? 'bg-blue-500/20 text-blue-400'
                  : currentStep.type === 'assignment'
                  ? 'bg-green-500/20 text-green-400'
                  : currentStep.type === 'call'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : currentStep.type === 'return'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-gray-500/20 text-gray-400'
              }`}
            >
              {currentStep.type}
            </span>
            <span className="text-xs text-muted-foreground">
              Line {currentStep.line}
            </span>
          </div>
          <p className="text-sm">{currentStep.description}</p>
        </div>
      </div>
    </div>
  )
}
