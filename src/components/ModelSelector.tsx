   import { useState } from "react";
import type { ModelId } from "@/core/types";
import { getAllProviders } from "@/core/providers";
import { cn } from "@/lib/utils";

const providerIcons: Record<string, string> = {
  openai: "⚡",
  anthropic: "🧠",
  google: "✦",
};

interface ModelSelectorProps {
  selected: ModelId;
  onChange: (model: ModelId) => void;
}

export function ModelSelector({ selected, onChange }: ModelSelectorProps) {
  const providers = getAllProviders();

  return (
    <div className="flex gap-2">
      {providers.map((p) => (
        <button
          key={p.modelId}
          onClick={() => onChange(p.modelId)}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg border font-mono text-sm transition-all duration-200",
            selected === p.modelId
              ? "border-primary/50 bg-primary/10 text-primary glow-green"
              : "border-border bg-card text-muted-foreground hover:border-muted-foreground/30 hover:bg-secondary"
          )}
        >
          <span className="text-base">{providerIcons[p.vendor]}</span>
          <span>{p.displayName}</span>
        </button>
      ))}
    </div>
  );
}
