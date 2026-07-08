import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, ListOrdered, Plus, Send, Loader2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/help/chat")({
  head: () => ({ meta: [{ title: "Javan Support · Chat" }] }),
  component: SupportChat,
});

const issueTypes = ["Account", "Posts", "LIVE", "Profile", "Music", "Monetization", "Safety", "Other"];
const quickFixes: Record<string, string[]> = {
  Account: ["I can't log in", "Verification status", "Change username", "Connect live support"],
  Posts: ["Post upload failed", "Video processing", "Sound problem", "Connect live support"],
  LIVE: ["Camera or microphone", "Mobile gaming LIVE", "LIVE Studio", "Connect live support"],
  Profile: ["Edit profile", "Profile viewers", "Story upload", "Connect live support"],
  Music: ["Artist account", "Release distribution", "Sound library", "Connect live support"],
  Monetization: ["Rewards", "Subscriptions", "Payouts", "Connect live support"],
  Safety: ["Report abuse", "Account security", "Content policy", "Connect live support"],
  Other: ["Ask a question", "Report a bug", "Connect live support"],
};

type Msg = { id: string; body: string; is_agent: boolean; created_at: string };
const AGENT_TRIGGERS = /\b(agent|human|representative|live\s*support|ticket|talk to (a|someone)|real person)\b/i;

