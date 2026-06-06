import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ListOrdered, Plus, Send, Loader2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/help/chat")({
  head: () => ({ meta: [{ title: "Javan Support · Chat" }] }),
  component: SupportChat,
});

const issueTypes = ["Account", "Interaction", "LIVE", "Traffic", "Post", "Monetization", "Feed", "Other"];

type Msg = { id: string; body: string; is_agent: boolean; created_at: string };

const AGENT_TRIGGERS = /\b(agent|human|representative|live\s*support|talk to (a|someone)|real person)\b/i;

function SupportChat() {
  const { user } = useAuth();
  const [category, setCategory] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, escalated]);

  const startTicket = async (cat: string) => {
    if (!user) { toast.error("Sign in to start a chat"); return null; }
    const { data, error } = await supabase
      .from("support_tickets")
      .insert({ user_id: user.id, category: cat, subject: `${cat} support request` })
      .select("id")
      .single();
    if (error) { toast.error(error.message); return null; }
    setTicketId(data.id);
    setCategory(cat);
    setMessages([
      { id: "sys", body: `Thanks for reaching out about ${cat}. A Javan Support team member will follow up here. You can keep typing in the meantime.`, is_agent: true, created_at: new Date().toISOString() },
    ]);
    return data.id;
  };

  const send = async () => {
    if (!input.trim() || !user) return;
    let tid = ticketId;
    if (!tid) {
      tid = await startTicket(category ?? "Other");
      if (!tid) return;
    }
    const body = input.trim();
    setInput("");
    setSending(true);
    const { data, error } = await supabase
      .from("support_messages")
      .insert({ ticket_id: tid, sender_id: user.id, body, is_agent: false })
      .select("id, body, is_agent, created_at")
      .single();
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setMessages((m) => [...m, data as Msg]);

    if (AGENT_TRIGGERS.test(body) && !escalated) {
      setEscalated(true);
      await supabase.from("support_tickets").update({ status: "active" }).eq("id", tid).select();
    }
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-[480px] flex-col bg-background">
      <header className="glass-strong sticky top-0 z-20 flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/help" className="p-1"><ArrowLeft className="h-5 w-5" /></Link>
          <div>
            <h1 className="font-display text-base font-bold">Javan Support</h1>
            <div className="text-[10px] text-muted-foreground">Typically replies in a few minutes</div>
          </div>
        </div>
        <button className="p-1" aria-label="Chat history"><ListOrdered className="h-5 w-5" /></button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 pb-40">
        {!category && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-card p-4 text-sm">
              <div className="font-display font-bold">We're here to help!</div>
              <div className="text-muted-foreground">Select an issue type to get started.</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {issueTypes.map((t) => (
                <button
                  key={t} onClick={() => startTicket(t)}
                  className="glass rounded-2xl px-4 py-3 text-sm font-semibold active:scale-95 transition"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {category && (
          <div className="space-y-3">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.is_agent ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.is_agent ? "glass" : "bg-gradient-primary text-primary-foreground shadow-glow"}`}>
                  {m.body}
                </div>
              </div>
            ))}

            {escalated && (
              <div className="my-4 rounded-3xl border border-rose-500/30 bg-gradient-to-br from-rose-500/10 to-fuchsia-500/10 p-4">
                <div className="flex items-center gap-2 text-rose-400">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">You're in the queue</span>
                </div>
                <div className="mt-2 font-display text-sm font-bold text-foreground">An agent will be with you shortly</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Your ticket has been escalated to a Javan Support team member. Estimated wait: <span className="font-semibold text-foreground">a few minutes</span>. You'll see their reply right in this chat.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-[480px] border-t border-border bg-background/95 px-3 py-3 backdrop-blur">
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1.5">
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-muted" aria-label="Attach">
            <Plus className="h-4 w-4" />
          </button>
          <input
            value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Send a message..."
            className="flex-1 bg-transparent px-2 text-sm outline-none"
          />
          <button onClick={send} disabled={sending || !input.trim()} className="bg-gradient-primary flex h-9 w-9 items-center justify-center rounded-full text-primary-foreground disabled:opacity-40">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
