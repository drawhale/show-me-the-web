import { useState } from 'react'
import { calculateSpecificity } from '@/core/css/CSSParser'
import { motion } from 'framer-motion'

export function SpecificityCalculator() {
  const [selector, setSelector] = useState('#app .title')
  const specificity = calculateSpecificity(selector)

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">
          Enter a CSS selector:
        </label>
        <input
          type="text"
          value={selector}
          onChange={(e) => setSelector(e.target.value)}
          className="w-full bg-secondary border border-border rounded-md px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="e.g., #id .class element"
        />
      </div>

      <div className="bg-secondary rounded-lg p-4">
        <h3 className="text-sm font-medium mb-4">Specificity Breakdown</h3>

        <div className="flex items-center justify-center gap-4">
          <SpecificityBlock
            label="IDs"
            value={specificity[0]}
            color="text-red-400"
            description="#id"
          />
          <span className="text-2xl text-muted-foreground">-</span>
          <SpecificityBlock
            label="Classes"
            value={specificity[1]}
            color="text-green-400"
            description=".class, [attr], :pseudo"
          />
          <span className="text-2xl text-muted-foreground">-</span>
          <SpecificityBlock
            label="Elements"
            value={specificity[2]}
            color="text-blue-400"
            description="element, ::pseudo"
          />
        </div>

        <div className="mt-6 text-center">
          <span className="text-muted-foreground text-sm">
            Specificity Score:{' '}
          </span>
          <span className="font-mono text-lg font-bold">
            {specificity.join('-')}
          </span>
        </div>
      </div>

      <div className="bg-secondary/50 rounded-lg p-4">
        <h4 className="text-sm font-medium mb-2">How Specificity Works</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>
            <span className="text-red-400 font-mono">#id</span> = 1-0-0
          </li>
          <li>
            <span className="text-green-400 font-mono">.class</span>,{' '}
            <span className="text-green-400 font-mono">[attr]</span>,{' '}
            <span className="text-green-400 font-mono">:pseudo-class</span> = 0-1-0
          </li>
          <li>
            <span className="text-blue-400 font-mono">element</span>,{' '}
            <span className="text-blue-400 font-mono">::pseudo-element</span> = 0-0-1
          </li>
        </ul>
      </div>
    </div>
  )
}

interface SpecificityBlockProps {
  label: string
  value: number
  color: string
  description: string
}

function SpecificityBlock({
  label,
  value,
  color,
  description,
}: SpecificityBlockProps) {
  return (
    <motion.div
      className="flex flex-col items-center"
      animate={{ scale: value > 0 ? 1.05 : 1 }}
    >
      <span className="text-xs text-muted-foreground mb-1">{label}</span>
      <div
        className={`w-16 h-16 rounded-lg bg-background flex items-center justify-center text-3xl font-bold ${color}`}
      >
        {value}
      </div>
      <span className="text-xs text-muted-foreground mt-1 font-mono">
        {description}
      </span>
    </motion.div>
  )
}
