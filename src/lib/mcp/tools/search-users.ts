import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "search_users",
  title: "Search Javan users",
  description: "Search public Javan user profiles by handle or display name. Returns handle, display name, bio, avatar, and verified status.",
  inputSchema: {
    query: z.string().trim().min(1).describe("Handle or display-name fragment to search for."),
    limit: z.number().int().min(1).max(50).optional().describe("Max results (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }) => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      return { content: [{ type: "text", text: "Backend not configured." }], isError: true };
    }
    const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await sb
      .from("profiles")
      .select("handle, display_name, bio, avatar_url, is_verified")
      .or(`handle.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(limit ?? 10);
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { users: data ?? [] },
    };
  },
});
