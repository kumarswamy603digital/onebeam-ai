  import type { JSONSchema, ValidationResult } from "./types";

/**
 * Validates data against a JSON schema.
 * Production-grade validation ensuring no free-form text drives execution.
 */
export function validateAgainstSchema(
  data: unknown,
  schema: JSONSchema
): ValidationResult {
  const errors: string[] = [];

  function validate(value: unknown, s: JSONSchema, path: string): void {
    if (s.type === "object") {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        errors.push(`${path}: expected object, got ${typeof value}`);
        return;
      }
      const obj = value as Record<string, unknown>;

      // Check required fields
      if (s.required) {
        for (const key of s.required) {
          if (!(key in obj)) {
            errors.push(`${path}.${key}: required field missing`);
          }
        }
      }

      // Validate properties
      if (s.properties) {
        for (const [key, propSchema] of Object.entries(s.properties)) {
          if (key in obj) {
            validate(obj[key], propSchema, `${path}.${key}`);
          }
        }
      }

      // Disallow additional properties if specified
      if (s.additionalProperties === false && s.properties) {
        for (const key of Object.keys(obj)) {
          if (!(key in s.properties)) {
            errors.push(`${path}.${key}: unexpected property`);
          }
        }
      }
    } else if (s.type === "array") {
      if (!Array.isArray(value)) {
        errors.push(`${path}: expected array, got ${typeof value}`);
        return;
      }
      if (s.items) {
        value.forEach((item, i) => validate(item, s.items!, `${path}[${i}]`));
      }
    } else if (s.type === "string") {
      if (typeof value !== "string") {
        errors.push(`${path}: expected string, got ${typeof value}`);
      } else if (s.enum && !s.enum.includes(value)) {
        errors.push(`${path}: must be one of [${s.enum.join(", ")}]`);
      }
    } else if (s.type === "number") {
      if (typeof value !== "number") {
        errors.push(`${path}: expected number, got ${typeof value}`);
      }
    } else if (s.type === "boolean") {
      if (typeof value !== "boolean") {
        errors.push(`${path}: expected boolean, got ${typeof value}`);
      }
    }
  }

  validate(data, schema, "$");
  return { valid: errors.length === 0, errors };
}
