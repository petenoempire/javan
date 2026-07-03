import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "get_profile",
  title: "Get Javan profile",
  description: "Fetch a public Javan profile by handle. Returns display name, bio, avatar, cover, location, website, and verification status.",
  inputSchema: {
    handle: z.string().trim().min(1).describe("The user's handle (without the @)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ handle }) => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      return { content: [{ type: "text", text: "Backend not configured." }], isError: true };
    }
    const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const clean = handle.replace(/^@/, "");
    const { data, error } = await sb
      .from("profiles")
      .select("handle, display_name, bio, avatar_url, cover_url, location, website, is_verified")
      .eq("handle", clean)
      .maybeSingle();
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    if (!data) {
      return { content: [{ type: "text", text: `No profile found for @${clean}` }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { profile: data },
    };
  },
});
