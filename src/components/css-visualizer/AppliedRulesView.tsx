import { useMemo } from 'react'
import { useEditorStore } from '@/stores/useEditorStore'
import { useVisualizationStore } from '@/stores/useVisualizationStore'
import { getAppliedStyles, type AppliedProperty } from '@/core/css/CSSParser'
import { motion, AnimatePresence } from 'framer-motion'

export function AppliedRulesView() {
  const { cssCode } = useEditorStore()
  const { selectedElement } = useVisualizationStore()

  const appliedStyles = useMemo(() => {
    if (!selectedElement) return []

    return getAppliedStyles(cssCode, {
      tagName: selectedElement.tagName,
      id: selectedElement.id,
      classes: selectedElement.classes,
    }, selectedElement.path, selectedElement.inlineStyle)
  }, [cssCode, selectedElement])

  // Group by property
  const groupedByProperty = useMemo(() => {
    const groups = new Map<string, AppliedProperty[]>()

    appliedStyles.forEach((style) => {
      const existing = groups.get(style.property) || []
      existing.push(style)
      groups.set(style.property, existing)
    })

    return groups
  }, [appliedStyles])

  if (!selectedElement) {
    return (
      <div className="text-center text-muted-foreground text-sm py-8">
        <p>HTML Output에서 요소를 선택하세요</p>
        <p className="text-xs mt-2">
          "Select" 버튼을 클릭한 후 요소를 클릭하면<br />
          해당 요소에 적용된 CSS를 볼 수 있습니다.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Selected Element Info */}
      <div className="bg-secondary rounded-lg p-3">
        <h3 className="text-sm font-medium mb-2">Selected Element</h3>
        <div className="font-mono text-sm">
          <span className="text-html">&lt;{selectedElement.tagName}</span>
          {selectedElement.id && (
            <span className="text-yellow-400"> id="{selectedElement.id}"</span>
          )}
          {selectedElement.classes.length > 0 && (
            <span className="text-green-400"> class="{selectedElement.classes.join(' ')}"</span>
          )}
          {selectedElement.inlineStyle && (
            <span className="text-orange-400"> style="{selectedElement.inlineStyle}"</span>
          )}
          <span className="text-html">&gt;</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Path: {selectedElement.path}
        </div>
      </div>

      {/* Applied Styles */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Applied Styles ({groupedByProperty.size} properties)
        </h3>

        {groupedByProperty.size === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-4">
            No matching CSS rules found
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {Array.from(groupedByProperty.entries()).map(([property, styles]) => (
                <motion.div
                  key={property}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-secondary rounded-lg overflow-hidden"
                >
                  <PropertyGroup property={property} styles={styles} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

interface PropertyGroupProps {
  property: string
  styles: AppliedProperty[]
}

function PropertyGroup({ property, styles }: PropertyGroupProps) {
  // Find the winning style
  const winningStyle = styles.find(s => !s.isOverridden)
  const inlineCount = styles.filter(s => s.isInline).length
  const inheritedCount = styles.filter(s => s.inheritedFrom).length
  const directCount = styles.length - inheritedCount - inlineCount

  return (
    <div>
      {/* Property header with winning value */}
      <div className="px-3 py-2 border-b border-border/50 flex items-center justify-between">
        <span className="font-mono text-sm">
          <span className="text-foreground">{property}</span>
          <span className="text-muted-foreground">: </span>
          <span className="text-primary">{winningStyle?.value}</span>
          {winningStyle?.important && (
            <span className="text-red-400 ml-1">!important</span>
          )}
          {winningStyle?.isInline && (
            <span className="text-orange-400 ml-1 text-xs">(inline)</span>
          )}
          {winningStyle?.inheritedFrom && (
            <span className="text-blue-400 ml-1 text-xs">(inherited)</span>
          )}
        </span>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          {inlineCount > 0 && <span className="text-orange-400">{inlineCount} inline</span>}
          {inlineCount > 0 && (directCount > 0 || inheritedCount > 0) && ', '}
          {directCount > 0 && `${directCount} rule${directCount > 1 ? 's' : ''}`}
          {directCount > 0 && inheritedCount > 0 && ', '}
          {inheritedCount > 0 && <span className="text-blue-400">{inheritedCount} inherited</span>}
        </span>
      </div>

      {/* All rules for this property */}
      <div className="divide-y divide-border/30">
        {styles.map((style, index) => (
          <StyleRow key={`${style.selector}-${index}`} style={style} />
        ))}
      </div>
    </div>
  )
}

interface StyleRowProps {
  style: AppliedProperty
}

function StyleRow({ style }: StyleRowProps) {
  return (
    <div
      className={`px-3 py-2 text-xs font-mono ${
        style.isOverridden ? 'opacity-50' : 'bg-primary/5'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {style.isOverridden ? (
            <span className="text-red-400 line-through">
              {style.value}
              {style.important && ' !important'}
            </span>
          ) : (
            <span className="text-green-400">
              {style.value}
              {style.important && <span className="text-red-400"> !important</span>}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {style.isInline ? (
            <span className="text-orange-400">style=""</span>
          ) : (
            <span className="text-css">{style.selector}</span>
          )}
          {!style.isInline && (
            <span className="text-muted-foreground">
              ({style.specificity.join('-')})
            </span>
          )}
          {style.isInline && (
            <span className="text-orange-400 text-[10px] px-1 py-0.5 bg-orange-500/10 rounded">
              inline
            </span>
          )}
          {style.isOverridden && (
            <span className="text-red-400 text-[10px] px-1 py-0.5 bg-red-500/10 rounded">
              overridden
            </span>
          )}
          {!style.isOverridden && !style.isInline && (
            <span className="text-green-400 text-[10px] px-1 py-0.5 bg-green-500/10 rounded">
              active
            </span>
          )}
        </div>
      </div>

      {style.inheritedFrom && (
        <div className="mt-1 text-[10px] text-muted-foreground flex items-center gap-1">
          <span className="text-blue-400">↳ inherited from</span>
          <span className="text-blue-300">{style.inheritedFrom}</span>
        </div>
      )}
    </div>
  )
}
