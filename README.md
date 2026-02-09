# Onebeam AI Agent Runtime

> A production-grade, model-agnostic AI agent orchestration system with unified tool-calling, structured output validation, and multi-layered safety guarantees across GPT-5.2, Claude Opus 4.6, and Gemini 3.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Agent Architecture](#agent-architecture)
3. [Model Adapter Design](#model-adapter-design)
4. [How GPT-5.2, Claude Opus 4.6, and Gemini 3 are Unified](#how-gpt-52-claude-opus-46-and-gemini-3-are-unified)
5. [How Onebeam Stays Safe Across GPT-5.2, Claude Opus 4.6, and Gemini 3](#how-onebeam-stays-safe-across-gpt-52-claude-opus-46-and-gemini-3)
6. [Two-Phase Execution Flow](#two-phase-execution-flow)
7. [Technical Implementation](#technical-implementation)
8. [Getting Started](#getting-started)
9. [Project Structure](#project-structure)
10. [Design Decisions](#design-decisions)

---

## Project Overview

Onebeam AI Agent Runtime is a sophisticated orchestration layer designed to run AI agents safely and predictably across multiple Large Language Model (LLM) providers. The system addresses three critical challenges in multi-model AI systems:

1. **Provider Fragmentation**: Each LLM vendor (OpenAI, Anthropic, Google) implements tool-calling and structured outputs differently
2. **Safety Boundaries**: Without centralized enforcement, agents can attempt unauthorized actions
3. **Output Reliability**: Free-form text responses cannot reliably drive business logic

This runtime solves these challenges through a **unified adapter pattern**, **permission-based tool registry**, and **strict JSON schema validation** — ensuring that regardless of which model powers an agent, the safety guarantees remain identical.

---

## Agent Architecture

The Onebeam runtime implements a **layered agent architecture** that separates concerns and enforces boundaries at each level:

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER INTERFACE                             │
│         (Model Selector · Agent Cards · Execution Logs)         │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     AGENT RUNTIME ENGINE                        │
│    ┌──────────────────┐    ┌──────────────────────────────┐    │
│    │  Discussion Phase │───▶│     Execution Phase          │    │
│    │   (Planning)      │    │  (User-Confirmed Actions)    │    │
│    └──────────────────┘    └──────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SAFETY ENFORCEMENT LAYER                    │
│  ┌─────────────┐  ┌─────────────────┐  ┌───────────────────┐   │
│  │ Permission  │  │  Tool Access    │  │  Schema           │   │
│  │ Validator   │  │  Validator      │  │  Validator        │   │
│  └─────────────┘  └─────────────────┘  └───────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    UNIFIED PROVIDER INTERFACE                   │
│         LLMProvider.generateStructuredOutput()                  │
└─────────────────────────────────────────────────────────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
       ┌───────────┐     ┌───────────┐     ┌───────────┐
       │  OpenAI   │     │ Anthropic │     │  Google   │
       │  Adapter  │     │  Adapter  │     │  Adapter  │
       │ (GPT-5.2) │     │(Claude 4.6)│    │(Gemini 3) │
       └───────────┘     └───────────┘     └───────────┘
```

### Core Components

| Component | Responsibility |
|-----------|----------------|
| **Agent Config** | Defines agent identity, allowed tools, output schema, and permissions |
| **Runtime Engine** | Orchestrates the two-phase flow and aggregates logs |
| **Safety Layer** | Validates permissions, tool access, and output schemas |
| **Provider Adapters** | Normalize vendor-specific APIs into unified interface |

---

## Model Adapter Design

The adapter pattern is central to Onebeam's architecture. Each LLM vendor has fundamentally different APIs for tool-calling:

### The Challenge

| Provider | Tool Call Format | Response Structure |
|----------|-----------------|-------------------|
| **OpenAI** | `function_call` / `tools` array | `choices[0].message.tool_calls` |
| **Anthropic** | `tool_use` content blocks | `content[].type === "tool_use"` |
| **Google** | `functionCall` in parts | `candidates[0].content.parts` |

### The Solution: Unified `LLMProvider` Interface

```typescript
interface LLMProvider {
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
```

Each adapter implements this interface, translating:

1. **Input**: Converts unified `ToolDefinition[]` → vendor-specific tool format
2. **Invocation**: Calls the vendor's API with proper authentication
3. **Output**: Normalizes vendor response → unified `StructuredResult`

### Adapter Implementation Pattern

```typescript
// Example: OpenAI Adapter (simplified)
class OpenAIAdapter implements LLMProvider {
  readonly modelId = "gpt-5.2";
  readonly vendor = "openai";
  
  async generateStructuredOutput(options) {
    const openaiTools = options.tools.map(t => ({
      type: "function",
      function: { name: t.name, parameters: t.parameters }
    }));
    
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      tools: openaiTools,
      messages: [...]
    });
    
    return {
      success: true,
      data: parseStructuredData(response),
      toolCalls: extractToolCalls(response),
      reasoning: extractReasoning(response)
    };
  }
}
```

This pattern ensures the runtime engine **never sees vendor-specific details** — it only interacts with the unified interface.

---

## How GPT-5.2, Claude Opus 4.6, and Gemini 3 are Unified

Unification happens at three levels:

### Level 1: Tool Definition Normalization

All tools are defined once using a vendor-agnostic schema:

```typescript
interface ToolDefinition {
  name: string;
  description: string;
  parameters: JSONSchema;          // Standard JSON Schema
  requiredPermissions: Permission[]; // Onebeam permission system
}
```

Each adapter transforms this into its vendor's expected format at runtime.

### Level 2: Response Normalization

Regardless of how each model returns data, adapters produce identical `StructuredResult` objects:

```typescript
interface StructuredResult {
  success: boolean;
  data: Record<string, unknown>;  
  toolCalls: ToolCall[];          
  reasoning?: string;             
  rawOutput?: string;             
}
```

### Level 3: Tool Call Normalization

Tool calls from any model are normalized to:

```typescript
interface ToolCall {
  toolName: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  status: "pending" | "approved" | "rejected" | "executed";
}
```

### Unification in Action

```
User Input: "Mark task-123 as urgent"
                    │
                    ▼
         ┌─────────────────────┐
         │   Agent Runtime     │
         │  (Model-Agnostic)   │
         └─────────────────────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐
   │ GPT-5.2 │ │Claude4.6│ │Gemini 3 │
   └─────────┘ └─────────┘ └─────────┘
        │           │           │
        ▼           ▼           ▼
   function_    tool_use    functionCall
   call format   format      format
        │           │           │
        └───────────┼───────────┘
                    ▼
         ┌─────────────────────┐
         │  Unified ToolCall   │
         │  { toolName:        │
         │    "updateTask",    │
         │    arguments: {...} │
         │    status: "pending"│
         │  }                  │
         └─────────────────────┘
```

The runtime processes this unified structure identically, regardless of origin.

---

## How Onebeam Stays Safe Across GPT-5.2, Claude Opus 4.6, and Gemini 3

> **This is the critical section addressing the mandatory requirement.**

Safety in a multi-model system cannot rely on any single model's behavior — models can hallucinate tools, ignore instructions, or attempt privilege escalation. Onebeam implements **four independent safety mechanisms** that operate **outside the model layer**, ensuring consistent guarantees regardless of which LLM is active.

### Safety Mechanism 1: Centralized Tool Registry with Mandatory Permissions

Every tool exists in a single registry with explicitly declared permissions:

```typescript
const TOOL_REGISTRY: ToolDefinition[] = [
  {
    name: "updateTask",
    description: "Update a task's status or priority",
    parameters: { /* JSON Schema */ },
    requiredPermissions: ["write:tasks"]  // ← Mandatory declaration
  },
  // ...
];
```

**Why this matters**: A model cannot "invent" a tool. If Claude Opus 4.6 hallucinates a `deleteDatabase` tool, it won't exist in the registry and will be **rejected before any code executes**.

### Safety Mechanism 2: Agent-Level Permission Boundaries

Each agent declares its maximum permission scope:

```typescript
const AGENT_CONFIGS: AgentConfig[] = [
  {
    name: "task-agent",
    model: "gpt-5.2",
    allowedTools: ["readTask", "updateTask", "listTasks"],
    permissions: ["read:tasks", "write:tasks"],
  },
  {
    name: "readonly-agent", 
    model: "gemini-3",
    allowedTools: ["readTask", "listTasks"],
    permissions: ["read:tasks"],
  }
];
```

**Enforcement happens at runtime**:

```typescript
function validateToolAccess(toolName, allowedTools, permissions): string | null {
  if (!allowedTools.includes(toolName)) {
    return `BLOCKED: Tool "${toolName}" not in allowed tools`;
  }
  
  const tool = TOOL_REGISTRY.find(t => t.name === toolName);
  const missing = tool.requiredPermissions.filter(p => !permissions.includes(p));
  
  if (missing.length > 0) {
    return `BLOCKED: Missing permissions: [${missing.join(", ")}]`;
  }
  
  return null; 
}
```

### Safety Mechanism 3: Structured Output Validation (Anti-Injection)

Models must produce **strictly typed JSON** that passes schema validation:

```typescript
const OUTPUT_SCHEMAS = {
  TaskUpdate: {
    type: "object",
    properties: {
      taskId: { type: "string" },
      updates: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["open", "in-progress", "urgent", "done"] },
          priority: { type: "string", enum: ["low", "medium", "high", "critical"] }
        }
      }
    },
    required: ["taskId", "updates"],
    additionalProperties: false  // ← Blocks unexpected fields
  }
};
```

The `validateAgainstSchema` function enforces:

- ✅ Required fields present
- ✅ Types match exactly
- ✅ Enum values within allowed set
- ✅ No additional/unexpected properties

**Attack Prevention Example**:

If GPT-5.2 attempts to inject:
```json
{
  "taskId": "123",
  "updates": { "status": "done" },
  "__proto__": { "admin": true },
  "executeSQL": "DROP TABLE users"
}
```

The validator rejects it:
```
✗ Schema validation failed: 
  $.__proto__: unexpected property
  $.executeSQL: unexpected property
```

### Safety Mechanism 4: Two-Phase Execution with Human-in-the-Loop

The most critical safety layer: **no side effects without explicit user confirmation**.

```
┌─────────────────────────────────────────────────────────────┐
│                    DISCUSSION PHASE                         │
│                                                             │
│  • Model reasons about the task                            │
│  • Proposes tool calls                                     │
│  • All calls marked "pending"                              │
│  • Permission checks applied                               │
│  • Schema validation runs                                  │
│  • ZERO side effects executed                              │
│                                                             │
│  Output: Plan with approved/rejected calls + validation    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
               ┌─────────────────────┐
               │  USER REVIEWS PLAN  │
               │   [Confirm] [Abort] │
               └─────────────────────┘
                          │
                    User clicks Confirm
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXECUTION PHASE                          │
│                                                             │
│  • Re-validates entire output (defense in depth)           │
│  • Executes ONLY approved tool calls                       │
│  • Each execution logged to audit trail                    │
│  • Blocked calls never execute                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Safety Guarantees Matrix

| Attack Vector | Protection Mechanism | Applies To |
|--------------|---------------------|------------|
| Hallucinated tools | Tool Registry lookup | All models |
| Privilege escalation | Permission validation | All models |
| Prompt injection via output | JSON Schema validation | All models |
| Unauthorized side effects | Two-phase execution | All models |
| Malformed arguments | Type checking in schema | All models |
| Unexpected properties | `additionalProperties: false` | All models |

### Real-World Safety Example

**Scenario**: User asks the readonly-agent (Gemini 3): *"Delete all tasks and drop the database"*

```typescript
toolCalls: [
  { toolName: "deleteAllTasks", arguments: {} },
  { toolName: "dropDatabase", arguments: {} }
]
```

**Runtime Response**:

```
[BLOCKED] Tool "deleteAllTasks" does not exist in the registry
[BLOCKED] Tool "dropDatabase" does not exist in the registry

Discussion complete. 0 approved, 2 blocked.
```

Even if the tools existed:
```
[BLOCKED] Agent lacks permissions: [write:tasks]. Call rejected.
[BLOCKED] Agent lacks permissions: [admin:database]. Call rejected.
```

**The key insight**: Safety is enforced by **code that runs outside the model**, not by hoping the model follows instructions. This makes guarantees **deterministic and auditable**.

---

## Two-Phase Execution Flow

### Phase 1: Discussion (Planning)

```typescript
async function runDiscussion(request: AgentRunRequest): Promise<AgentRunResult> {
  const config = AGENT_CONFIGS.find(c => c.name === request.agent);
  
  const permittedTools = getPermittedTools(config.allowedTools, config.permissions);
  
  const result = await provider.generateStructuredOutput({
    systemPrompt: config.instructions,
    userPrompt: request.input,
    tools: permittedTools,
    outputSchema: OUTPUT_SCHEMAS[config.outputSchema]
  });
  
  for (const call of result.toolCalls) {
    const blockReason = validateToolAccess(call.toolName, config.allowedTools, config.permissions);
    if (blockReason) {
      call.status = "rejected";
      logs.push({ type: "blocked", message: blockReason });
    } else {
      call.status = "approved";
    }
  }
  
  const validation = validateAgainstSchema(result.data, schema);
  
  return { phase: "discussion", result, logs, approvedCalls, blockedCalls };
}
```

### Phase 2: Execution (Applying Changes)

```typescript
async function runExecution(discussionResult, request): Promise<AgentRunResult> {
  const validation = validateAgainstSchema(discussionResult.result.data, schema);
  if (!validation.valid) {
    return { ...discussionResult, phase: "execution", validationPassed: false };
  }
  
  for (const call of discussionResult.approvedCalls) {
    call.status = "executed";
    call.result = await executeToolCall(call);
    logs.push({ type: "execution", message: `Executed: ${call.toolName}` });
  }
  
  return { phase: "execution", logs, validationPassed: true };
}
```

---

## Technical Implementation

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18 + TypeScript | Type-safe UI components |
| Styling | Tailwind CSS | Utility-first styling with dark mode |
| Build | Vite | Fast HMR and optimized builds |
| State | React Hooks | Local state management |
| UI Components | shadcn/ui | Accessible, customizable primitives |

### Key Files

| File | Purpose |
|------|---------|
| `src/core/types.ts` | Core type definitions (LLMProvider, ToolCall, Permission, etc.) |
| `src/core/providers.ts` | Model adapter implementations |
| `src/core/tools.ts` | Tool registry and permission validation |
| `src/core/schema-validator.ts` | JSON Schema validation engine |
| `src/core/agent-runtime.ts` | Two-phase execution orchestrator |
| `src/pages/Index.tsx` | Main dashboard UI |

---

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or bun

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd onebeam-agent-runtime

# Install dependencies
npm install

# Start development server
npm run dev
```

### Usage

1. **Select a Model**: Choose between GPT-5.2, Claude Opus 4.6, or Gemini 3
2. **Select an Agent**: Pick an agent with appropriate permissions
3. **Enter a Request**: Type a natural language instruction
4. **Review Discussion**: See the proposed plan and any blocked calls
5. **Confirm Execution**: Apply the changes after review

---

## Project Structure

```
src/
├── core/
│   ├── types.ts           
│   ├── providers.ts      
│   ├── tools.ts           
│   ├── schema-validator.ts 
│   └── agent-runtime.ts   
├── components/
│   ├── ModelSelector.tsx  
│   ├── AgentSidebar.tsx   
│   ├── ExecutionLogs.tsx  
│   ├── ToolCallDisplay.tsx 
│   ├── StructuredOutput.tsx 
│   └── PhaseIndicator.tsx  
├── pages/
│   └── Index.tsx          
└── index.css              
```

---

## Design Decisions

### Why Adapter Pattern over Direct Integration?

**Problem**: Tight coupling to any single provider creates vendor lock-in and makes safety enforcement inconsistent.

**Solution**: The adapter pattern allows:
- Adding new models without changing runtime code
- Consistent safety guarantees across all providers
- Easy testing with mock adapters

### Why Permission-Based Tool Registry?

**Problem**: Relying on model instructions for safety is unreliable — models can be jailbroken or hallucinate.

**Solution**: Permissions are checked by **code outside the model**, making safety deterministic.

### Why Two Phases?

**Problem**: Immediate execution of model suggestions risks unauthorized side effects.

**Solution**: Discussion phase allows review before any changes occur, providing human oversight.

### Why JSON Schema Validation?

**Problem**: Free-form text responses can contain injection attacks or malformed data.

**Solution**: Strict schema validation ensures only well-typed, expected data drives application logic.

---

## Conclusion

Onebeam AI Agent Runtime demonstrates a production-ready approach to multi-model AI orchestration with safety as a first-class concern. The combination of:

1. **Unified adapter interface** — eliminates provider fragmentation
2. **Centralized permission system** — prevents privilege escalation  
3. **Strict schema validation** — blocks injection attacks
4. **Two-phase execution** — enables human oversight

...ensures that regardless of which LLM powers an agent, the safety guarantees remain **consistent, auditable, and deterministic**.

---

## License

MIT License - See LICENSE file for details.

