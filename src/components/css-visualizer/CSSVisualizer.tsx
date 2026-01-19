import { useVisualizationStore } from '@/stores/useVisualizationStore'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { CascadeView } from './CascadeView'
import { SpecificityCalculator } from './SpecificityCalculator'

export function CSSVisualizer() {
  const { cssTab, setCSSTab } = useVisualizationStore()

  return (
    <div className="h-full flex flex-col p-4">
      <Tabs value={cssTab} onValueChange={(v) => setCSSTab(v as 'cascade' | 'specificity' | 'scope')}>
        <TabsList className="mb-4">
          <TabsTrigger value="cascade">Cascade</TabsTrigger>
          <TabsTrigger value="specificity">Specificity</TabsTrigger>
          <TabsTrigger value="scope">Scope</TabsTrigger>
        </TabsList>

        <TabsContent value="cascade" className="flex-1">
          <CascadeView />
        </TabsContent>
        <TabsContent value="specificity" className="flex-1">
          <SpecificityCalculator />
        </TabsContent>
        <TabsContent value="scope" className="flex-1">
          <div className="text-muted-foreground text-sm">
            CSS Scope visualization coming soon...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
