import { useVisualizationStore } from '@/stores/useVisualizationStore'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { CascadeView } from './CascadeView'
import { SpecificityCalculator } from './SpecificityCalculator'
import { AppliedRulesView } from './AppliedRulesView'

export function CSSVisualizer() {
  const { cssTab, setCSSTab, selectedElement } = useVisualizationStore()

  return (
    <div className="h-full flex flex-col p-4">
      <Tabs value={cssTab} onValueChange={(v) => setCSSTab(v as 'cascade' | 'specificity' | 'applied')}>
        <TabsList className="mb-4">
          <TabsTrigger value="applied" className="relative">
            Applied
            {selectedElement && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
            )}
          </TabsTrigger>
          <TabsTrigger value="cascade">Cascade</TabsTrigger>
          <TabsTrigger value="specificity">Specificity</TabsTrigger>
        </TabsList>

        <TabsContent value="applied" className="flex-1 overflow-auto">
          <AppliedRulesView />
        </TabsContent>
        <TabsContent value="cascade" className="flex-1 overflow-auto">
          <CascadeView />
        </TabsContent>
        <TabsContent value="specificity" className="flex-1 overflow-auto">
          <SpecificityCalculator />
        </TabsContent>
      </Tabs>
    </div>
  )
}
