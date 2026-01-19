import { useVisualizationStore } from '@/stores/useVisualizationStore'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScopeChainView } from './ScopeChainView'
import { MemoryView } from './MemoryView'
import { ExecutionContextView } from './ExecutionContextView'

export function JSVisualizer() {
  const { jsTab, setJSTab } = useVisualizationStore()

  return (
    <div className="h-full flex flex-col p-4">
      <Tabs value={jsTab} onValueChange={(v) => setJSTab(v as 'scope' | 'memory' | 'context')}>
        <TabsList className="mb-4">
          <TabsTrigger value="scope">Scope Chain</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="context">Context</TabsTrigger>
        </TabsList>

        <TabsContent value="scope" className="flex-1 overflow-auto">
          <ScopeChainView />
        </TabsContent>
        <TabsContent value="memory" className="flex-1 overflow-auto">
          <MemoryView />
        </TabsContent>
        <TabsContent value="context" className="flex-1 overflow-auto">
          <ExecutionContextView />
        </TabsContent>
      </Tabs>
    </div>
  )
}
