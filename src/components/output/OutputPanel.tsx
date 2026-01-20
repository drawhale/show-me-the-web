import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores/useEditorStore";
import {
  useVisualizationStore,
  type SelectedElementInfo,
} from "@/stores/useVisualizationStore";
import { MousePointer2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export function OutputPanel() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { htmlCode, cssCode } = useEditorStore();
  const { selectedElement, setSelectedElement, setMode, setCSSTab } =
    useVisualizationStore();
  const [selectMode, setSelectMode] = useState(false);

  const getElementPath = (element: Element): string => {
    const parts: string[] = [];
    let el: Element | null = element;

    while (el && el.tagName) {
      let selector = el.tagName.toLowerCase();
      if (el.id) {
        selector += `#${el.id}`;
      }
      if (el.className && typeof el.className === "string") {
        const classes = el.className.trim().split(/\s+/).filter(Boolean);
        if (classes.length > 0) {
          selector += "." + classes.join(".");
        }
      }
      parts.unshift(selector);
      el = el.parentElement;
    }

    return parts.join(" > ");
  };

  const getElementInfo = (element: Element): SelectedElementInfo => {
    const classes =
      element.className && typeof element.className === "string"
        ? element.className.trim().split(/\s+/).filter(Boolean)
        : [];

    return {
      tagName: element.tagName.toLowerCase(),
      id: element.id || null,
      classes,
      path: getElementPath(element),
      inlineStyle: element.getAttribute("style"),
    };
  };

  const setupElementSelection = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;

    // Add selection styles
    const styleId = "__element-selector-style__";
    let style = doc.getElementById(styleId) as HTMLStyleElement;
    if (!style) {
      style = doc.createElement("style");
      style.id = styleId;
      doc.head.appendChild(style);
    }

    style.textContent = `
      .__hover-highlight__ {
        outline: 2px dashed #3b82f6 !important;
        outline-offset: 2px !important;
      }
      .__selected-highlight__ {
        outline: 3px solid #3b82f6 !important;
        outline-offset: 2px !important;
        background-color: rgba(59, 130, 246, 0.1) !important;
      }
      ${
        selectMode
          ? `
      *, *::before, *::after {
        cursor: default !important;
        user-select: none !important;
      }
      `
          : ""
      }
    `;

    // Remove previous listeners
    const body = doc.body;
    if (!body) return;

    const handleMouseOver = (e: MouseEvent) => {
      if (!selectMode) return;
      const target = e.target as Element;
      if (
        target &&
        target !== body &&
        !target.classList.contains("__selected-highlight__")
      ) {
        target.classList.add("__hover-highlight__");
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as Element;
      if (target) {
        target.classList.remove("__hover-highlight__");
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (!selectMode) return;
      e.preventDefault();
      e.stopPropagation();

      const target = e.target as Element;
      if (target && target !== body) {
        // Remove previous selection
        const prevSelected = doc.querySelector(".__selected-highlight__");
        if (prevSelected) {
          prevSelected.classList.remove("__selected-highlight__");
        }

        // Add new selection
        target.classList.remove("__hover-highlight__");
        target.classList.add("__selected-highlight__");

        // Get element info and update store
        const info = getElementInfo(target);
        setSelectedElement(info);
        setMode("css");
        setCSSTab("applied");
        setSelectMode(false);
      }
    };

    body.addEventListener("mouseover", handleMouseOver);
    body.addEventListener("mouseout", handleMouseOut);
    body.addEventListener("click", handleClick);

    return () => {
      body.removeEventListener("mouseover", handleMouseOver);
      body.removeEventListener("mouseout", handleMouseOut);
      body.removeEventListener("click", handleClick);
    };
  }, [selectMode, setSelectedElement, setMode, setCSSTab]);

  const updateIframe = useCallback(() => {
    if (!iframeRef.current) return;

    const doc = iframeRef.current.contentDocument;
    if (!doc) return;

    // Create HTML with embedded CSS (without JS for visualization)
    const fullHtml = htmlCode.replace(
      "</head>",
      `<style>${cssCode}</style></head>`,
    );

    doc.open();
    doc.write(fullHtml);
    doc.close();

    // Clear selected element when content changes
    setSelectedElement(null);

    // Setup selection after content loads
    setTimeout(() => setupElementSelection(), 100);
  }, [htmlCode, cssCode, setSelectedElement, setupElementSelection]);

  useEffect(() => {
    updateIframe();
  }, [htmlCode, cssCode]);

  useEffect(() => {
    setupElementSelection();
  }, [selectMode, setupElementSelection]);

  const clearSelection = () => {
    const doc = iframeRef.current?.contentDocument;
    if (doc) {
      const selected = doc.querySelector(".__selected-highlight__");
      if (selected) {
        selected.classList.remove("__selected-highlight__");
      }
    }
    setSelectedElement(null);
  };

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="p-2 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">HTML Output</span>
          {selectedElement && (
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
              {selectedElement.path.split(" > ").pop()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={selectMode ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectMode(!selectMode)}
            title="요소 선택 모드"
          >
            <MousePointer2 className="w-4 h-4" />
            {selectMode ? "Selecting..." : "Select"}
          </Button>
          {selectedElement && (
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              Clear
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={updateIframe}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className={cn("flex-1 bg-white", selectMode && "cursor-crosshair")}>
        <iframe
          ref={iframeRef}
          title="HTML Output"
          className="w-full h-full border-0"
          sandbox="allow-same-origin allow-scripts"
        />
      </div>
    </div>
  );
}
