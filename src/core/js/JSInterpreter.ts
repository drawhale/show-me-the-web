import * as parser from '@babel/parser'
import type * as t from '@babel/types'
import { Scope, resetScopeCounter } from './Scope'
import { MemoryModel, resetMemoryCounter } from './MemoryModel'
import type { ExecutionStep } from '@/stores/useTimelineStore'
import type { RuntimeValue, ScopeSnapshot, MemorySnapshot, ClosureVariable } from './types'

interface InterpreterState {
  scope: Scope
  memory: MemoryModel
  steps: ExecutionStep[]
  stepId: number
}

function updateClosureValues(state: InterpreterState): void {
  // Update closure values for all function objects in heap
  for (const [, heapObj] of state.memory.heap) {
    if (heapObj.type === 'function' && heapObj.closure) {
      const funcData = heapObj.properties.get('__func__') as { scope: Scope } | undefined
      if (funcData?.scope) {
        // Update each closure variable with current value from scope
        heapObj.closure = captureClosureVariables(funcData.scope)
      }
    }
  }
}

function updateStackFrameVariables(state: InterpreterState): void {
  // Build a map of scopeId -> scope for quick lookup
  const scopeMap = new Map<string, Scope>()
  let currentScope: Scope | null = state.scope
  while (currentScope) {
    scopeMap.set(currentScope.id, currentScope)
    currentScope = currentScope.parent
  }

  // Update each stack frame with its scope's variables
  for (const frame of state.memory.stack) {
    const scope = scopeMap.get(frame.scopeId)
    if (scope) {
      frame.variables = Array.from(scope.variables.entries()).map(([name, variable]) => ({
        name,
        value: variable.value,
        kind: variable.kind,
      }))
    }
  }
}

function createSnapshot(state: InterpreterState): {
  scopeSnapshot: ScopeSnapshot
  memorySnapshot: MemorySnapshot
} {
  // Update closure values before taking snapshot
  updateClosureValues(state)

  // Update stack frame variables
  updateStackFrameVariables(state)

  return {
    scopeSnapshot: {
      scopes: state.scope.getScopeChain(),
      currentScopeId: state.scope.id,
    },
    memorySnapshot: state.memory.toSnapshot(),
  }
}

function addStep(
  state: InterpreterState,
  type: ExecutionStep['type'],
  description: string,
  node: t.Node
): void {
  const { scopeSnapshot, memorySnapshot } = createSnapshot(state)
  state.steps.push({
    id: state.stepId++,
    type,
    description,
    line: node.loc?.start.line || 1,
    column: node.loc?.start.column || 0,
    scopeSnapshot,
    memorySnapshot,
  })
}

function captureClosureVariables(scope: Scope): ClosureVariable[] {
  const captured: ClosureVariable[] = []
  let current: Scope | null = scope

  while (current && current.type !== 'global') {
    for (const [name, variable] of current.variables) {
      // Don't capture functions themselves to avoid circular references
      if (variable.value && typeof variable.value === 'object' &&
          'type' in variable.value && variable.value.type === 'reference') {
        // Skip for now, just capture primitives for cleaner display
        captured.push({
          name,
          value: variable.value,
          fromScope: current.name,
        })
      } else {
        captured.push({
          name,
          value: variable.value,
          fromScope: current.name,
        })
      }
    }
    current = current.parent
  }

  return captured
}

