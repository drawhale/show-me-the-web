import type { Variable, ScopeData, RuntimeValue } from './types'

let scopeIdCounter = 0

export class Scope {
  id: string
  name: string
  type: 'global' | 'function' | 'block'
  variables: Map<string, Variable>
  parent: Scope | null

  constructor(
    name: string,
    type: 'global' | 'function' | 'block',
    parent: Scope | null = null
  ) {
    this.id = `scope_${scopeIdCounter++}`
    this.name = name
    this.type = type
    this.variables = new Map()
    this.parent = parent
  }

  declare(name: string, kind: 'var' | 'let' | 'const', value?: RuntimeValue): void {
    // var declarations are hoisted to the function/global scope
    if (kind === 'var') {
      const targetScope = this.getFunctionScope()
      if (targetScope.variables.has(name)) {
        // var can be redeclared
        return
      }
      targetScope.variables.set(name, {
        name,
        value: value,
        kind,
        initialized: value !== undefined,
      })
    } else {
      // let/const are block-scoped
      if (this.variables.has(name)) {
        throw new Error(`Identifier '${name}' has already been declared`)
      }
      this.variables.set(name, {
        name,
        value: value,
        kind,
        initialized: value !== undefined,
      })
    }
  }

  assign(name: string, value: RuntimeValue): void {
    const variable = this.resolve(name)
    if (!variable) {
      throw new Error(`${name} is not defined`)
    }
    if (variable.kind === 'const' && variable.initialized) {
      throw new Error(`Assignment to constant variable '${name}'`)
    }
    variable.value = value
    variable.initialized = true
  }

  get(name: string): RuntimeValue {
    const variable = this.resolve(name)
    if (!variable) {
      throw new Error(`${name} is not defined`)
    }
    if (!variable.initialized && variable.kind !== 'var') {
      throw new Error(`Cannot access '${name}' before initialization`)
    }
    return variable.value
  }

  has(name: string): boolean {
    return this.resolve(name) !== null
  }

  private resolve(name: string): Variable | null {
    if (this.variables.has(name)) {
      return this.variables.get(name)!
    }
    if (this.parent) {
      return this.parent.resolve(name)
    }
    return null
  }

  private getFunctionScope(): Scope {
    if (this.type === 'function' || this.type === 'global') {
      return this
    }
    if (this.parent) {
      return this.parent.getFunctionScope()
    }
    return this
  }

  toSnapshot(): ScopeData {
    // Deep copy variables to preserve state at this point in time
    const variablesCopy = new Map<string, Variable>()
    for (const [key, variable] of this.variables) {
      variablesCopy.set(key, {
        name: variable.name,
        value: variable.value,
        kind: variable.kind,
        initialized: variable.initialized,
      })
    }

    return {
      id: this.id,
      name: this.name,
      type: this.type,
      variables: variablesCopy,
      parentId: this.parent?.id || null,
    }
  }

  getScopeChain(): ScopeData[] {
    const chain: ScopeData[] = [this.toSnapshot()]
    let current: Scope | null = this.parent

    while (current) {
      chain.push(current.toSnapshot())
      current = current.parent
    }

    return chain
  }
}

export function resetScopeCounter(): void {
  scopeIdCounter = 0
}
