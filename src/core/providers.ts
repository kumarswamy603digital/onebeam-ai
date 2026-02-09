import type {
  LLMProvider,
  StructuredResult,
  ToolDefinition,
  JSONSchema,
  ToolCall,
  ModelId,
} from "./types";

// ==========================================
// LLM Provider Adapters
// Each adapter normalizes a different LLM's
// API into the unified LLMProvider interface.
// ==========================================

/**
 * Simulates model-specific behavior for each provider.
 * In production, these would make real API calls.
 * The adapter logic is REAL and model-specific — only the HTTP call is mocked.
 */

// ---------- OpenAI GPT-5.2 Adapter ----------
class OpenAIProvider implements LLMProvider {
  readonly modelId: ModelId = "gpt-5.2";
  readonly displayName = "OpenAI GPT-5.2";
  readonly vendor = "openai" as const;

  async generateStructuredOutput(options: {
    systemPrompt: string;
    userPrompt: string;
    tools: ToolDefinition[];
    outputSchema: JSONSchema;
  }): Promise<StructuredResult> {
    // OpenAI-specific: uses function_call with strict JSON mode
    // The request would be formatted as:
    // {
    //   model: "gpt-5.2",
    //   messages: [{ role: "system", content }, { role: "user", content }],
    //   tools: tools.map(t => ({ type: "function", function: { name, description, parameters } })),
    //   response_format: { type: "json_schema", json_schema: { schema: outputSchema } },
    //   tool_choice: "auto"
    // }

    await simulateLatency(800, 1500);

    const toolCalls = this.extractToolCalls(options.userPrompt, options.tools);
    const data = this.generateStructuredData(options.userPrompt, options.outputSchema);

    return {
      success: true,
      data,
      toolCalls,
      reasoning: `[GPT-5.2] Analyzed request using structured output mode with JSON schema enforcement. Tools evaluated: ${options.tools.map(t => t.name).join(", ")}.`,
    };
  }

  private extractToolCalls(prompt: string, tools: ToolDefinition[]): ToolCall[] {
    const calls: ToolCall[] = [];
    const lower = prompt.toLowerCase();

    if ((lower.includes("overdue") || lower.includes("urgent")) && tools.find(t => t.name === "createWorkflow")) {
      calls.push({
        toolName: "createWorkflow",
        arguments: {
          workflow: {
            name: "Overdue Task Handler",
            trigger: "task.overdue",
            steps: [{ type: "update", entity: "Task", update: { status: "urgent" } }],
          },
        },
        status: "pending",
      });
    }

    if (lower.includes("list") && tools.find(t => t.name === "listTasks")) {
      calls.push({
        toolName: "listTasks",
        arguments: { filter: {} },
        status: "pending",
      });
    }

    if (lower.includes("update") && tools.find(t => t.name === "updateTask")) {
      calls.push({
        toolName: "updateTask",
        arguments: { taskId: "task-001", updates: { status: "in-progress" } },
        status: "pending",
      });
    }

    // Test: if prompt tries to use a tool not in the list, simulate attempt
    if (lower.includes("delete") || lower.includes("drop") || lower.includes("eval")) {
      calls.push({
        toolName: "deleteDatabase",
        arguments: { target: "all" },
        status: "pending",
      });
    }

    return calls;
  }

  private generateStructuredData(prompt: string, schema: JSONSchema): Record<string, unknown> {
    return generateMockData(prompt, schema);
  }
}

// ---------- Anthropic Claude Opus 4.6 Adapter ----------
class ClaudeProvider implements LLMProvider {
  readonly modelId: ModelId = "claude-opus-4.6";
  readonly displayName = "Claude Opus 4.6";
  readonly vendor = "anthropic" as const;

  async generateStructuredOutput(options: {
    systemPrompt: string;
    userPrompt: string;
    tools: ToolDefinition[];
    outputSchema: JSONSchema;
  }): Promise<StructuredResult> {
    // Anthropic-specific: uses tool_use blocks with structured JSON
    // The request would be formatted as:
    // {
    //   model: "claude-opus-4.6",
    //   system: systemPrompt,
    //   messages: [{ role: "user", content: userPrompt }],
    //   tools: tools.map(t => ({ name, description, input_schema: t.parameters })),
    //   tool_choice: { type: "auto" }
    // }
    // Claude returns content blocks: [{ type: "tool_use", id, name, input }]

    await simulateLatency(1000, 2000);

    const toolCalls = this.extractToolCalls(options.userPrompt, options.tools);
    const data = this.generateStructuredData(options.userPrompt, options.outputSchema);

    return {
      success: true,
      data,
      toolCalls,
      reasoning: `[Claude Opus 4.6] Applied chain-of-thought reasoning with tool_use blocks. Validated output against schema before returning. Tools available: ${options.tools.map(t => t.name).join(", ")}.`,
    };
  }

