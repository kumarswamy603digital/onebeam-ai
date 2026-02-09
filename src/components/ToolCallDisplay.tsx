import type { ToolCall } from "@/core/types";
import { cn } from "@/lib/utils";

interface ToolCallDisplayProps {
  calls: ToolCall[];
  title: string;
  variant: "approved" | "blocked";
}

export function ToolCallDisplay({ calls, title, variant }: ToolCallDisplayProps) {
  if (calls.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className={cn(
        "text-xs font-mono uppercase tracking-widest",
        variant === "approved" ? "text-neon-green" : "text-neon-red"
      )}>
        {variant === "approved" ? "✓" : "✗"} {title} ({calls.length})
      </h4>
      {calls.map((call, i) => (
        <div
          key={i}
          className={cn(
            "p-3 rounded-lg border font-mono text-xs",
            variant === "approved"
              ? "border-neon-green/20 bg-neon-green/5"
              : "border-neon-red/20 bg-neon-red/5"
          )}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={cn(
              "font-semibold",
              variant === "approved" ? "text-neon-green" : "text-neon-red"
            )}>
              {call.toolName}
            </span>
            <span className={cn(
              "px-2 py-0.5 rounded text-xs",
              variant === "approved" ? "bg-neon-green/10 text-neon-green" : "bg-neon-red/10 text-neon-red"
            )}>
              {call.status}
            </span>
          </div>
          <pre className="text-muted-foreground overflow-x-auto">
            {JSON.stringify(call.arguments, null, 2)}
          </pre>
        </div>
      ))}
    </div>
  );
}
