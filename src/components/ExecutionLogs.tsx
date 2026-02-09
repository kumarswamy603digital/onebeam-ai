  import type { LogEntry } from "@/core/types";
import { cn } from "@/lib/utils";

const typeStyles: Record<string, string> = {
  plan: "text-neon-cyan",
  tool_call: "text-neon-green",
  validation: "text-neon-amber",
  execution: "text-neon-purple",
  error: "text-neon-red",
  blocked: "text-neon-red",
};

const typeLabels: Record<string, string> = {
  plan: "PLAN",
  tool_call: "TOOL",
  validation: "VALIDATE",
  execution: "EXEC",
  error: "ERROR",
  blocked: "BLOCKED",
};

interface ExecutionLogsProps {
  logs: LogEntry[];
}

export function ExecutionLogs({ logs }: ExecutionLogsProps) {
  if (logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm font-mono">
        <span className="animate-pulse-glow">Waiting for agent run...</span>
      </div>
    );
  }

  return (
    <div className="space-y-1 font-mono text-xs">
      {logs.map((log, i) => (
        <div key={log.id} className="flex gap-2 animate-slide-up" style={{ animationDelay: `${i * 30}ms` }}>
          <span className="text-muted-foreground/50 w-16 shrink-0 text-right">
            {log.timestamp.toLocaleTimeString("en", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
          <span className={cn("w-16 shrink-0 font-semibold", typeStyles[log.type])}>
            [{typeLabels[log.type]}]
          </span>
          <span className="text-foreground/80">{log.message}</span>
        </div>
      ))}
    </div>
  );
}
