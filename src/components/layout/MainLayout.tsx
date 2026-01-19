import { SplitPane } from './SplitPane'
import { EditorPanel } from '@/components/editor/EditorPanel'
import { OutputPanel } from '@/components/output/OutputPanel'
import { VisualizationPanel } from '@/components/layout/VisualizationPanel'
import { TimelineController } from '@/components/timeline/TimelineController'

export function MainLayout() {
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="h-12 border-b flex items-center px-4 shrink-0">
        <h1 className="text-lg font-semibold">Show Me The Web</h1>
        <span className="ml-2 text-xs text-muted-foreground">
          Web Code Visualization Tool
        </span>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <SplitPane
          left={<EditorPanel />}
          right={
            <SplitPane
              left={<OutputPanel />}
              right={<VisualizationPanel />}
              defaultLeftWidth={40}
              minLeftWidth={200}
              minRightWidth={300}
            />
          }
          defaultLeftWidth={35}
          minLeftWidth={300}
          minRightWidth={400}
        />
      </main>

      {/* Timeline Footer */}
      <footer className="h-20 border-t shrink-0">
        <TimelineController />
      </footer>
    </div>
  )
}
