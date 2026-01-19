import { useState } from 'react'
import { examples } from '@/data/examples'
import { useEditorStore } from '@/stores/useEditorStore'
import { Button } from '@/components/ui/button'
import { ChevronDown, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ExampleSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const loadExample = useEditorStore((s) => s.loadExample)

  const handleSelect = (example: typeof examples[0]) => {
    loadExample({
      html: example.html,
      css: example.css,
      js: example.js,
    })
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-1"
      >
        <BookOpen className="w-4 h-4" />
        Examples
        <ChevronDown
          className={cn(
            'w-4 h-4 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 w-72 bg-card border rounded-lg shadow-lg z-20 overflow-hidden">
            <div className="p-2 border-b">
              <span className="text-xs text-muted-foreground">
                Select an example to load
              </span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {examples.map((example) => (
                <button
                  key={example.id}
                  className="w-full text-left px-3 py-2 hover:bg-secondary transition-colors"
                  onClick={() => handleSelect(example)}
                >
                  <div className="font-medium text-sm">{example.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {example.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
