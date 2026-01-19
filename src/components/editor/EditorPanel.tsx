import { useEditorStore } from '@/stores/useEditorStore'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { CodeEditor } from './CodeEditor'
import { ExampleSelector } from './ExampleSelector'
import { Button } from '@/components/ui/button'
import { Play, RotateCcw } from 'lucide-react'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useVisualizationStore } from '@/stores/useVisualizationStore'
import { runJSInterpreter } from '@/core/js/JSInterpreter'

export function EditorPanel() {
  const {
    activeTab,
    setActiveTab,
    htmlCode,
    cssCode,
    jsCode,
    setHtmlCode,
    setCssCode,
    setJsCode,
  } = useEditorStore()

  const { setSteps, reset } = useTimelineStore()
  const { setMode } = useVisualizationStore()

  const handleRun = () => {
    if (activeTab === 'js') {
      const steps = runJSInterpreter(jsCode)
      setSteps(steps)
      setMode('js')
    }
  }

  const handleReset = () => {
    reset()
  }

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="p-2 border-b flex items-center justify-between">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'html' | 'css' | 'js')}
        >
          <TabsList>
            <TabsTrigger value="html">
              <span className="text-html">HTML</span>
            </TabsTrigger>
            <TabsTrigger value="css">
              <span className="text-css">CSS</span>
            </TabsTrigger>
            <TabsTrigger value="js">
              <span className="text-js">JS</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          <ExampleSelector />
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          <Button size="sm" onClick={handleRun}>
            <Play className="w-4 h-4" />
            Run
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={() => {}}>
          <TabsContent value="html" className="h-full m-0">
            <CodeEditor
              language="html"
              value={htmlCode}
              onChange={setHtmlCode}
            />
          </TabsContent>
          <TabsContent value="css" className="h-full m-0">
            <CodeEditor
              language="css"
              value={cssCode}
              onChange={setCssCode}
            />
          </TabsContent>
          <TabsContent value="js" className="h-full m-0">
            <CodeEditor
              language="javascript"
              value={jsCode}
              onChange={setJsCode}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
