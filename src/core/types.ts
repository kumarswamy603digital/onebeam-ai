   // ==========================================
// Core Types for the AI Agent Runtime
// ==========================================

// JSON Schema subset for structured output validation
export interface JSONSchema {
  type: string;
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema;
  required?: string[];
  enum?: string[];
  description?: string;
  additionalProperties?: boolean;
}

// Tool definitions that agents can call
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: JSONSchema;
  requiredPermissions: Permission[];
}

// Permission system
export type Permission =
  | "read:tasks"
  | "write:tasks"
  | "read:workflows"
  | "write:workflows"
  | "read:entities"
  | "write:entities"
  | "execute:workflows";

// Structured result from any LLM
export interface StructuredResult {
  success: boolean;
  data: Record<string, unknown>;
  toolCalls: ToolCall[];
  reasoning?: string;
  rawOutput?: string;
}

// A tool call requested by the LLM
export interface ToolCall {
  toolName: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  status: "pending" | "approved" | "rejected" | "executed";
}

// Supported model identifiers
export type ModelId = "gpt-5.2" | "claude-opus-4.6" | "gemini-3";

// LLM Provider interface — the unified adapter
export interface LLMProvider {
  readonly modelId: ModelId;
  readonly displayName: string;
  readonly vendor: "openai" | "anthropic" | "google";
  generateStructuredOutput(options: {
    systemPrompt: string;
    userPrompt: string;
    tools: ToolDefinition[];
    outputSchema: JSONSchema;
  }): Promise<StructuredResult>;
}

// Agent configuration
export interface AgentConfig {
  name: string;
  model: ModelId;
  instructions: string;
  allowedTools: string[];
  outputSchema: string; // references a schema name
  permissions: Permission[];
}

// Agent run request
export interface AgentRunRequest {
  agent: string;
  model?: ModelId; // runtime override
  input: string;
}

// Execution phases
export type Phase = "discussion" | "execution";

// Log entry for audit trail
export interface LogEntry {
  id: string;
  timestamp: Date;
  phase: Phase;
  model: ModelId;
  agent: string;
  type: "plan" | "tool_call" | "validation" | "execution" | "error" | "blocked";
  message: string;
  data?: unknown;
}

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
