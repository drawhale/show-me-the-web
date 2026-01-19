import { create } from 'zustand'

export type EditorTab = 'html' | 'css' | 'js'

interface EditorState {
  activeTab: EditorTab
  htmlCode: string
  cssCode: string
  jsCode: string
  setActiveTab: (tab: EditorTab) => void
  setHtmlCode: (code: string) => void
  setCssCode: (code: string) => void
  setJsCode: (code: string) => void
  loadExample: (example: { html: string; css: string; js: string }) => void
}

const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>Demo</title>
</head>
<body>
  <div id="app">
    <h1 class="title">Hello World</h1>
    <p class="description">Welcome to Show Me The Web!</p>
    <button id="counter">Count: 0</button>
  </div>
</body>
</html>`

const DEFAULT_CSS = `/* CSS Cascade Demo */
.title {
  color: blue;
  font-size: 24px;
}

h1.title {
  color: red;
}

#app .title {
  color: green;
}

.description {
  color: gray;
  font-style: italic;
}

#counter {
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}`

const DEFAULT_JS = `// JavaScript Execution Demo
let count = 0;

function increment() {
  count = count + 1;
  return count;
}

function updateButton() {
  const btn = document.getElementById('counter');
  btn.textContent = 'Count: ' + count;
}

// Call the function
increment();
increment();
updateButton();`

export const useEditorStore = create<EditorState>((set) => ({
  activeTab: 'js',
  htmlCode: DEFAULT_HTML,
  cssCode: DEFAULT_CSS,
  jsCode: DEFAULT_JS,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setHtmlCode: (code) => set({ htmlCode: code }),
  setCssCode: (code) => set({ cssCode: code }),
  setJsCode: (code) => set({ jsCode: code }),
  loadExample: (example) => set({
    htmlCode: example.html,
    cssCode: example.css,
    jsCode: example.js,
  }),
}))