function evaluateExpression(
  node: t.Expression | t.PrivateName | t.SpreadElement,
  state: InterpreterState
): RuntimeValue {
  switch (node.type) {
    case 'NumericLiteral':
      return node.value

    case 'StringLiteral':
      return node.value

    case 'BooleanLiteral':
      return node.value

    case 'NullLiteral':
      return null

    case 'Identifier':
      return state.scope.get(node.name)

    case 'BinaryExpression':
      return evaluateBinaryExpression(node, state)

    case 'UnaryExpression':
      return evaluateUnaryExpression(node, state)

    case 'LogicalExpression':
      return evaluateLogicalExpression(node, state)

    case 'AssignmentExpression':
      return evaluateAssignmentExpression(node, state)

    case 'UpdateExpression':
      return evaluateUpdateExpression(node, state)

    case 'CallExpression':
      return evaluateCallExpression(node, state)

    case 'MemberExpression':
      return evaluateMemberExpression(node, state)

    case 'ArrayExpression':
      return evaluateArrayExpression(node, state)

    case 'ObjectExpression':
      return evaluateObjectExpression(node, state)

    case 'FunctionExpression':
    case 'ArrowFunctionExpression':
      return evaluateFunctionExpression(node, state)

    case 'ConditionalExpression':
      const test = evaluateExpression(node.test, state)
      return test
        ? evaluateExpression(node.consequent, state)
        : evaluateExpression(node.alternate, state)

    default:
      console.warn(`Unsupported expression type: ${node.type}`)
      return undefined
  }
}

function evaluateBinaryExpression(
  node: t.BinaryExpression,
  state: InterpreterState
): RuntimeValue {
  const left = evaluateExpression(node.left, state) as number | string
  const right = evaluateExpression(node.right, state) as number | string

  switch (node.operator) {
    case '+':
      return (left as number) + (right as number)
    case '-':
      return (left as number) - (right as number)
    case '*':
      return (left as number) * (right as number)
    case '/':
      return (left as number) / (right as number)
    case '%':
      return (left as number) % (right as number)
    case '==':
      return left == right
    case '===':
      return left === right
    case '!=':
      return left != right
    case '!==':
      return left !== right
    case '<':
      return left < right
    case '>':
      return left > right
    case '<=':
      return left <= right
    case '>=':
      return left >= right
    default:
      return undefined
  }
}

function evaluateUnaryExpression(
  node: t.UnaryExpression,
  state: InterpreterState
): RuntimeValue {
  const argument = evaluateExpression(node.argument, state)

  switch (node.operator) {
    case '!':
      return !argument
    case '-':
      return -(argument as number)
    case '+':
      return +(argument as number)
    case 'typeof':
      return typeof argument
    default:
      return undefined
  }
}

function evaluateLogicalExpression(
  node: t.LogicalExpression,
  state: InterpreterState
): RuntimeValue {
  const left = evaluateExpression(node.left, state)

  switch (node.operator) {
    case '&&':
      return left ? evaluateExpression(node.right, state) : left
    case '||':
      return left ? left : evaluateExpression(node.right, state)
    case '??':
      return left !== null && left !== undefined
        ? left
        : evaluateExpression(node.right, state)
    default:
      return undefined
  }
}

function evaluateAssignmentExpression(
  node: t.AssignmentExpression,
  state: InterpreterState
): RuntimeValue {
  const value = evaluateExpression(node.right, state)

  if (node.left.type === 'Identifier') {
    let newValue = value

    if (node.operator !== '=') {
      const currentValue = state.scope.get(node.left.name) as number
      switch (node.operator) {
        case '+=':
          newValue = (currentValue as number) + (value as number)
          break
        case '-=':
          newValue = currentValue - (value as number)
          break
        case '*=':
          newValue = currentValue * (value as number)
          break
        case '/=':
          newValue = currentValue / (value as number)
          break
      }
    }

    state.scope.assign(node.left.name, newValue)
    addStep(
      state,
      'assignment',
      `Assign ${node.left.name} = ${formatValue(newValue)}`,
      node
    )
    return newValue
  }

  return value
}

function evaluateUpdateExpression(
  node: t.UpdateExpression,
  state: InterpreterState
): RuntimeValue {
  if (node.argument.type !== 'Identifier') {
    return undefined
  }

  const name = node.argument.name
  const currentValue = state.scope.get(name) as number
  const newValue = node.operator === '++' ? currentValue + 1 : currentValue - 1

  state.scope.assign(name, newValue)
  addStep(state, 'assignment', `Update ${name} to ${newValue}`, node)

  return node.prefix ? newValue : currentValue
}

