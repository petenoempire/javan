import { motion, AnimatePresence } from "motion/react";
import { X, Send } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

type CommentRow = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  profile: { handle: string; display_name: string; avatar_url: string | null } | null;
};

export function CommentDrawer({ videoId, onClose }: { videoId: string | null; onClose: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", videoId],
    enabled: !!videoId,
    queryFn: async (): Promise<CommentRow[]> => {
      const { data } = await supabase
        .from("comments")
        .select("id,body,created_at,user_id")
        .eq("video_id", videoId!)
        .order("created_at", { ascending: false })
        .limit(200);
      const rows = data ?? [];
      if (rows.length === 0) return [];
      const ids = Array.from(new Set(rows.map((r) => r.user_id)));
      const { data: profs } = await supabase.from("profiles").select("id,handle,display_name,avatar_url").in("id", ids);
      const byId = new Map((profs ?? []).map((p: any) => [p.id, p]));
      return rows.map((r) => ({ ...r, profile: byId.get(r.user_id) ?? null }));
    },
  });

  useEffect(() => {
    if (!videoId) return;
    const ch = supabase
      .channel(`comments:${videoId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "comments", filter: `video_id=eq.${videoId}` }, () => {
        qc.invalidateQueries({ queryKey: ["comments", videoId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [videoId, qc]);

  const send = async () => {
    if (!user) { toast.info("Sign in to comment"); return; }
    if (!videoId || !text.trim()) return;
    const body = text.trim();
    setText("");
    const { error } = await supabase.from("comments").insert({ video_id: videoId, user_id: user.id, body });
    if (error) toast.error(error.message);
  };

  return (
    <AnimatePresence>
      {videoId && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 z-40 bg-black/50" />
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="glass-strong fixed bottom-0 left-1/2 z-50 flex h-[70dvh] w-[min(480px,100vw)] -translate-x-1/2 flex-col rounded-t-3xl shadow-elegant">
            <div className="flex items-center justify-between p-5 pb-3">
              <h3 className="font-display text-lg font-bold">{comments.length} comments</h3>
              <button onClick={onClose} className="rounded-full p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto px-5">
              {isLoading ? (
                <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
              ) : comments.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">Be the first to comment.</div>
              ) : comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  {c.profile?.avatar_url
                    ? <img src={c.profile.avatar_url} className="h-9 w-9 rounded-full object-cover" alt="" />
                    : <div className="bg-gradient-primary h-9 w-9 rounded-full" />}
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">@{c.profile?.handle ?? "user"}</div>
                    <div className="text-sm">{c.body}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border p-4">
              <div className="glass flex items-center gap-2 rounded-full px-4 py-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder={user ? "Add comment..." : "Sign in to comment"}
                  disabled={!user}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <button onClick={send} className="bg-gradient-primary rounded-full p-2">
                  <Send className="h-4 w-4 text-primary-foreground" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