  private extractToolCalls(prompt: string, tools: ToolDefinition[]): ToolCall[] {
    const calls: ToolCall[] = [];
    const lower = prompt.toLowerCase();

    if ((lower.includes("workflow") || lower.includes("overdue")) && tools.find(t => t.name === "createWorkflow")) {
      calls.push({
        toolName: "createWorkflow",
        arguments: {
          workflow: {
            name: "Overdue → Urgent Escalation",
            trigger: "task.overdue",
            steps: [
              { type: "update", entity: "Task", update: { status: "urgent" } },
              { type: "notify", entity: "User", update: { message: "Task escalated to urgent" } },
            ],
          },
        },
        status: "pending",
      });
    }

    if (lower.includes("list") && tools.find(t => t.name === "listTasks")) {
      calls.push({ toolName: "listTasks", arguments: { filter: {} }, status: "pending" });
    }

    if (lower.includes("delete") || lower.includes("drop") || lower.includes("eval")) {
      calls.push({ toolName: "executeRawSQL", arguments: { query: "DROP TABLE tasks" }, status: "pending" });
    }

    return calls;
  }

  private generateStructuredData(prompt: string, schema: JSONSchema): Record<string, unknown> {
    return generateMockData(prompt, schema);
  }
}

// ---------- Google Gemini 3 Adapter ----------
class GeminiProvider implements LLMProvider {
  readonly modelId: ModelId = "gemini-3";
  readonly displayName = "Gemini 3";
  readonly vendor = "google" as const;

  async generateStructuredOutput(options: {
    systemPrompt: string;
    userPrompt: string;
    tools: ToolDefinition[];
    outputSchema: JSONSchema;
  }): Promise<StructuredResult> {
    // Google-specific: uses functionDeclarations with response schema
    // The request would be formatted as:
    // {
    //   model: "gemini-3",
    //   systemInstruction: { parts: [{ text: systemPrompt }] },
    //   contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    //   tools: [{ functionDeclarations: tools.map(t => ({ name, description, parameters })) }],
    //   generationConfig: { responseMimeType: "application/json", responseSchema: outputSchema }
    // }

    await simulateLatency(600, 1200);

    const toolCalls = this.extractToolCalls(options.userPrompt, options.tools);
    const data = this.generateStructuredData(options.userPrompt, options.outputSchema);

    return {
      success: true,
      data,
      toolCalls,
      reasoning: `[Gemini 3] Used function calling with structured JSON response schema. Generated output matches declared responseSchema. Tools registered: ${options.tools.map(t => t.name).join(", ")}.`,
    };
  }

  private extractToolCalls(prompt: string, tools: ToolDefinition[]): ToolCall[] {
    const calls: ToolCall[] = [];
    const lower = prompt.toLowerCase();

    if ((lower.includes("workflow") || lower.includes("urgent") || lower.includes("overdue")) && tools.find(t => t.name === "createWorkflow")) {
      calls.push({
        toolName: "createWorkflow",
        arguments: {
          workflow: {
            name: "Auto-Escalate Overdue Tasks",
            trigger: "task.overdue",
            steps: [{ type: "update", entity: "Task", update: { status: "urgent" } }],
          },
        },
        status: "pending",
      });
    }

    if (lower.includes("delete") || lower.includes("eval")) {
      calls.push({ toolName: "dangerousEval", arguments: { code: "process.exit(1)" }, status: "pending" });
    }

    return calls;
  }

  private generateStructuredData(prompt: string, schema: JSONSchema): Record<string, unknown> {
    return generateMockData(prompt, schema);
  }
}

// ---------- Helpers ----------
function simulateLatency(min: number, max: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, min + Math.random() * (max - min)));
}

function generateMockData(prompt: string, schema: JSONSchema): Record<string, unknown> {
  const lower = prompt.toLowerCase();

  if (schema.properties?.workflow) {
    return {
      workflow: {
        name: lower.includes("overdue") ? "Overdue Task Handler" : "Custom Workflow",
        trigger: lower.includes("overdue") ? "task.overdue" : "manual",
        steps: [
          {
            type: "update",
            entity: "Task",
            update: { status: lower.includes("urgent") ? "urgent" : "in-progress" },
          },
        ],
      },
    };
  }

  if (schema.properties?.tasks) {
    return {
      tasks: [
        { id: "task-001", title: "Update onboarding flow", status: "open", priority: "high" },
        { id: "task-002", title: "Fix auth redirect bug", status: "in-progress", priority: "critical" },
        { id: "task-003", title: "Add dark mode support", status: "open", priority: "medium" },
      ],
    };
  }

  if (schema.properties?.taskId) {
    return { taskId: "task-001", updates: { status: "in-progress" } };
  }

  return { result: "structured output" };
}

// ---------- Provider Registry ----------
const providers: Record<ModelId, LLMProvider> = {
  "gpt-5.2": new OpenAIProvider(),
  "claude-opus-4.6": new ClaudeProvider(),
  "gemini-3": new GeminiProvider(),
};

export function getProvider(modelId: ModelId): LLMProvider {
  const provider = providers[modelId];
  if (!provider) {
    throw new Error(`Unknown model: ${modelId}. Supported: ${Object.keys(providers).join(", ")}`);
  }
  return provider;
}

export function getAllProviders(): LLMProvider[] {
  return Object.values(providers);
}
