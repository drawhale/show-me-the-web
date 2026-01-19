import { useVisualizationStore } from '@/stores/useVisualizationStore'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CSSVisualizer } from '@/components/css-visualizer/CSSVisualizer'
import { JSVisualizer } from '@/components/js-visualizer/JSVisualizer'

export function VisualizationPanel() {
  const { mode, setMode } = useVisualizationStore()

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="p-2 border-b">
        <Tabs value={mode} onValueChange={(v) => setMode(v as 'css' | 'js')}>
          <TabsList>
            <TabsTrigger value="js">
              <span className="text-js">JS</span>
              <span className="ml-1">Visualizer</span>
            </TabsTrigger>
            <TabsTrigger value="css">
              <span className="text-css">CSS</span>
              <span className="ml-1">Visualizer</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-auto">
        {mode === 'js' ? <JSVisualizer /> : <CSSVisualizer />}
      </div>
    </div>
  )
}
