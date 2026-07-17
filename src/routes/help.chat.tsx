import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { MobileShell } from "@/components/MobileShell";
import { ArrowLeft, Send, Loader2, Headset } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/help/chat")({
  head: () => ({ meta: [{ title: "Chat with us · Javan" }] }),
  component: ChatPage,
});

interface Message {
  role: "user" | "assistant";
  content: string;
}

function generateTicketNumber() {
  return `JVN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm Javan's support assistant. What can I help you with today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat-support", {
        body: { messages: newMessages },
      });
      if (error) throw error;
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err: any) {
      toast.error("Failed to get a response. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const talkToHuman = async () => {
    if (!user) {
      toast.error("Sign in to create a support ticket");
      return;
    }
    setEscalating(true);
    try {
      const ticketNumber = generateTicketNumber();
      const transcript = messages.map((m) => `${m.role === "user" ? "User" : "Bot"}: ${m.content}`).join("\n");

      const { data: ticket, error: ticketError } = await supabase
        .from("support_tickets")
        .insert({
          ticket_number: ticketNumber,
          user_id: user.id,
          category: "other",
          subject: "Escalated from chat",
          description: transcript,
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      toast.success(`Ticket ${ticketNumber} created. Our team will follow up by email.`);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I've created ticket ${ticketNumber} and passed our conversation to a live agent. They'll follow up with you soon.`,
        },
      ]);
    } catch (err: any) {
      toast.error(err.message || "Failed to create ticket");
    } finally {
      setEscalating(false);
    }
  };

  return (
    <MobileShell>
      <div className="flex flex-col h-[calc(100dvh-64px)]">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <Link to="/help" className="text-white/50 p-1">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-display text-sm font-black">Chat with us</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "user"
                    ? "bg-gradient-to-r from-fuchsia-600 to-rose-600 text-white"
                    : "bg-white/10 text-white"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-white/10 px-4 py-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-white/60" />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        <div className="px-4 pb-2">
          <button
            onClick={talkToHuman}
            disabled={escalating}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-white/10 border border-white/10 py-2.5 text-xs font-bold text-white/80 active:scale-95 transition-all disabled:opacity-50"
          >
            {escalating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Headset className="h-3.5 w-3.5" />}
            Talk to a human
          </button>
        </div>

        <div className="flex items-center gap-2 px-4 py-3 border-t border-white/10">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 rounded-full bg-white/10 border border-white/10 px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="rounded-full bg-gradient-to-r from-fuchsia-600 to-rose-600 p-2.5 active:scale-90 transition-all disabled:opacity-50"
          >
            <Send className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>
    </MobileShell>
  );
}
