import * as csstree from 'css-tree'

export interface CSSDeclaration {
  property: string
  value: string
  important: boolean
}

export interface CSSRule {
  selector: string
  specificity: [number, number, number]
  declarations: CSSDeclaration[]
  line?: number
}

export function parseCSSRules(cssText: string): CSSRule[] {
  const rules: CSSRule[] = []

  try {
    const ast = csstree.parse(cssText, {
      positions: true,
    })

    csstree.walk(ast, {
      visit: 'Rule',
      enter(node) {
        if (node.type === 'Rule' && node.prelude.type === 'SelectorList') {
          const selectors = csstree.generate(node.prelude)

          // Get declarations
          const declarations: CSSDeclaration[] = []
          if (node.block) {
            csstree.walk(node.block, {
              visit: 'Declaration',
              enter(declNode) {
                declarations.push({
                  property: declNode.property,
                  value: csstree.generate(declNode.value),
                  important: declNode.important === true,
                })
              },
            })
          }

          // Split multiple selectors and create rules for each
          const selectorList = selectors.split(',').map((s) => s.trim())

          selectorList.forEach((selector) => {
            rules.push({
              selector,
              specificity: calculateSpecificity(selector),
              declarations,
              line: node.loc?.start.line,
            })
          })
        }
      },
    })
  } catch (e) {
    console.error('CSS parsing error:', e)
  }

  return rules
}

export function calculateSpecificity(selector: string): [number, number, number] {
  let ids = 0
  let classes = 0
  let elements = 0

  // Remove :not() contents but count what's inside
  const withoutNot = selector.replace(/:not\(([^)]+)\)/g, (_, inner) => {
    const [i, c, e] = calculateSpecificity(inner)
    ids += i
    classes += c
    elements += e
    return ''
  })

  // Count IDs (#something)
  const idMatches = withoutNot.match(/#[a-zA-Z_-][a-zA-Z0-9_-]*/g)
  ids += idMatches ? idMatches.length : 0

  // Count classes (.something), attributes ([attr]), and pseudo-classes (:something)
  // but not pseudo-elements (::something)
  const classMatches = withoutNot.match(/\.[a-zA-Z_-][a-zA-Z0-9_-]*/g)
  classes += classMatches ? classMatches.length : 0

  const attrMatches = withoutNot.match(/\[[^\]]+\]/g)
  classes += attrMatches ? attrMatches.length : 0

  // Pseudo-classes (single colon, not double)
  const pseudoClassMatches = withoutNot.match(/(?<!:):[a-zA-Z-]+(\([^)]*\))?/g)
  if (pseudoClassMatches) {
    pseudoClassMatches.forEach((match) => {
      // :where() and :is() don't add specificity, but their contents do
      if (!match.startsWith(':where') && !match.startsWith(':is')) {
        classes += 1
      }
    })
  }

  // Count elements (tag names) and pseudo-elements (::something)
  // First, remove IDs, classes, attributes, and pseudo stuff
  let forElements = withoutNot
    .replace(/#[a-zA-Z_-][a-zA-Z0-9_-]*/g, '')
    .replace(/\.[a-zA-Z_-][a-zA-Z0-9_-]*/g, '')
    .replace(/\[[^\]]+\]/g, '')
    .replace(/::[a-zA-Z-]+/g, () => {
      elements += 1
      return ''
    })
    .replace(/:[a-zA-Z-]+(\([^)]*\))?/g, '')

  // What remains should be element names and combinators
  const elementMatches = forElements.match(/[a-zA-Z][a-zA-Z0-9]*/g)
  if (elementMatches) {
    elementMatches.forEach((match) => {
      // Filter out combinator-related words
      if (!['not', 'is', 'where', 'has'].includes(match.toLowerCase())) {
        elements += 1
      }
    })
  }

  return [ids, classes, elements]
}

export function compareSpecificity(
  a: [number, number, number],
  b: [number, number, number]
): number {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) {
      return a[i] - b[i]
    }
  }
  return 0
}

export interface ElementInfo {
  tagName: string
  id: string | null
  classes: string[]
}

