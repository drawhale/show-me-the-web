import { useTimelineStore } from '@/stores/useTimelineStore'
import { motion, AnimatePresence } from 'framer-motion'
import type { ScopeData, RuntimeValue } from '@/core/js/types'

export function ScopeChainView() {
  const currentStep = useTimelineStore((s) => s.getCurrentStep())

  if (!currentStep) {
    return (
      <div className="text-center text-muted-foreground text-sm py-8">
        Run the code to see scope chain visualization
      </div>
    )
  }

  const { scopes, currentScopeId } = currentStep.scopeSnapshot

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">
        Scope Chain (current: {scopes.find(s => s.id === currentScopeId)?.name || 'unknown'})
      </h3>

      <div className="flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {scopes.map((scope, index) => (
            <motion.div
              key={scope.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
            >
              <ScopeBox
                scope={scope}
                isCurrent={scope.id === currentScopeId}
                depth={index}
              />
              {index < scopes.length - 1 && (
                <div className="flex justify-center my-1">
                  <svg width="20" height="20" viewBox="0 0 20 20" className="text-muted-foreground">
                    <path
                      d="M10 5 L10 15 M6 11 L10 15 L14 11"
                      stroke="currentColor"
                      fill="none"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

interface ScopeBoxProps {
  scope: ScopeData
  isCurrent: boolean
  depth: number
}

function ScopeBox({ scope, isCurrent, depth }: ScopeBoxProps) {
  const variables = Array.from(scope.variables.entries())

  const bgColor = scope.type === 'global'
    ? 'bg-blue-500/10 border-blue-500/30'
    : scope.type === 'function'
    ? 'bg-green-500/10 border-green-500/30'
    : 'bg-purple-500/10 border-purple-500/30'

  return (
    <motion.div
      className={`rounded-lg border-2 p-3 ${bgColor} ${isCurrent ? 'ring-2 ring-primary' : ''}`}
      style={{ marginLeft: depth * 0 }}
      animate={{ scale: isCurrent ? 1.02 : 1 }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">
          {scope.name}
          <span className="text-muted-foreground ml-1 text-xs">
            ({scope.type})
          </span>
        </span>
        {isCurrent && (
          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
            current
          </span>
        )}
      </div>

      {variables.length > 0 ? (
        <div className="space-y-1">
          {variables.map(([name, variable]) => (
            <div
              key={name}
              className="flex items-center justify-between text-sm font-mono"
            >
              <span className="flex items-center gap-2">
                <span className={`text-xs px-1 rounded ${
                  variable.kind === 'const'
                    ? 'bg-red-500/20 text-red-400'
                    : variable.kind === 'let'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {variable.kind}
                </span>
                <span>{name}</span>
              </span>
              <span className="text-primary">
                {formatValue(variable.value)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground italic">
          No variables
        </div>
      )}
    </motion.div>
  )
}

function formatValue(value: RuntimeValue): string {
  if (value === undefined) return 'undefined'
  if (value === null) return 'null'
  if (typeof value === 'string') return `"${value}"`
  if (typeof value === 'object' && 'type' in value && value.type === 'reference') {
    return `[ref]`
  }
  return String(value)
}
