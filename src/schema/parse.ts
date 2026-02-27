import { parse as parseYaml } from 'yaml';
import { ServerTemplateSchema } from './server-template.schema.js';
import type { ServerTemplate } from './types.js';

export type ParseResult =
  | { success: true; data: ServerTemplate }
  | { success: false; errors: string[] };

export function parseTemplate(yamlString: string): ParseResult {
  let raw: unknown;
  try {
    raw = parseYaml(yamlString);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, errors: [`YAML syntax error: ${message}`] };
  }

  const result = ServerTemplateSchema.safeParse(raw);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.issues.map((issue) => {
    const path = issue.path.join('.');
    return path ? `${path}: ${issue.message}` : issue.message;
  });

  return { success: false, errors };
}
