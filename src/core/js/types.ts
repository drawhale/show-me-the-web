// Scope types
export interface Variable {
  name: string
  value: RuntimeValue
  kind: 'var' | 'let' | 'const'
  initialized: boolean
}

export interface ScopeData {
  id: string
  name: string
  type: 'global' | 'function' | 'block'
  variables: Map<string, Variable>
  parentId: string | null
}

export interface ScopeSnapshot {
  scopes: ScopeData[]
  currentScopeId: string
}

// Memory types
export interface HeapObject {
  id: string
  type: 'object' | 'array' | 'function'
  properties: Map<string, RuntimeValue>
  name?: string // for functions
}

export interface StackFrame {
  id: string
  name: string
  scopeId: string
  returnAddress?: number
}

export interface MemorySnapshot {
  heap: HeapObject[]
  stack: StackFrame[]
}

// Runtime value types
export type PrimitiveValue = string | number | boolean | null | undefined

export interface ObjectReference {
  type: 'reference'
  heapId: string
}

export type RuntimeValue = PrimitiveValue | ObjectReference

// Execution context
export interface ExecutionContext {
  id: string
  name: string
  type: 'global' | 'function' | 'eval'
  thisBinding: RuntimeValue
  variableEnvironment: string // scopeId
  lexicalEnvironment: string // scopeId
}

// AST Location
export interface SourceLocation {
  start: { line: number; column: number }
  end: { line: number; column: number }
}

// Interpreter events
export type InterpreterEventType =
  | 'variable-declaration'
  | 'variable-assignment'
  | 'function-call'
  | 'function-return'
  | 'scope-enter'
  | 'scope-exit'
  | 'expression-evaluate'

export interface InterpreterEvent {
  type: InterpreterEventType
  description: string
  location: SourceLocation
  scopeSnapshot: ScopeSnapshot
  memorySnapshot: MemorySnapshot
}
