import { cn } from "@/lib/utils";
import {
  useTimelineStore,
  type ConsoleOutput as ConsoleOutputType,
} from "@/stores/useTimelineStore";
import { AlertCircle, AlertTriangle, Info, Terminal } from "lucide-react";

interface ConsoleLogEntry {
  stepId: number;
  output: ConsoleOutputType;
  line: number;
}

export function ConsoleOutput() {
  const { steps, currentStepIndex } = useTimelineStore();

  // Collect all console outputs up to and including current step
  const consoleEntries: ConsoleLogEntry[] = [];

  if (currentStepIndex >= 0) {
    for (let i = 0; i <= currentStepIndex; i++) {
      const step = steps[i];
      if (step.consoleOutput) {
        consoleEntries.push({
          stepId: step.id,
          output: step.consoleOutput,
          line: step.line,
        });
      }
    }
  }

  const getIcon = (type: ConsoleOutputType["type"]) => {
    switch (type) {
      case "warn":
        return <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />;
      case "error":
        return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
      case "info":
        return <Info className="w-3.5 h-3.5 text-blue-500" />;
      default:
        return <Terminal className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  const getStyle = (type: ConsoleOutputType["type"]) => {
    switch (type) {
      case "warn":
        return "bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-400";
      case "error":
        return "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400";
      case "info":
        return "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400";
      default:
        return "bg-transparent border-border";
    }
  };

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="p-2 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Console</span>
          {consoleEntries.length > 0 && (
            <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
              {consoleEntries.length}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2 font-mono text-sm space-y-1">
        {consoleEntries.length === 0 ? (
          <div className="text-muted-foreground text-center py-8">
            No console output yet
          </div>
        ) : (
          consoleEntries.map((entry) => (
            <div
              key={entry.stepId}
              className={cn(
                "flex items-start gap-2 px-2 py-1 rounded border",
                getStyle(entry.output.type),
              )}
            >
              <span className="mt-0.5 shrink-0">
                {getIcon(entry.output.type)}
              </span>
              <span className="flex-1 break-all whitespace-pre-wrap">
                {entry.output.args.join(" ")}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                :{entry.line}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
