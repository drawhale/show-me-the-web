import { useEffect, useRef } from 'react'
import { useEditorStore } from '@/stores/useEditorStore'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

export function OutputPanel() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { htmlCode, cssCode } = useEditorStore()

  const updateIframe = () => {
    if (!iframeRef.current) return

    const doc = iframeRef.current.contentDocument
    if (!doc) return

    // Create HTML with embedded CSS (without JS for visualization)
    const fullHtml = htmlCode.replace(
      '</head>',
      `<style>${cssCode}</style></head>`
    )

    doc.open()
    doc.write(fullHtml)
    doc.close()
  }

  useEffect(() => {
    updateIframe()
  }, [htmlCode, cssCode])

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="p-2 border-b flex items-center justify-between">
        <span className="text-sm font-medium">HTML Output</span>
        <Button variant="ghost" size="sm" onClick={updateIframe}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 bg-white">
        <iframe
          ref={iframeRef}
          title="HTML Output"
          className="w-full h-full border-0"
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  )
}
