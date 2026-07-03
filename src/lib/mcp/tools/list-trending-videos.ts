import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "list_trending_videos",
  title: "List trending Javan videos",
  description: "Return the most recent public Javan videos with caption, creator handle, and engagement counts.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).optional().describe("Max videos to return (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }) => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      return { content: [{ type: "text", text: "Backend not configured." }], isError: true };
    }
    const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await sb
      .from("videos")
      .select("id, caption, created_at, like_count, comment_count, view_count, profiles:profiles(handle, display_name, is_verified)")
      .order("created_at", { ascending: false })
      .limit(limit ?? 10);
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { videos: data ?? [] },
    };
  },
});