function SupportChat() {
  const { user } = useAuth();
  const [category, setCategory] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([
    bot("Welcome to Javan Support. Pick a topic and I’ll guide you with quick choices. If I can’t resolve it, I’ll create a support ticket for the team."),
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, escalated, showTicketForm, isBotTyping]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const queueAvaReply = (body: string, afterReply?: () => void) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsBotTyping(true);
    timerRef.current = setTimeout(() => {
      setMessages((m) => [...m, bot(body)]);
      setIsBotTyping(false);
      afterReply?.();
      timerRef.current = null;
    }, 5000);
  };

  const chooseCategory = (cat: string) => {
    if (isBotTyping) return;
    setCategory(cat);
    setMessages((m) => [...m, human(cat)]);
    queueAvaReply(`I can help with ${cat}. Choose the closest option below, or ask to connect to live support.`);
  };

  const chooseQuick = (choice: string) => {
    if (isBotTyping) return;
    setMessages((m) => [...m, human(choice)]);
    if (/connect live support/i.test(choice)) {
      setSubject(`${category ?? "Support"} request`);
      queueAvaReply("No problem — fill out the ticket details below and I’ll place it in the support queue.", () => setShowTicketForm(true));
      return;
    }
    queueAvaReply(resolveChoice(choice));
  };

  const submitTicket = async () => {
    if (!user) { toast.error("Sign in to create a support ticket"); return; }
    if (!subject.trim() || !details.trim()) { toast.error("Add a subject and describe the issue"); return; }
    setSending(true);
    const { data, error } = await supabase
      .from("support_tickets")
      .insert({ user_id: user.id, category: category ?? "Other", subject: subject.trim(), status: "queued" })
      .select("id")
      .single();
    if (!error && data) {
      await supabase.from("support_messages").insert({ ticket_id: data.id, sender_id: user.id, body: details.trim(), is_agent: false });
      setTicketId(data.id);
      setEscalated(true);
      setShowTicketForm(false);
      setMessages((m) => [...m, human(details.trim())]);
      queueAvaReply(`Your ticket is created. Ticket ID: ${data.id}. A support teammate will review it and reply here.`);
      setSubject("");
      setDetails("");
    }
    setSending(false);
    if (error) toast.error(error.message);
  };

  const send = async () => {
    if (!input.trim() || isBotTyping) return;
    const body = input.trim();
    setInput("");
    setMessages((m) => [...m, human(body)]);
    if (AGENT_TRIGGERS.test(body)) {
      setSubject(`${category ?? "Support"} request`);
      queueAvaReply("I’ll connect you to the team. Please complete the ticket form so they have the context they need.", () => setShowTicketForm(true));
      return;
    }
    queueAvaReply("I found a likely fix: refresh the app, confirm you’re signed in, then retry the exact action. If it still fails, tap ‘Connect live support’ and I’ll create a ticket.");
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-[480px] flex-col bg-background">
      <header className="glass-strong sticky top-0 z-20 flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/help" className="p-1" aria-label="Back"><ArrowLeft className="h-5 w-5" /></Link>
          <div>
            <h1 className="font-display text-base font-bold">Ava</h1>
            <div className="text-[10px] text-muted-foreground">Automated help first, live team when needed</div>
          </div>
        </div>
        <button onClick={() => toast.info(ticketId ? `Current ticket: ${ticketId}` : "No support ticket yet")} className="p-1" aria-label="Chat history"><ListOrdered className="h-5 w-5" /></button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 pb-44">
        <div className="space-y-3">
          {messages.map((m) => <Bubble key={m.id} msg={m} />)}
          {isBotTyping && <TypingBubble />}

          {!category && (
            <div className="grid grid-cols-2 gap-2 pt-2">
              {issueTypes.map((t) => (
                <button key={t} onClick={() => chooseCategory(t)} disabled={isBotTyping} className="glass rounded-2xl px-4 py-3 text-sm font-semibold transition active:scale-95 disabled:opacity-50">{t}</button>
              ))}
            </div>
          )}

          {category && !showTicketForm && !ticketId && (
            <div className="space-y-2 pt-2">
              {(quickFixes[category] ?? quickFixes.Other).map((choice) => (
                <button key={choice} onClick={() => chooseQuick(choice)} disabled={isBotTyping} className="flex w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm font-semibold active:scale-[0.99] disabled:opacity-50">
                  <span>{choice}</span><CheckCircle2 className="h-4 w-4 text-primary" />
                </button>
              ))}
            </div>
          )}

          {showTicketForm && (
            <div className="rounded-3xl border border-rose-500/30 bg-card p-4">
              <div className="font-display text-sm font-bold">Create support ticket</div>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Short subject" className="mt-3 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none" />
              <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={4} placeholder="Explain what happened and what you expected" className="mt-3 w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none" />
              <button onClick={submitTicket} disabled={sending} className="bg-gradient-primary mt-3 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-50">
                {sending && <Loader2 className="h-4 w-4 animate-spin" />} Submit ticket
              </button>
            </div>
          )}

          {escalated && ticketId && (
            <div className="my-4 rounded-3xl border border-rose-500/30 bg-gradient-to-br from-rose-500/10 to-fuchsia-500/10 p-4">
              <div className="flex items-center gap-2 text-rose-400"><Clock className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-wider">Ticket queued</span></div>
              <div className="mt-2 font-display text-sm font-bold text-foreground">Ticket ID: {ticketId}</div>
              <div className="mt-1 text-xs text-muted-foreground">You’re awaiting team feedback. Keep this ID for follow-up.</div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-[480px] border-t border-border bg-background/95 px-3 py-3 backdrop-blur">
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1.5">
          <button onClick={() => toast.info("Attachments can be described in the ticket details for now")} className="flex h-9 w-9 items-center justify-center rounded-full bg-muted" aria-label="Attach"><Plus className="h-4 w-4" /></button>
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask Ava or type ‘live support’..." className="flex-1 bg-transparent px-2 text-sm outline-none" />
          <button onClick={send} disabled={!input.trim() || isBotTyping} className="bg-gradient-primary flex h-9 w-9 items-center justify-center rounded-full text-primary-foreground disabled:opacity-40"><Send className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}

function bot(body: string): Msg { return { id: crypto.randomUUID(), body, is_agent: true, created_at: new Date().toISOString() }; }
function human(body: string): Msg { return { id: crypto.randomUUID(), body, is_agent: false, created_at: new Date().toISOString() }; }
function Bubble({ msg }: { msg: Msg }) {
  return <div className={`flex ${msg.is_agent ? "justify-start" : "justify-end"}`}><div className={`max-w-[84%] rounded-2xl px-4 py-2.5 text-sm ${msg.is_agent ? "glass" : "bg-gradient-primary text-primary-foreground shadow-glow"}`}>{msg.is_agent && <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-primary">Ava</div>}{msg.body}</div></div>;
}
function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="glass max-w-[84%] rounded-2xl px-4 py-2.5 text-sm">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-primary">Ava</div>
        <div className="flex h-5 items-center gap-1" aria-label="Ava is typing">
          {[0, 1, 2].map((dot) => (
            <span key={dot} className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${dot * 140}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
function resolveChoice(choice: string) {
  if (/camera|microphone/i.test(choice)) return "Open Create, choose LIVE, then Device camera. Your browser will request camera and microphone permission. Allow both, then tap Go LIVE.";
  if (/mobile gaming/i.test(choice)) return "Open Create → LIVE → Mobile gaming. Start screen sharing from your phone controls, then return to Javan and tap Go LIVE.";
  if (/studio/i.test(choice)) return "Open Create → LIVE → LIVE Studio. Use the download link option for desktop streaming setup, or continue from your phone for quick LIVE.";
  if (/verification/i.test(choice)) return "Go to Settings → Account → Verification. Submit legal identity, public role, official links, press proof, and document upload for review.";
  if (/distribution|sound library/i.test(choice)) return "Artists can upload tracks in Music Studio. Distribution partner onboarding is handled from Artist Account and release submissions.";
  return "Try the guided step once. If the issue continues, choose ‘Connect live support’ and I’ll create a support ticket for the team.";
}