function evaluateCallExpression(
  node: t.CallExpression,
  state: InterpreterState
): RuntimeValue {
  // Handle built-in functions or skip DOM operations
  if (node.callee.type === 'MemberExpression') {
    const obj = node.callee.object
    if (obj.type === 'Identifier' && obj.name === 'console') {
      // Skip console calls
      return undefined
    }
    if (obj.type === 'Identifier' && obj.name === 'document') {
      // Skip document calls but record step
      addStep(state, 'call', 'DOM operation (skipped in visualization)', node)
      return undefined
    }
  }

  // Get function
  let func: { params: t.Identifier[]; body: t.BlockStatement; scope: Scope } | undefined
  let funcName = 'anonymous'

  if (node.callee.type === 'Identifier') {
    funcName = node.callee.name
    const ref = state.scope.get(node.callee.name)
    if (ref && typeof ref === 'object' && 'type' in ref && ref.type === 'reference') {
      const heapObj = state.memory.getObject(ref.heapId)
      if (heapObj && heapObj.type === 'function') {
        func = heapObj.properties.get('__func__') as typeof func
      }
    }
  }

  if (!func) {
    addStep(state, 'call', `Call ${funcName}() (not found)`, node)
    return undefined
  }

  // Evaluate arguments
  const args = node.arguments.map((arg) => {
    if (arg.type === 'SpreadElement') {
      return evaluateExpression(arg.argument, state)
    }
    return evaluateExpression(arg as t.Expression, state)
  })

  // Create new scope for function
  const functionScope = new Scope(funcName, 'function', func.scope)

  // Bind parameters
  func.params.forEach((param, index) => {
    if (param.type === 'Identifier') {
      functionScope.declare(param.name, 'let', args[index])
    }
  })

  // Push stack frame
  state.memory.pushFrame(funcName, functionScope.id)

  const previousScope = state.scope
  state.scope = functionScope

  addStep(state, 'call', `Call ${funcName}(${args.map(formatValue).join(', ')})`, node)

  // Execute function body
  let returnValue: RuntimeValue = undefined

  for (const stmt of func.body.body) {
    const result = executeStatement(stmt, state)
    if (result && typeof result === 'object' && '__return__' in result) {
      returnValue = result.__return__
      break
    }
  }

  // Pop stack frame
  state.memory.popFrame()
  state.scope = previousScope

  addStep(state, 'return', `Return ${formatValue(returnValue)} from ${funcName}`, node)

  return returnValue
}

function evaluateMemberExpression(
  node: t.MemberExpression,
  state: InterpreterState
): RuntimeValue {
  const obj = evaluateExpression(node.object as t.Expression, state)

  if (obj && typeof obj === 'object' && 'type' in obj && obj.type === 'reference') {
    const heapObj = state.memory.getObject(obj.heapId)
    if (heapObj) {
      let key: string
      if (node.computed) {
        key = String(evaluateExpression(node.property as t.Expression, state))
      } else if (node.property.type === 'Identifier') {
        key = node.property.name
      } else {
        return undefined
      }
      return heapObj.properties.get(key)
    }
  }

  return undefined
}

function evaluateArrayExpression(
  node: t.ArrayExpression,
  state: InterpreterState
): RuntimeValue {
  const properties = new Map<string, RuntimeValue>()

  node.elements.forEach((element, index) => {
    if (element) {
      if (element.type === 'SpreadElement') {
        properties.set(String(index), evaluateExpression(element.argument, state))
      } else {
        properties.set(String(index), evaluateExpression(element, state))
      }
    }
  })

  properties.set('length', node.elements.length)

  const heapId = state.memory.allocateObject('array', properties)
  return { type: 'reference', heapId }
}

