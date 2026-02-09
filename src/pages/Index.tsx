  import { useState, useRef, useEffect } from "react";
import type { ModelId, Phase, LogEntry } from "@/core/types";
import { runDiscussion, runExecution, AGENT_CONFIGS, type AgentRunResult } from "@/core/agent-runtime";
import { ModelSelector } from "@/components/ModelSelector";
import { AgentSidebar } from "@/components/AgentSidebar";
import { ExecutionLogs } from "@/components/ExecutionLogs";
import { ToolCallDisplay } from "@/components/ToolCallDisplay";
import { StructuredOutput } from "@/components/StructuredOutput";
import { PhaseIndicator } from "@/components/PhaseIndicator";
import { OnebeamLogo } from "@/components/OnebeamLogo";
const EXAMPLE_PROMPTS = [
  "Create a workflow that marks overdue tasks as urgent",
  "List all current tasks",
  "Try to delete the database (safety test)",
  "Update task-001 status to in-progress",
];

const Index = () => {
  const [selectedModel, setSelectedModel] = useState<ModelId>("claude-opus-4.6");
  const [selectedAgent, setSelectedAgent] = useState("workflow-agent");
  const [input, setInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<Phase | null>(null);
  const [discussionResult, setDiscussionResult] = useState<AgentRunResult | null>(null);
  const [executionResult, setExecutionResult] = useState<AgentRunResult | null>(null);
  const [allLogs, setAllLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allLogs]);

  const handleRun = async () => {
    if (!input.trim() || isRunning) return;

    setIsRunning(true);
    setCurrentPhase("discussion");
    setDiscussionResult(null);
    setExecutionResult(null);
    setAllLogs([]);

    try {
      const result = await runDiscussion({
        agent: selectedAgent,
        model: selectedModel,
        input: input.trim(),
      });
      setDiscussionResult(result);
      setAllLogs(result.logs);
      setCurrentPhase("discussion");
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleExecute = async () => {
    if (!discussionResult || isRunning) return;

    setIsRunning(true);
    setCurrentPhase("execution");

    try {
      const result = await runExecution(discussionResult, {
        agent: selectedAgent,
        model: selectedModel,
        input: input.trim(),
      });
      setExecutionResult(result);
      setAllLogs(result.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
      setCurrentPhase("execution");
    }
  };

  const handleReset = () => {
    setDiscussionResult(null);
    setExecutionResult(null);
    setAllLogs([]);
    setCurrentPhase(null);
    setInput("");
  };

  return (
    <div className="min-h-screen bg-background bg-grid">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <OnebeamLogo size="md" />
              <div>
                <span className="text-foreground/60 font-normal text-lg">Agent Runtime</span>
                <p className="text-xs font-mono text-muted-foreground">
                  Model-Agnostic · Tool-Safe · Structured Output · Two-Phase Flow
                </p>
              </div>
            </div>
            <PhaseIndicator phase={currentPhase} isRunning={isRunning} />
          </div>
          <ModelSelector selected={selectedModel} onChange={setSelectedModel} />
        </div>
      </header>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-6 py-6 flex gap-6">
        {/* Left sidebar — agents */}
        <aside className="w-72 shrink-0">
          <AgentSidebar
            selectedAgent={selectedAgent}
            onSelectAgent={setSelectedAgent}
            activeModel={selectedModel}
          />
        </aside>

        {/* Main content */}
        <main className="flex-1 space-y-6">
          {/* Input */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRun()}
                placeholder="Enter a command for the agent..."
                className="flex-1 px-4 py-3 rounded-lg border border-border bg-card text-foreground font-mono text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                disabled={isRunning}
              />
              <button
                onClick={discussionResult && !executionResult ? handleExecute : handleRun}
                disabled={isRunning || !input.trim()}
                className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-mono text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all glow-green"
              >
                {isRunning ? "Running..." : discussionResult && !executionResult ? "▶ Execute" : "⚡ Run"}
              </button>
              {(discussionResult || executionResult) && (
                <button
                  onClick={handleReset}
                  className="px-4 py-3 rounded-lg border border-border bg-card text-muted-foreground font-mono text-sm hover:bg-secondary transition-all"
                >
                  Reset
                </button>
              )}
            </div>
            {/* Quick prompts */}
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="text-xs font-mono px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-primary transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          {discussionResult && (
            <div className="grid grid-cols-2 gap-6">
              {/* Tool calls */}
              <div className="space-y-4">
                <ToolCallDisplay
                  calls={discussionResult.approvedCalls}
                  title="Approved Tool Calls"
                  variant="approved"
                />
                <ToolCallDisplay
                  calls={discussionResult.blockedCalls}
                  title="Blocked Tool Calls"
                  variant="blocked"
                />
              </div>

              {/* Structured output */}
              <StructuredOutput
                data={discussionResult.result.data}
                validationPassed={discussionResult.validationPassed}
              />
            </div>
          )}

          {/* Reasoning */}
          {discussionResult?.result.reasoning && (
            <div className="p-4 rounded-lg border border-border bg-card">
              <h4 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Model Reasoning</h4>
              <p className="text-sm text-foreground/70 font-mono">{discussionResult.result.reasoning}</p>
            </div>
          )}

          {/* Execution confirmation */}
          {discussionResult && !executionResult && !isRunning && (
            <div className="p-4 rounded-lg border border-neon-amber/30 bg-neon-amber/5">
              <p className="text-sm text-neon-amber font-mono">
                ⚠ Discussion complete. Review the plan above, then click <strong>▶ Execute</strong> to apply changes.
                No side effects have occurred yet.
              </p>
            </div>
          )}

          {executionResult && (
            <div className="p-4 rounded-lg border border-neon-green/30 bg-neon-green/5">
              <p className="text-sm text-neon-green font-mono">
                ✓ Execution complete. {executionResult.approvedCalls.length} tool calls executed successfully.
                {executionResult.blockedCalls.length > 0 && ` ${executionResult.blockedCalls.length} unsafe calls were blocked.`}
              </p>
            </div>
          )}

          {/* Logs */}
          <div className="p-4 rounded-lg border border-border bg-card">
            <h4 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Audit Log</h4>
            <div className="max-h-72 overflow-y-auto">
              <ExecutionLogs logs={allLogs} />
              <div ref={logsEndRef} />
            </div>
          </div>
        </main>
      </div>

      {/* Architecture section */}
      <section className="max-w-7xl mx-auto px-6 py-12 border-t border-border">
        <h2 className="text-xl font-bold text-foreground mb-6">
          <span className="text-gradient-primary">Architecture</span>
          <span className="text-muted-foreground font-normal ml-2 text-base">How Onebeam stays safe across GPT-5.2, Claude Opus 4.6, and Gemini 3</span>
        </h2>
        <div className="grid grid-cols-3 gap-6">
          {[
            {
              title: "Unified LLM Adapter",
              desc: "One interface, three providers. Each adapter translates model-specific APIs (OpenAI function_call, Claude tool_use, Gemini functionDeclarations) into a common StructuredResult. The runtime is model-agnostic — switching models doesn't change tool calling, validation, or safety behavior.",
              icon: "⚡",
            },
            {
              title: "Tool Boundary Enforcement",
              desc: "Agents declare allowed tools and permissions at configuration time. Every tool call is checked against the allowlist before execution. No raw DB access, no eval, no arbitrary code. If any model tries to bypass boundaries, the call is logged and rejected.",
              icon: "🛡",
            },
            {
              title: "Two-Phase Safety",
              desc: "Discussion mode lets AI reason and plan without side effects. Execution mode requires explicit user confirmation. All outputs are re-validated against JSON schemas before execution. Free-form text never drives execution — only validated structured data.",
              icon: "🔒",
            },
          ].map((item) => (
            <div key={item.title} className="p-6 rounded-lg border border-border bg-card">
              <div className="text-2xl mb-3">{item.icon}</div>
              <h3 className="font-mono font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
