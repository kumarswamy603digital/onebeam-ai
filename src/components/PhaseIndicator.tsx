import type { Phase } from "@/core/types";
import { cn } from "@/lib/utils";

interface PhaseIndicatorProps {
  phase: Phase | null;
  isRunning: boolean;
}

export function PhaseIndicator({ phase, isRunning }: PhaseIndicatorProps) {
  return (
    <div className="flex items-center gap-4">
      <div className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono transition-all",
        phase === "discussion"
          ? "border-neon-amber/40 bg-neon-amber/10 text-neon-amber"
          : "border-border bg-card text-muted-foreground"
      )}>
        <div className={cn(
          "w-2 h-2 rounded-full",
          phase === "discussion" && isRunning ? "bg-neon-amber animate-pulse-glow" : phase === "discussion" ? "bg-neon-amber" : "bg-muted-foreground/30"
        )} />
        🟡 Discussion
      </div>
      <div className="w-6 h-px bg-border" />
      <div className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono transition-all",
        phase === "execution"
          ? "border-neon-red/40 bg-neon-red/10 text-neon-red"
          : "border-border bg-card text-muted-foreground"
      )}>
        <div className={cn(
          "w-2 h-2 rounded-full",
          phase === "execution" && isRunning ? "bg-neon-red animate-pulse-glow" : phase === "execution" ? "bg-neon-red" : "bg-muted-foreground/30"
        )} />
        🔴 Execution
      </div>
    </div>
  );
}