function evaluateObjectExpression(
  node: t.ObjectExpression,
  state: InterpreterState
): RuntimeValue {
  const properties = new Map<string, RuntimeValue>()

  node.properties.forEach((prop) => {
    if (prop.type === 'ObjectProperty') {
      let key: string
      if (prop.key.type === 'Identifier') {
        key = prop.key.name
      } else if (prop.key.type === 'StringLiteral') {
        key = prop.key.value
      } else {
        return
      }
      properties.set(key, evaluateExpression(prop.value as t.Expression, state))
    }
  })

  const heapId = state.memory.allocateObject('object', properties)
  return { type: 'reference', heapId }
}

function evaluateFunctionExpression(
  node: t.FunctionExpression | t.ArrowFunctionExpression,
  state: InterpreterState
): RuntimeValue {
  const params = node.params.filter((p): p is t.Identifier => p.type === 'Identifier')
  const body = node.body.type === 'BlockStatement'
    ? node.body
    : { type: 'BlockStatement' as const, body: [{ type: 'ReturnStatement' as const, argument: node.body }] } as t.BlockStatement

  const funcData = {
    params,
    body,
    scope: state.scope, // Closure - capture current scope
  }

  const properties = new Map<string, RuntimeValue>()
  properties.set('__func__', funcData as unknown as RuntimeValue)

  // Capture closure variables for visualization
  const closure = captureClosureVariables(state.scope)

  const name = node.type === 'FunctionExpression' && node.id ? node.id.name : 'anonymous'
  const heapId = state.memory.allocateObject('function', properties, name, closure.length > 0 ? closure : undefined)

  return { type: 'reference', heapId }
}

function executeStatement(
  node: t.Statement,
  state: InterpreterState
): { __return__: RuntimeValue } | void {
  switch (node.type) {
    case 'VariableDeclaration':
      executeVariableDeclaration(node, state)
      break

    case 'FunctionDeclaration':
      executeFunctionDeclaration(node, state)
      break

    case 'ExpressionStatement':
      evaluateExpression(node.expression, state)
      break

    case 'IfStatement':
      return executeIfStatement(node, state)

    case 'WhileStatement':
      return executeWhileStatement(node, state)

    case 'ForStatement':
      return executeForStatement(node, state)

    case 'BlockStatement':
      return executeBlockStatement(node, state)

    case 'ReturnStatement':
      const value = node.argument
        ? evaluateExpression(node.argument, state)
        : undefined
      return { __return__: value }

    default:
      console.warn(`Unsupported statement type: ${node.type}`)
  }
}

function executeVariableDeclaration(
  node: t.VariableDeclaration,
  state: InterpreterState
): void {
  const kind = node.kind as 'var' | 'let' | 'const'

  node.declarations.forEach((decl) => {
    if (decl.id.type === 'Identifier') {
      const name = decl.id.name
      const value = decl.init ? evaluateExpression(decl.init, state) : undefined

      state.scope.declare(name, kind, value)
      addStep(
        state,
        'declaration',
        `Declare ${kind} ${name}${value !== undefined ? ` = ${formatValue(value)}` : ''}`,
        node
      )
    }
  })
}

function executeFunctionDeclaration(
  node: t.FunctionDeclaration,
  state: InterpreterState
): void {
  if (!node.id) return

  const name = node.id.name
  const params = node.params.filter((p): p is t.Identifier => p.type === 'Identifier')

  const funcData = {
    params,
    body: node.body,
    scope: state.scope,
  }

  const properties = new Map<string, RuntimeValue>()
  properties.set('__func__', funcData as unknown as RuntimeValue)

  // Capture closure variables for visualization
  const closure = captureClosureVariables(state.scope)

  const heapId = state.memory.allocateObject('function', properties, name, closure.length > 0 ? closure : undefined)
  state.scope.declare(name, 'var', { type: 'reference', heapId })

  addStep(state, 'declaration', `Declare function ${name}`, node)
}

function executeIfStatement(
  node: t.IfStatement,
  state: InterpreterState
): { __return__: RuntimeValue } | void {
  const test = evaluateExpression(node.test, state)
  addStep(state, 'expression', `If condition: ${formatValue(test)}`, node)

  if (test) {
    return executeStatement(node.consequent, state)
  } else if (node.alternate) {
    return executeStatement(node.alternate, state)
  }
}

