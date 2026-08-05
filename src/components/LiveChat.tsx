import React, { useState } from "react";
import { Send, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  kind?: string;
  created_at: string;
  author: { handle: string; display_name: string };
}

interface LiveChatProps {
  streamId: string;
}

export function LiveChat({ streamId }: LiveChatProps) {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  React.useEffect(() => {
    const channel = supabase
      .channel(`live-chat-${streamId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "live_chat_messages", filter: `stream_id=eq.${streamId}` },
        (payload: any) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId]);

  const handleSend = async () => {
    if (!input.trim() || !user) return;

    try {
      await supabase.from("live_chat_messages").insert({
        stream_id: streamId,
        user_id: user.id,
        content: input,
        kind: "message",
      });
      setInput("");
    } catch (err) {
      toast.error("Failed to send message");
    }
  };

  return (
    <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden flex flex-col max-h-48">
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {messages.slice(-10).map((msg) => (
          <div key={msg.id} className="text-[10px]">
            <span className="font-bold text-cyan-400">{msg.author.handle}:</span>
            <span className="text-white/80 ml-1">{msg.content}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-1 px-2 py-2 border-t border-white/10">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Say something..."
          className="flex-1 bg-white/10 rounded-full px-2 py-1 text-[10px] outline-none focus:ring-1 focus:ring-cyan-500 text-white placeholder:text-white/40"
        />
        <button
          onClick={handleSend}
          className="rounded-full bg-white/10 p-1 hover:bg-white/20 active:scale-90 transition-all"
        >
          <Send className="h-3 w-3 text-white/70" />
        </button>
      </div>
    </div>
  );
}
