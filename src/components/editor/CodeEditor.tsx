import Editor from '@monaco-editor/react'
import { useTimelineStore } from '@/stores/useTimelineStore'
import type { editor } from 'monaco-editor'
import { useRef, useEffect } from 'react'

interface CodeEditorProps {
  language: string
  value: string
  onChange: (value: string) => void
}

export function CodeEditor({ language, value, onChange }: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const decorationsRef = useRef<editor.IEditorDecorationsCollection | null>(null)
  const currentStep = useTimelineStore((s) => s.getCurrentStep())

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor
    decorationsRef.current = editor.createDecorationsCollection([])
  }

  // Highlight current execution line
  useEffect(() => {
    if (!editorRef.current || !decorationsRef.current) return

    if (currentStep && language === 'javascript') {
      const { line } = currentStep
      decorationsRef.current.set([
        {
          range: {
            startLineNumber: line,
            startColumn: 1,
            endLineNumber: line,
            endColumn: 1,
          },
          options: {
            isWholeLine: true,
            className: 'bg-yellow-500/20',
            glyphMarginClassName: 'bg-yellow-500',
          },
        },
      ])
    } else {
      decorationsRef.current.set([])
    }
  }, [currentStep, language])

  return (
    <Editor
      height="100%"
      language={language}
      value={value}
      onChange={(v) => onChange(v || '')}
      onMount={handleEditorDidMount}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: 'on',
        padding: { top: 8 },
        glyphMargin: true,
      }}
    />
  )
}