function executeWhileStatement(
  node: t.WhileStatement,
  state: InterpreterState
): { __return__: RuntimeValue } | void {
  let iterations = 0
  const maxIterations = 1000

  while (iterations < maxIterations) {
    const test = evaluateExpression(node.test, state)
    addStep(state, 'expression', `While condition: ${formatValue(test)}`, node)

    if (!test) break

    const result = executeStatement(node.body, state)
    if (result) return result

    iterations++
  }
}

function executeForStatement(
  node: t.ForStatement,
  state: InterpreterState
): { __return__: RuntimeValue } | void {
  // Create block scope for for loop
  const forScope = new Scope('for', 'block', state.scope)
  const previousScope = state.scope
  state.scope = forScope

  addStep(state, 'block-enter', 'Enter for loop', node)

  // Init
  if (node.init) {
    if (node.init.type === 'VariableDeclaration') {
      executeVariableDeclaration(node.init, state)
    } else {
      evaluateExpression(node.init, state)
    }
  }

  let iterations = 0
  const maxIterations = 1000

  while (iterations < maxIterations) {
    // Test
    if (node.test) {
      const test = evaluateExpression(node.test, state)
      addStep(state, 'expression', `For condition: ${formatValue(test)}`, node)
      if (!test) break
    }

    // Body
    const result = executeStatement(node.body, state)
    if (result) {
      state.scope = previousScope
      return result
    }

    // Update
    if (node.update) {
      evaluateExpression(node.update, state)
    }

    iterations++
  }

  state.scope = previousScope
  addStep(state, 'block-exit', 'Exit for loop', node)
}

function executeBlockStatement(
  node: t.BlockStatement,
  state: InterpreterState
): { __return__: RuntimeValue } | void {
  const blockScope = new Scope('block', 'block', state.scope)
  const previousScope = state.scope
  state.scope = blockScope

  for (const stmt of node.body) {
    const result = executeStatement(stmt, state)
    if (result) {
      state.scope = previousScope
      return result
    }
  }

  state.scope = previousScope
}

function formatValue(value: RuntimeValue): string {
  if (value === undefined) return 'undefined'
  if (value === null) return 'null'
  if (typeof value === 'string') return `"${value}"`
  if (typeof value === 'object' && 'type' in value && value.type === 'reference') {
    return `<ref:${value.heapId}>`
  }
  return String(value)
}

export function runJSInterpreter(code: string): ExecutionStep[] {
  // Reset counters
  resetScopeCounter()
  resetMemoryCounter()

  try {
    const ast = parser.parse(code, {
      sourceType: 'script',
      plugins: [],
    })

    const globalScope = new Scope('global', 'global')
    const memory = new MemoryModel()

    // Push global frame
    memory.pushFrame('global', globalScope.id)

    const state: InterpreterState = {
      scope: globalScope,
      memory,
      steps: [],
      stepId: 0,
    }

    // Add initial state
    addStep(
      state,
      'block-enter',
      'Start execution',
      ast.program
    )

    // Hoist function declarations first
    ast.program.body.forEach((node) => {
      if (node.type === 'FunctionDeclaration') {
        executeFunctionDeclaration(node, state)
      }
    })

    // Execute statements
    for (const node of ast.program.body) {
      if (node.type !== 'FunctionDeclaration') {
        executeStatement(node, state)
      }
    }

    addStep(
      state,
      'block-exit',
      'End execution',
      ast.program
    )

    return state.steps
  } catch (error) {
    console.error('Interpreter error:', error)
    return [
      {
        id: 0,
        type: 'expression',
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        line: 1,
        column: 0,
        scopeSnapshot: { scopes: [], currentScopeId: '' },
        memorySnapshot: { heap: [], stack: [] },
      },
    ]
  }
}
