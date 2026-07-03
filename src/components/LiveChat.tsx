import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchRecentMessages, hydrateAuthor, type LiveMessage } from "@/lib/live";

export function LiveChat({ streamId }: { streamId: string }) {
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetchRecentMessages(streamId).then((rows) => { if (!cancelled) setMessages(rows); });

    const channel = supabase
      .channel(`live-chat-${streamId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "live_chat_messages", filter: `stream_id=eq.${streamId}` },
        async (payload) => {
          const row = payload.new as LiveMessage;
          const author = await hydrateAuthor(row.user_id);
          setMessages((prev) => [...prev.slice(-49), { ...row, author }]);
        },
      )
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [streamId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  return (
    <div ref={scrollRef} className="no-scrollbar max-h-52 overflow-y-auto pr-2">
      <div className="flex flex-col gap-1.5">
        {messages.filter((m) => m.kind !== "heart").map((m) => (
          <div key={m.id} className="flex items-start gap-2 text-white">
            {m.author?.avatar_url ? (
              <img src={m.author.avatar_url} alt="" className="mt-0.5 h-6 w-6 shrink-0 rounded-full border border-white/30 object-cover" />
            ) : (
              <div className="bg-gradient-primary mt-0.5 h-6 w-6 shrink-0 rounded-full border border-white/30" />
            )}
            <div className="text-[13px] leading-snug drop-shadow">
              <span className="font-semibold text-white/90">@{m.author?.handle ?? "user"}</span>{" "}
              {m.kind === "gift" ? (
                <span className="rounded-full bg-gradient-to-r from-fuchsia-500 to-rose-500 px-2 py-0.5 text-[11px] font-bold">
                  sent {m.gift_key ?? "a gift"} · {m.gift_coins}c
                </span>
              ) : m.kind === "join" ? (
                <span className="text-white/70">joined the room</span>
              ) : (
                <span className="text-white/95">{m.body}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
