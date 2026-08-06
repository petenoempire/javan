import { createServerFn } from "@tanstack/react-start";

type ChatRole = "user" | "assistant";

export type SupportMessage = { role: ChatRole; content: string };

const SYSTEM_PROMPT = `You are Ava, the friendly support assistant for Javan, a short-form video and live streaming social platform.
You help users with: accounts and sign-in, profile and verification, creating and posting videos, going LIVE, stories,
coins, gifts (creators keep 80%), wallet, and withdrawals (minimum $20, 7-day hold, identity verification required).
Answer briefly and concretely (2-4 sentences). If you are unsure or the issue needs account access,
tell the user to tap "Talk to a human" to open a support ticket. Never invent policies or promise refunds.`;

function sanitize(messages: unknown): SupportMessage[] {
  if (!Array.isArray(messages)) throw new Error("messages must be an array");
  return messages
    .slice(-20)
    .filter(
      (m): m is SupportMessage =>
        !!m &&
        typeof m === "object" &&
        ((m as SupportMessage).role === "user" || (m as SupportMessage).role === "assistant") &&
        typeof (m as SupportMessage).content === "string",
    )
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
}

export const chatSupport = createServerFn({ method: "POST" })
  .inputValidator((input: { messages: SupportMessage[] }) => ({
    messages: sanitize(input?.messages),
  }))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      return { reply: "Support chat is temporarily unavailable. Tap \"Talk to a human\" and our team will follow up." };
    }

    const history = data.messages;
    if (history.length === 0 || history[history.length - 1]!.role !== "user") {
      return { reply: "Could you tell me a bit more about what you need help with?" };
    }

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
        }),
      });

      if (res.status === 429) {
        return { reply: "We're getting a lot of requests right now. Please try again in a moment." };
      }
      if (res.status === 402) {
        return { reply: "Support chat is temporarily unavailable. Tap \"Talk to a human\" and our team will follow up." };
      }
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        console.error("[chat-support] gateway error", res.status, detail.slice(0, 500));
        throw new Error(`Gateway error ${res.status}`);
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const reply = json.choices?.[0]?.message?.content?.trim();
      return {
        reply:
          reply ||
          "I couldn't come up with an answer for that. Tap \"Talk to a human\" and a support agent will help you.",
      };
    } catch (err) {
      console.error("[chat-support] failed:", err);
      return {
        reply: "Something went wrong reaching support. Please try again, or tap \"Talk to a human\".",
      };
    }
  });
