import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MobileShell } from "@/components/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Heart, MessageCircle, Share2 } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/inbox")({ 
  head: () => ({ meta: [{ title: "Messages · Javan" }] }),
  component: InboxPage,
});

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  sender?: { handle: string; display_name: string; avatar_url?: string };
}

function InboxPage() {
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("messages")
        .select(
          `*,
           sender:sender_id(handle, display_name, avatar_url)
         `
        )
        .order("created_at", { ascending: false })
        .limit(50);
      return (data as Message[]) ?? [];
    },
  });

  const uniqueConversations = Array.from(
    new Map(
      conversations.map((msg) => [msg.sender_id, msg])
    ).values()
  );

  return (
    <MobileShell>
      <div className="px-4 pt-4 pb-20">
        <h1 className="font-display text-2xl font-black mb-4">Messages</h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-white"></div>
          </div>
        ) : uniqueConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageCircle className="h-12 w-12 text-white/20 mb-3" />
            <p className="text-sm text-white/50">No messages yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {uniqueConversations.map((msg) => (
              <Link
                key={msg.id}
                to={`/inbox/${msg.sender_id}`}
                className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-3 hover:bg-white/10 transition-all"
              >
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{msg.sender?.display_name}</p>
                  <p className="text-[10px] text-white/50 truncate">{msg.content}</p>
                </div>
                <p className="text-[9px] text-white/40 shrink-0">{new Date(msg.created_at).toLocaleDateString()}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MobileShell>
  );
}
