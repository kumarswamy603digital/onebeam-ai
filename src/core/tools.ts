   import type { ToolDefinition, Permission, JSONSchema } from "./types";

// ==========================================
// Tool Registry — defines available tools
// with permission boundaries
// ==========================================

export const TOOL_REGISTRY: ToolDefinition[] = [
  {
    name: "readTask",
    description: "Read a task by ID. Returns task details including status, assignee, and due date.",
    parameters: {
      type: "object",
      properties: {
        taskId: { type: "string", description: "The ID of the task to read" },
      },
      required: ["taskId"],
    },
    requiredPermissions: ["read:tasks"],
  },
  {
    name: "updateTask",
    description: "Update a task's properties such as status, priority, or assignee.",
    parameters: {
      type: "object",
      properties: {
        taskId: { type: "string", description: "The ID of the task to update" },
        updates: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["open", "in-progress", "urgent", "done"] },
            priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
            assignee: { type: "string" },
          },
        },
      },
      required: ["taskId", "updates"],
    },
    requiredPermissions: ["write:tasks"],
  },
  {
    name: "createWorkflow",
    description: "Create an automation workflow with trigger and steps.",
    parameters: {
      type: "object",
      properties: {
        workflow: {
          type: "object",
          properties: {
            name: { type: "string" },
            trigger: { type: "string" },
            steps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["update", "notify", "condition"] },
                  entity: { type: "string" },
                  update: { type: "object" },
                },
                required: ["type"],
              },
            },
          },
          required: ["name", "trigger", "steps"],
        },
      },
      required: ["workflow"],
    },
    requiredPermissions: ["write:workflows"],
  },
  {
    name: "listTasks",
    description: "List all tasks matching optional filter criteria.",
    parameters: {
      type: "object",
      properties: {
        filter: {
          type: "object",
          properties: {
            status: { type: "string" },
            priority: { type: "string" },
            assignee: { type: "string" },
          },
        },
      },
    },
    requiredPermissions: ["read:tasks"],
  },
];

/**
 * Get tools filtered by allowed names and permissions.
 * This enforces the tool boundary — agents only see what they're allowed to.
 */
export function getPermittedTools(
  allowedToolNames: string[],
  agentPermissions: Permission[]
): ToolDefinition[] {
  return TOOL_REGISTRY.filter((tool) => {
    const nameAllowed = allowedToolNames.includes(tool.name);
    const hasPermissions = tool.requiredPermissions.every((p) =>
      agentPermissions.includes(p)
    );
    return nameAllowed && hasPermissions;
  });
}

/**
 * Check if a tool call is permitted for the given agent.
 * Returns error message if blocked, null if allowed.
 */
export function validateToolAccess(
  toolName: string,
  allowedToolNames: string[],
  agentPermissions: Permission[]
): string | null {
  if (!allowedToolNames.includes(toolName)) {
    return `BLOCKED: Tool "${toolName}" is not in the agent's allowed tools list. This call has been rejected.`;
  }

  const tool = TOOL_REGISTRY.find((t) => t.name === toolName);
  if (!tool) {
    return `BLOCKED: Tool "${toolName}" does not exist in the registry.`;
  }

  const missingPermissions = tool.requiredPermissions.filter(
    (p) => !agentPermissions.includes(p)
  );
  if (missingPermissions.length > 0) {
    return `BLOCKED: Agent lacks permissions: [${missingPermissions.join(", ")}]. This call has been rejected.`;
  }

  return null;
}

// Output schemas for structured validation
export const OUTPUT_SCHEMAS: Record<string, JSONSchema> = {
  WorkflowDefinition: {
    type: "object",
    properties: {
      workflow: {
        type: "object",
        properties: {
          name: { type: "string" },
          trigger: { type: "string" },
          steps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string", enum: ["update", "notify", "condition"] },
                entity: { type: "string" },
                update: { type: "object" },
              },
              required: ["type"],
            },
          },
        },
        required: ["name", "trigger", "steps"],
      },
    },
    required: ["workflow"],
    additionalProperties: false,
  },
  TaskUpdate: {
    type: "object",
    properties: {
      taskId: { type: "string" },
      updates: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["open", "in-progress", "urgent", "done"] },
          priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
        },
      },
    },
    required: ["taskId", "updates"],
    additionalProperties: false,
  },
  TaskList: {
    type: "object",
    properties: {
      tasks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            status: { type: "string" },
            priority: { type: "string" },
          },
          required: ["id", "title", "status"],
        },
      },
    },
    required: ["tasks"],
    additionalProperties: false,
  },
};
