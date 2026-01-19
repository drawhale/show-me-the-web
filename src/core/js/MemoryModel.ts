import type { HeapObject, StackFrame, MemorySnapshot, RuntimeValue } from './types'

let heapIdCounter = 0
let stackIdCounter = 0

export class MemoryModel {
  heap: Map<string, HeapObject>
  stack: StackFrame[]

  constructor() {
    this.heap = new Map()
    this.stack = []
  }

  allocateObject(
    type: 'object' | 'array' | 'function',
    properties: Map<string, RuntimeValue> = new Map(),
    name?: string
  ): string {
    const id = `heap_${heapIdCounter++}`
    this.heap.set(id, {
      id,
      type,
      properties,
      name,
    })
    return id
  }

  getObject(id: string): HeapObject | undefined {
    return this.heap.get(id)
  }

  setProperty(heapId: string, key: string, value: RuntimeValue): void {
    const obj = this.heap.get(heapId)
    if (obj) {
      obj.properties.set(key, value)
    }
  }

  getProperty(heapId: string, key: string): RuntimeValue {
    const obj = this.heap.get(heapId)
    if (obj) {
      return obj.properties.get(key)
    }
    return undefined
  }

  pushFrame(name: string, scopeId: string, returnAddress?: number): string {
    const id = `frame_${stackIdCounter++}`
    this.stack.push({
      id,
      name,
      scopeId,
      returnAddress,
    })
    return id
  }

  popFrame(): StackFrame | undefined {
    return this.stack.pop()
  }

  getCurrentFrame(): StackFrame | undefined {
    return this.stack[this.stack.length - 1]
  }

  toSnapshot(): MemorySnapshot {
    return {
      heap: Array.from(this.heap.values()).map((obj) => ({
        id: obj.id,
        type: obj.type,
        name: obj.name,
        properties: new Map(obj.properties),
      })),
      stack: this.stack.map((frame) => ({
        id: frame.id,
        name: frame.name,
        scopeId: frame.scopeId,
        returnAddress: frame.returnAddress,
      })),
    }
  }
}

export function resetMemoryCounter(): void {
  heapIdCounter = 0
  stackIdCounter = 0
}
