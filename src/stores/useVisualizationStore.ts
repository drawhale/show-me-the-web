import { create } from 'zustand'

export type VisualizationMode = 'css' | 'js'
export type JSVisualizationTab = 'scope' | 'memory' | 'context'
export type CSSVisualizationTab = 'cascade' | 'specificity' | 'applied'

export interface SelectedElementInfo {
  tagName: string
  id: string | null
  classes: string[]
  path: string // CSS selector path to the element
  inlineStyle: string | null // style attribute value
}

interface VisualizationState {
  mode: VisualizationMode
  jsTab: JSVisualizationTab
  cssTab: CSSVisualizationTab
  selectedElement: SelectedElementInfo | null

  setMode: (mode: VisualizationMode) => void
  setJSTab: (tab: JSVisualizationTab) => void
  setCSSTab: (tab: CSSVisualizationTab) => void
  setSelectedElement: (element: SelectedElementInfo | null) => void
}

export const useVisualizationStore = create<VisualizationState>((set) => ({
  mode: 'js',
  jsTab: 'scope',
  cssTab: 'cascade',
  selectedElement: null,

  setMode: (mode) => set({ mode }),
  setJSTab: (tab) => set({ jsTab: tab }),
  setCSSTab: (tab) => set({ cssTab: tab }),
  setSelectedElement: (element) => set({ selectedElement: element }),
}))
