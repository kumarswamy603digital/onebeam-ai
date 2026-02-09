  import { cn } from "@/lib/utils";

interface StructuredOutputProps {
  data: Record<string, unknown>;
  validationPassed: boolean;
}

export function StructuredOutput({ data, validationPassed }: StructuredOutputProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Structured Output
        </h4>
        <span className={cn(
          "text-xs font-mono px-2 py-0.5 rounded",
          validationPassed
            ? "bg-neon-green/10 text-neon-green"
            : "bg-neon-red/10 text-neon-red"
        )}>
          {validationPassed ? "✓ Schema Valid" : "✗ Invalid"}
        </span>
      </div>
      <pre className={cn(
        "p-4 rounded-lg border font-mono text-xs overflow-x-auto",
        validationPassed
          ? "border-neon-green/20 bg-neon-green/5 text-foreground/80"
          : "border-neon-red/20 bg-neon-red/5 text-foreground/80"
      )}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
