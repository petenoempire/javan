import type { McpDef } from "../lovable-stub";

type HandlerOptions = {
  resourcePath?: string;
  metadataPath?: string;
  trustForwardedHost?: boolean;
};

function notAvailableHandler(_mcp?: McpDef, _opts?: HandlerOptions) {
  return async () =>
    new Response(
      JSON.stringify({ error: "MCP server is not available in this environment." }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
}

export const createTanStackMcpHandler = notAvailableHandler;
export const createTanStackListToolsHandler = notAvailableHandler;
export const createTanStackInvokeToolHandler = notAvailableHandler;
export const createTanStackOAuthProtectedResourceMetadataHandler = notAvailableHandler;
