import { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface SplitPaneProps {
  left: React.ReactNode
  right: React.ReactNode
  defaultLeftWidth?: number
  minLeftWidth?: number
  minRightWidth?: number
  className?: string
}

export function SplitPane({
  left,
  right,
  defaultLeftWidth = 50,
  minLeftWidth = 300,
  minRightWidth = 300,
  className,
}: SplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth)
  const [isDragging, setIsDragging] = useState(false)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return

      const container = containerRef.current
      const rect = container.getBoundingClientRect()
      const newLeftWidth = ((e.clientX - rect.left) / rect.width) * 100

      const minLeftPercent = (minLeftWidth / rect.width) * 100
      const maxLeftPercent = 100 - (minRightWidth / rect.width) * 100

      if (newLeftWidth >= minLeftPercent && newLeftWidth <= maxLeftPercent) {
        setLeftWidth(newLeftWidth)
      }
    },
    [isDragging, minLeftWidth, minRightWidth]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <div ref={containerRef} className={cn('flex h-full w-full', className)}>
      <div
        className="h-full overflow-hidden"
        style={{ width: `${leftWidth}%` }}
      >
        {left}
      </div>

      <div
        className={cn(
          'w-1 cursor-col-resize bg-border hover:bg-primary/50 transition-colors',
          isDragging && 'bg-primary'
        )}
        onMouseDown={handleMouseDown}
      />

      <div
        className="h-full overflow-hidden flex-1"
        style={{ width: `${100 - leftWidth}%` }}
      >
        {right}
      </div>
    </div>
  )
}
