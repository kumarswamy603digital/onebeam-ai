  import type { AgentConfig, ModelId } from "@/core/types";
import { AGENT_CONFIGS } from "@/core/agent-runtime";
import { cn } from "@/lib/utils";

interface AgentCardProps {
  config: AgentConfig;
  isSelected: boolean;
  onSelect: () => void;
  activeModel: ModelId;
}

export function AgentCard({ config, isSelected, onSelect, activeModel }: AgentCardProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left p-4 rounded-lg border transition-all duration-200",
        isSelected
          ? "border-primary/40 bg-primary/5 glow-green"
          : "border-border bg-card hover:border-muted-foreground/20"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-sm font-semibold text-foreground">{config.name}</span>
        <span className={cn(
          "text-xs font-mono px-2 py-0.5 rounded",
          activeModel === config.model ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
        )}>
          {activeModel}
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{config.instructions}</p>
      <div className="flex flex-wrap gap-1">
        {config.allowedTools.map((tool) => (
          <span key={tool} className="text-xs font-mono px-1.5 py-0.5 bg-secondary rounded text-secondary-foreground">
            {tool}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {config.permissions.map((perm) => (
          <span key={perm} className="text-xs font-mono px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
            {perm}
          </span>
        ))}
      </div>
    </button>
  );
}

interface AgentSidebarProps {
  selectedAgent: string;
  onSelectAgent: (name: string) => void;
  activeModel: ModelId;
}

export function AgentSidebar({ selectedAgent, onSelectAgent, activeModel }: AgentSidebarProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Agents</h3>
      {AGENT_CONFIGS.map((config) => (
        <AgentCard
          key={config.name}
          config={config}
          isSelected={selectedAgent === config.name}
          onSelect={() => onSelectAgent(config.name)}
          activeModel={activeModel}
        />
      ))}
    </div>
  );
}
