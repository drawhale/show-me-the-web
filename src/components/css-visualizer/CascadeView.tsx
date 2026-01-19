import { useEditorStore } from '@/stores/useEditorStore'
import { parseCSSRules, type CSSRule } from '@/core/css/CSSParser'
import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function CascadeView() {
  const { cssCode } = useEditorStore()

  const rules = useMemo(() => {
    return parseCSSRules(cssCode)
  }, [cssCode])

  // Group rules by selector
  const groupedRules = useMemo(() => {
    const groups = new Map<string, CSSRule[]>()

    rules.forEach((rule) => {
      const existing = groups.get(rule.selector) || []
      groups.set(rule.selector, [...existing, rule])
    })

    return groups
  }, [rules])

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">
        CSS Rules ({rules.length} rules found)
      </h3>

      <AnimatePresence mode="popLayout">
        {Array.from(groupedRules.entries()).map(([selector, selectorRules]) => (
          <motion.div
            key={selector}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-secondary rounded-lg p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <code className="text-css font-mono text-sm">{selector}</code>
              <span className="text-xs text-muted-foreground">
                Specificity: {selectorRules[0]?.specificity.join('-')}
              </span>
            </div>

            <div className="space-y-1">
              {selectorRules.map((rule, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-sm font-mono"
                >
                  {rule.declarations.map((decl, dIdx) => (
                    <span key={dIdx} className="text-muted-foreground">
                      <span className="text-foreground">{decl.property}</span>:{' '}
                      <span className="text-primary">{decl.value}</span>
                      {decl.important && (
                        <span className="text-red-400 ml-1">!important</span>
                      )}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {rules.length === 0 && (
        <div className="text-center text-muted-foreground text-sm py-8">
          No CSS rules found. Add some CSS to see the cascade visualization.
        </div>
      )}
    </div>
  )
}
