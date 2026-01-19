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
