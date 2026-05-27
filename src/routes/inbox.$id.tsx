import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Send, Smile, Image as ImageIcon, Check, CheckCheck } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { chats } from "@/lib/mock";

export const Route = createFileRoute("/inbox/$id")({
  component: Chat,
});

type Msg = { id: number; from: "me" | "them"; text: string; status: "sent" | "delivered" | "read" };

const seed: Msg[] = [
  { id: 1, from: "them", text: "yo did you see the new track drop", status: "read" },
  { id: 2, from: "me", text: "yessir, on repeat 🔥", status: "read" },
  { id: 3, from: "them", text: "let's collab on that edit ✨", status: "read" },
];

function Chat() {
  const { id } = Route.useParams();
  const chat = chats.find((c) => c.id === id) ?? chats[0];
  const [messages, setMessages] = useState<Msg[]>(seed);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = () => {
    if (!text.trim()) return;
    const m: Msg = { id: Date.now(), from: "me", text, status: "sent" };
    setMessages((p) => [...p, m]);
    setText("");
    setTimeout(() => setMessages((p) => p.map((x) => x.id === m.id ? { ...x, status: "delivered" } : x)), 600);
    setTimeout(() => setMessages((p) => p.map((x) => x.id === m.id ? { ...x, status: "read" } : x)), 1600);
    setTimeout(() => setMessages((p) => [...p, { id: Date.now() + 1, from: "them", text: "🙌", status: "read" }]), 2200);
  };

  return (
    <div className="mx-auto flex h-[100dvh] max-w-[480px] flex-col bg-background">
      <header className="glass-strong sticky top-0 z-10 flex items-center gap-3 border-b border-border px-4 py-3">
        <Link to="/inbox" className="p-1"><ArrowLeft className="h-5 w-5" /></Link>
        <img src={chat.user.avatar} className="h-9 w-9 rounded-full" alt="" />
        <div className="flex-1">
          <div className="font-display text-sm font-semibold">{chat.user.name}</div>
          <div className="text-[11px] text-accent">{chat.online ? "Active now" : "Offline"}</div>
        </div>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
              m.from === "me"
                ? "bg-gradient-primary rounded-br-md text-primary-foreground shadow-glow"
                : "glass rounded-bl-md"
            }`}>
              <div>{m.text}</div>
              {m.from === "me" && (
                <div className="mt-1 flex justify-end text-[10px] opacity-80">
                  {m.status === "sent" && <Check className="h-3 w-3" />}
                  {m.status === "delivered" && <CheckCheck className="h-3 w-3" />}
                  {m.status === "read" && <CheckCheck className="h-3 w-3 text-accent" />}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border p-3">
        <div className="glass flex items-center gap-2 rounded-full px-3 py-2">
          <button className="text-muted-foreground"><Smile className="h-5 w-5" /></button>
          <button className="text-muted-foreground"><ImageIcon className="h-5 w-5" /></button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
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
