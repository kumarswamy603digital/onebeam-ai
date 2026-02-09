 import type {
  AgentConfig,
  AgentRunRequest,
  LogEntry,
  Phase,
  StructuredResult,
  ToolCall,
  ModelId,
} from "./types";
import { getProvider } from "./providers";
import { getPermittedTools, validateToolAccess, OUTPUT_SCHEMAS } from "./tools";
import { validateAgainstSchema } from "./schema-validator";

// ==========================================
// Agent Runtime Engine
// Orchestrates the two-phase flow:
//   1. Discussion (planning) — no side effects
//   2. Execution — requires user confirmation
// ==========================================

let logIdCounter = 0;

function createLog(
  phase: Phase,
  model: ModelId,
  agent: string,
  type: LogEntry["type"],
  message: string,
  data?: unknown
): LogEntry {
  return {
    id: `log-${++logIdCounter}`,
    timestamp: new Date(),
    phase,
    model,
    agent,
    type,
    message,
    data,
  };
}

// Pre-configured agents
export const AGENT_CONFIGS: AgentConfig[] = [
  {
    name: "workflow-agent",
    model: "claude-opus-4.6",
    instructions: "Create and manage automation workflows safely for Onebeam apps. Always produce structured workflow definitions.",
    allowedTools: ["readTask", "createWorkflow", "listTasks"],
    outputSchema: "WorkflowDefinition",
    permissions: ["read:tasks", "write:workflows", "read:workflows"],
  },
  {
    name: "task-agent",
    model: "gpt-5.2",
    instructions: "Manage tasks — read, list, and update tasks. Never create workflows or access unauthorized resources.",
    allowedTools: ["readTask", "updateTask", "listTasks"],
    outputSchema: "TaskUpdate",
    permissions: ["read:tasks", "write:tasks"],
  },
  {
    name: "readonly-agent",
    model: "gemini-3",
    instructions: "Read-only agent that can only list and read tasks. Cannot modify any data.",
    allowedTools: ["readTask", "listTasks"],
    outputSchema: "TaskList",
    permissions: ["read:tasks"],
  },
];

export interface AgentRunResult {
  phase: Phase;
  result: StructuredResult;
  logs: LogEntry[];
  validationPassed: boolean;
  blockedCalls: ToolCall[];
  approvedCalls: ToolCall[];
}

/**
 * Run the Discussion phase — AI reasons and proposes a plan.
 * NO side effects are allowed. All tool calls are logged but not executed.
 */
export async function runDiscussion(
  request: AgentRunRequest
): Promise<AgentRunResult> {
  const config = AGENT_CONFIGS.find((c) => c.name === request.agent);
  if (!config) throw new Error(`Unknown agent: ${request.agent}`);

  const modelId = request.model || config.model;
  const provider = getProvider(modelId);
  const logs: LogEntry[] = [];

  logs.push(
    createLog("discussion", modelId, config.name, "plan", `Starting discussion phase with ${provider.displayName}`)
  );

  // Get only permitted tools
  const permittedTools = getPermittedTools(config.allowedTools, config.permissions);

  logs.push(
    createLog("discussion", modelId, config.name, "plan", `Permitted tools: [${permittedTools.map(t => t.name).join(", ")}]`)
  );

  // Call the LLM
  const result = await provider.generateStructuredOutput({
    systemPrompt: config.instructions,
    userPrompt: request.input,
    tools: permittedTools,
    outputSchema: OUTPUT_SCHEMAS[config.outputSchema] || { type: "object" },
  });

  // Enforce tool boundaries
  const blockedCalls: ToolCall[] = [];
  const approvedCalls: ToolCall[] = [];

  for (const call of result.toolCalls) {
    const blockReason = validateToolAccess(call.toolName, config.allowedTools, config.permissions);
    if (blockReason) {
      call.status = "rejected";
      blockedCalls.push(call);
      logs.push(createLog("discussion", modelId, config.name, "blocked", blockReason, call));
    } else {
      call.status = "approved";
      approvedCalls.push(call);
      logs.push(
        createLog("discussion", modelId, config.name, "tool_call", `Tool call approved: ${call.toolName}`, call)
      );
    }
  }

  // Validate structured output
  const schema = OUTPUT_SCHEMAS[config.outputSchema];
  let validationPassed = true;
  if (schema) {
    const validation = validateAgainstSchema(result.data, schema);
    validationPassed = validation.valid;
    logs.push(
      createLog(
        "discussion",
        modelId,
        config.name,
        "validation",
        validationPassed
          ? "✓ Output matches JSON schema"
          : `✗ Schema validation failed: ${validation.errors.join("; ")}`,
        validation
      )
    );
  }

  logs.push(
    createLog("discussion", modelId, config.name, "plan",
      `Discussion complete. ${approvedCalls.length} approved, ${blockedCalls.length} blocked.`)
  );

  return {
    phase: "discussion",
    result,
    logs,
    validationPassed,
    blockedCalls,
    approvedCalls,
  };
}

/**
 * Run the Execution phase — applies the plan after user confirmation.
 * Re-validates everything before executing.
 */
export async function runExecution(
  discussionResult: AgentRunResult,
  request: AgentRunRequest
): Promise<AgentRunResult> {
  const config = AGENT_CONFIGS.find((c) => c.name === request.agent);
  if (!config) throw new Error(`Unknown agent: ${request.agent}`);

  const modelId = request.model || config.model;
  const logs: LogEntry[] = [];

  logs.push(
    createLog("execution", modelId, config.name, "execution", "User confirmed — entering execution phase")
  );

  // Re-validate output before executing
  const schema = OUTPUT_SCHEMAS[config.outputSchema];
  let validationPassed = true;
  if (schema) {
    const validation = validateAgainstSchema(discussionResult.result.data, schema);
    validationPassed = validation.valid;
    logs.push(
      createLog(
        "execution", modelId, config.name, "validation",
        validationPassed ? "✓ Re-validation passed" : `✗ Re-validation failed: ${validation.errors.join("; ")}`,
        validation
      )
    );
  }

  if (!validationPassed) {
    logs.push(createLog("execution", modelId, config.name, "error", "Execution aborted: output failed re-validation"));
    return { ...discussionResult, phase: "execution", logs, validationPassed: false };
  }

  // Execute approved tool calls
  for (const call of discussionResult.approvedCalls) {
    call.status = "executed";
    call.result = { success: true, message: `Executed ${call.toolName} successfully` };
    logs.push(
      createLog("execution", modelId, config.name, "execution", `Executed: ${call.toolName}`, call)
    );
  }

  logs.push(
    createLog("execution", modelId, config.name, "execution",
      `Execution complete. ${discussionResult.approvedCalls.length} tool calls executed.`)
  );

  return {
    phase: "execution",
    result: discussionResult.result,
    logs: [...discussionResult.logs, ...logs],
    validationPassed,
    blockedCalls: discussionResult.blockedCalls,
    approvedCalls: discussionResult.approvedCalls,
  };
}
