const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const SYSTEM_PROMPT = `You are Ava, the friendly support assistant for Javan, a short-form video and live streaming social platform. Help with accounts and sign-in, profiles, verification, posting, LIVE, stories, coins, gifts, wallets, and withdrawals. Answer briefly and concretely in 2-4 sentences. If you are unsure or need account access, tell the user to tap Talk to a human. Never invent policies or promise refunds.`;
const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ message: "Method not allowed" }, 405);
  try {
    const body = await req.json();
    if (!Array.isArray(body?.messages) || body.messages.length === 0) return json({ message: "Missing messages" }, 400);
    const messages = body.messages.slice(-20).filter((m: unknown): m is { role: string; content: string } => {
      if (!m || typeof m !== "object") return false;
      const value = m as { role?: unknown; content?: unknown };
      return (value.role === "user" || value.role === "assistant") && typeof value.content === "string" && value.content.trim().length > 0;
    }).map((m: { role: string; content: string }) => ({ role: m.role, content: m.content.slice(0, 4000) }));
    if (messages.length === 0 || messages[messages.length - 1].role !== "user") return json({ reply: "Could you tell me a bit more about what you need help with?" });
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ reply: "Support chat is temporarily unavailable. Tap Talk to a human and our team will follow up." });
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages], max_tokens: 500 }),
    });
    if (response.status === 429) return json({ reply: "We're getting a lot of requests right now. Please try again in a moment." });
    if (response.status === 402) return json({ reply: "Support chat is temporarily unavailable. Tap Talk to a human and our team will follow up." });
    if (!response.ok) {
      console.error("[chat-support] gateway status", response.status);
      return json({ reply: "Something went wrong reaching support. Please try again, or tap Talk to a human." }, 502);
    }
    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();
    return json({ reply: reply || "I couldn't come up with an answer for that. Tap Talk to a human and a support agent will help you." });
  } catch (error) {
    console.error("[chat-support] request failed", error instanceof Error ? error.message : "unexpected error");
    return json({ message: "Chat failed" }, 503);
  }
});
