# Show Me The Web

A visualization tool that helps you understand how HTML/CSS/JavaScript code works internally.

## Features

### Code Editor

- Monaco Editor-based code editing
- Separate tabs for HTML, CSS, and JavaScript

### CSS Visualization

- Cascade rules visualization
- Specificity calculation and display

### JavaScript Visualization

- Scope Chain visualization
- Memory (Heap/Stack) structure display
- Execution Context tracking

### Timeline

- Step-by-step code execution
- Rewind/forward navigation

## Tech Stack

| Category | Technology |
| --- | --- |
| Framework | React 19 + TypeScript + Vite |
| State Management | Zustand |
| Editor | Monaco Editor (@monaco-editor/react) |
| Parsing | css-tree (CSS), @babel/parser (JS) |
| Animation | Framer Motion |
| Styling | Tailwind CSS v4 |

## Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm run dev

# Production build
pnpm run build

# Preview build
pnpm run preview
```

## Project Structure

```
src/
├── components/
│   ├── layout/          # MainLayout, SplitPane, VisualizationPanel
│   ├── editor/          # CodeEditor, EditorPanel, ExampleSelector
│   ├── output/          # HTMLOutput (iframe sandbox)
│   ├── css-visualizer/  # CascadeView, SpecificityCalculator
│   ├── js-visualizer/   # ScopeChainView, MemoryView, ExecutionContextView
│   ├── timeline/        # TimelineController
│   └── ui/              # Button, Tabs (shadcn/ui style)
├── core/
│   ├── css/             # CSSParser (css-tree based)
│   └── js/              # JSInterpreter, Scope, MemoryModel
├── stores/              # Zustand stores
├── data/                # Example code
├── hooks/               # Custom hooks
└── lib/                 # Utilities
```

## Supported Syntax

The JavaScript interpreter supports the following syntax:

- Variable declarations: `var`, `let`, `const`
- Functions: function declarations, function expressions
- Control flow: conditionals, loops
- Data structures: objects, arrays

## Limitations

- DOM manipulation code is skipped in visualization
- Maximum 1000 iterations to prevent infinite loops

## License

MIT License