// Check if a single selector part matches an element
function selectorPartMatchesElement(part: string, element: ElementInfo): boolean {
  const tag = element.tagName.toLowerCase()
  const partLower = part.toLowerCase()

  // Parse the selector part
  const idMatch = partLower.match(/#([a-z_-][a-z0-9_-]*)/)
  const classMatches = partLower.match(/\.([a-z_-][a-z0-9_-]*)/g)
  const tagMatch = partLower.match(/^([a-z][a-z0-9]*)/)?.[1]

  // Check ID
  if (idMatch) {
    const selectorId = idMatch[1]
    if (!element.id || element.id.toLowerCase() !== selectorId) {
      return false
    }
  }

  // Check tag name
  if (tagMatch && tagMatch !== tag) {
    return false
  }

  // Check classes
  if (classMatches) {
    const selectorClasses = classMatches.map(c => c.slice(1))
    const elementClasses = element.classes.map(c => c.toLowerCase())

    for (const sc of selectorClasses) {
      if (!elementClasses.includes(sc)) {
        return false
      }
    }
  }

  // If no specific requirements, not a valid match
  if (!idMatch && !classMatches && !tagMatch) {
    return false
  }

  return true
}

// Full selector matching - checks if a selector matches the element considering ancestors
export function selectorMatchesElement(
  selector: string,
  element: ElementInfo,
  ancestors?: ElementInfo[]
): boolean {
  const sel = selector.trim()

  // Split by descendant combinator (space), ignoring > for now (treating as space)
  const parts = sel.replace(/\s*>\s*/g, ' ').split(/\s+/).filter(Boolean)

  if (parts.length === 0) return false

  // Last part must match the target element
  const lastPart = parts[parts.length - 1]
  if (!selectorPartMatchesElement(lastPart, element)) {
    return false
  }

  // If only one part, we're done
  if (parts.length === 1) {
    return true
  }

  // Check ancestor parts (from right to left, ancestors from nearest to farthest)
  if (!ancestors || ancestors.length === 0) {
    // No ancestors provided, can't verify complex selectors
    // For backward compatibility, return true if last part matched
    return true
  }

  // Need to find matching ancestors for remaining selector parts
  // Using descendant combinator logic: each part must match some ancestor
  const remainingParts = parts.slice(0, -1)

  let ancestorIndex = 0
  for (let i = remainingParts.length - 1; i >= 0; i--) {
    const selectorPart = remainingParts[i]
    let found = false

    // Find an ancestor that matches this selector part
    while (ancestorIndex < ancestors.length) {
      if (selectorPartMatchesElement(selectorPart, ancestors[ancestorIndex])) {
        found = true
        ancestorIndex++
        break
      }
      ancestorIndex++
    }

    if (!found) {
      return false
    }
  }

  return true
}

export interface AppliedProperty {
  property: string
  value: string
  important: boolean
  selector: string
  specificity: [number, number, number]
  isOverridden: boolean
  line?: number
  inheritedFrom?: string // Parent element path if inherited
  isInline?: boolean // True if from style attribute
}

// Parse inline style string like "color: red; font-size: 12px"
export function parseInlineStyle(styleString: string): CSSDeclaration[] {
  const declarations: CSSDeclaration[] = []

  // Split by semicolon and parse each declaration
  const parts = styleString.split(';').map(s => s.trim()).filter(Boolean)

  for (const part of parts) {
    const colonIndex = part.indexOf(':')
    if (colonIndex === -1) continue

    const property = part.slice(0, colonIndex).trim().toLowerCase()
    let value = part.slice(colonIndex + 1).trim()
    let important = false

    // Check for !important
    if (value.toLowerCase().endsWith('!important')) {
      important = true
      value = value.slice(0, -10).trim()
    }

    if (property && value) {
      declarations.push({ property, value, important })
    }
  }

  return declarations
}

// CSS properties that are inherited by default
const INHERITABLE_PROPERTIES = new Set([
  'color',
  'font',
  'font-family',
  'font-size',
  'font-style',
  'font-variant',
  'font-weight',
  'letter-spacing',
  'line-height',
  'text-align',
  'text-indent',
  'text-transform',
  'white-space',
  'word-spacing',
  'visibility',
  'cursor',
  'list-style',
  'list-style-type',
  'list-style-position',
  'list-style-image',
  'quotes',
  'orphans',
  'widows',
  'direction',
  'unicode-bidi',
  'border-collapse',
  'border-spacing',
  'caption-side',
  'empty-cells',
  'table-layout',
])

export function isInheritableProperty(property: string): boolean {
  return INHERITABLE_PROPERTIES.has(property.toLowerCase())
}

// Parse element path like "div#test > p.class" into ElementInfo array
export function parseElementPath(path: string): ElementInfo[] {
  const parts = path.split(/\s*>\s*/)
  return parts.map(part => {
    const tagMatch = part.match(/^([a-zA-Z][a-zA-Z0-9]*)/)
    const idMatch = part.match(/#([a-zA-Z_-][a-zA-Z0-9_-]*)/)
    const classMatches = part.match(/\.([a-zA-Z_-][a-zA-Z0-9_-]*)/g)

    return {
      tagName: tagMatch ? tagMatch[1] : 'div',
      id: idMatch ? idMatch[1] : null,
      classes: classMatches ? classMatches.map(c => c.slice(1)) : [],
    }
  })
}

export function getAppliedStyles(
  cssText: string,
  element: ElementInfo,
  elementPath?: string,
  inlineStyle?: string | null
): AppliedProperty[] {
  const rules = parseCSSRules(cssText)

  // Parse ancestors from element path for proper selector matching
  let ancestors: ElementInfo[] = []
  if (elementPath) {
    const allElements = parseElementPath(elementPath)
    // Remove the last element (current element), keep ancestors (nearest first)
    allElements.pop()
    ancestors = allElements.reverse() // Reverse so nearest ancestor is first
  }

  const matchingRules = rules.filter(rule =>
    selectorMatchesElement(rule.selector, element, ancestors)
  )

  // Collect all properties with their sources
  const propertyMap = new Map<string, AppliedProperty[]>()

  // Add inline styles first (highest specificity)
  if (inlineStyle) {
    const inlineDeclarations = parseInlineStyle(inlineStyle)
    inlineDeclarations.forEach(decl => {
      const existing = propertyMap.get(decl.property) || []
      existing.push({
        property: decl.property,
        value: decl.value,
        important: decl.important,
        selector: 'style=""',
        specificity: [1, 0, 0] as [number, number, number], // Will be handled specially
        isOverridden: false,
        isInline: true,
      })
      propertyMap.set(decl.property, existing)
    })
  }

  // Add directly matched rules
  matchingRules.forEach(rule => {
    rule.declarations.forEach(decl => {
      const existing = propertyMap.get(decl.property) || []
      existing.push({
        property: decl.property,
        value: decl.value,
        important: decl.important,
        selector: rule.selector,
        specificity: rule.specificity,
        isOverridden: false,
        line: rule.line,
      })
      propertyMap.set(decl.property, existing)
    })
  })

  // Add inherited styles from parent elements
  if (elementPath) {
    const parentElements = parseElementPath(elementPath)
    // Remove the last element (current element) and process parents from nearest to farthest
    parentElements.pop()

    // Process from nearest parent to farthest
    for (let i = parentElements.length - 1; i >= 0; i--) {
      const parentElement = parentElements[i]
      const parentPath = parentElements.slice(0, i + 1)
        .map(el => {
          let str = el.tagName
          if (el.id) str += `#${el.id}`
          if (el.classes.length) str += '.' + el.classes.join('.')
          return str
        })
        .join(' > ')

      // Get ancestors for this parent element (elements before it in the path)
      const parentAncestors = parentElements.slice(0, i).reverse()

      const parentMatchingRules = rules.filter(rule =>
        selectorMatchesElement(rule.selector, parentElement, parentAncestors)
      )

      parentMatchingRules.forEach(rule => {
        rule.declarations.forEach(decl => {
          // Only include inheritable properties
          if (!isInheritableProperty(decl.property)) return

          const existing = propertyMap.get(decl.property) || []
          existing.push({
            property: decl.property,
            value: decl.value,
            important: decl.important,
            selector: rule.selector,
            specificity: rule.specificity,
            isOverridden: false,
            line: rule.line,
            inheritedFrom: parentPath,
          })
          propertyMap.set(decl.property, existing)
        })
      })
    }
  }

  // Determine which properties are overridden
  const result: AppliedProperty[] = []

  propertyMap.forEach((props) => {
    // Sort by CSS cascade order:
    // 1. !important inline (highest)
    // 2. !important CSS (by specificity)
    // 3. inline styles
    // 4. CSS rules (by specificity)
    // 5. inherited styles (lowest)
    props.sort((a, b) => {
      // Inherited rules always lose to direct rules
      const aInherited = !!a.inheritedFrom
      const bInherited = !!b.inheritedFrom
      if (aInherited !== bInherited) {
        return aInherited ? -1 : 1
      }

      // Among inherited, closer parent wins (shorter path = closer)
      if (aInherited && bInherited) {
        const aDepth = (a.inheritedFrom?.split(' > ').length || 0)
        const bDepth = (b.inheritedFrom?.split(' > ').length || 0)
        if (aDepth !== bDepth) {
          return aDepth - bDepth // Less depth = farther parent = lower priority
        }
      }

      // !important handling with inline consideration
      // !important inline > !important CSS > inline > CSS
      if (a.important !== b.important) {
        if (a.important) return 1
        if (b.important) return -1
      }

      // If both have same !important status, inline wins over CSS
      const aInline = !!a.isInline
      const bInline = !!b.isInline
      if (aInline !== bInline) {
        return aInline ? 1 : -1
      }

      // Same type (both inline or both CSS): compare by specificity
      const specCompare = compareSpecificity(a.specificity, b.specificity)
      if (specCompare !== 0) return specCompare

      // Later in source order wins (higher line number)
      return (a.line || 0) - (b.line || 0)
    })

    // The last one wins, others are overridden
    props.forEach((prop, index) => {
      prop.isOverridden = index < props.length - 1
      result.push(prop)
    })
  })

  // Sort result by property name for display
  result.sort((a, b) => {
    if (a.property !== b.property) {
      return a.property.localeCompare(b.property)
    }
    // Within same property, winning rule last
    return a.isOverridden ? -1 : 1
  })

  return result
}
