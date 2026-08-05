import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Send } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/inbox/$id")({
  component: Chat,
});

function Chat() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const { data: conv } = useQuery({
    queryKey: ["conv", id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("conversations").select("id,user_a,user_b").eq("id", id).maybeSingle();
      if (!data) return null;
      const otherId = data.user_a === user!.id ? data.user_b : data.user_a;
      const { data: prof } = await supabase.from("profiles").select("id,handle,display_name,avatar_url").eq("id", otherId).maybeSingle();
      return { ...data, other: prof };
    },
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("messages").select("*").eq("conversation_id", id).order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel(`msgs:${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` }, () => {
        qc.invalidateQueries({ queryKey: ["messages", id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, qc]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  const send = async () => {
    if (!user || !text.trim()) return;
    const body = text.trim();
    setText("");
    const { error } = await supabase.from("messages").insert({ conversation_id: id, sender_id: user.id, body });
    if (error) { toast.error(error.message); return; }
    await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", id);
  };

  if (!user) return <div className="flex h-[100dvh] items-center justify-center text-sm">Sign in to chat.</div>;

  return (
    <div className="mx-auto flex h-[100dvh] max-w-[480px] flex-col bg-background">
      <header className="glass-strong sticky top-0 z-10 flex items-center gap-3 border-b border-border px-4 py-3">
        <Link to="/inbox" className="p-1"><ArrowLeft className="h-5 w-5" /></Link>
        {conv?.other?.avatar_url
          ? <img src={conv.other.avatar_url} className="h-9 w-9 rounded-full" alt="" />
          : <div className="bg-gradient-primary h-9 w-9 rounded-full" />}
        <div className="flex-1">
          <div className="font-display text-sm font-semibold">{conv?.other?.display_name ?? "Conversation"}</div>
          <div className="text-[11px] text-muted-foreground">@{conv?.other?.handle ?? ""}</div>
        </div>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="mt-10 text-center text-sm text-muted-foreground">Start the conversation.</div>
        )}
        {messages.map((m: any) => (
          <div key={m.id} className={`flex ${m.sender_id === user.id ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
              m.sender_id === user.id
                ? "bg-gradient-primary rounded-br-md text-primary-foreground shadow-glow"
                : "glass rounded-bl-md"
            }`}>{m.body}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border p-3">
        <div className="glass flex items-center gap-2 rounded-full px-3 py-2">
          <input
            value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Message…"
            className="flex-1 bg-transparent text-sm outline-none"
          />
          <button onClick={send} className="bg-gradient-primary rounded-full p-2 shadow-glow active:scale-90">
            <Send className="h-4 w-4 text-primary-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
