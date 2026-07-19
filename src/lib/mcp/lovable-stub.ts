import type { z } from "zod";

type ToolDef = {
  name: string;
  title?: string;
  description?: string;
  inputSchema?: Record<string, z.ZodTypeAny>;
  annotations?: Record<string, unknown>;
  handler: (input: Record<string, unknown>) => Promise<unknown>;
};

export function defineTool<T extends ToolDef>(tool: T): T {
  return tool;
}

type McpDef = {
  name: string;
  title?: string;
  version?: string;
  instructions?: string;
  tools: ToolDef[];
};

export function defineMcp(mcp: McpDef): McpDef {
  return mcp;
}
