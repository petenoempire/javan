import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { Film, Trash2, Eye, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/content")({
  component: AdminContent,
});

function AdminContent() {
  const qc = useQueryClient();
  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["admin-content"],
    queryFn: async () => {
      const { data } = await supabase.from("videos")
        .select("id,video_url,thumbnail_url,caption,status,views,created_at,user_id,profiles!videos_user_id_fkey(handle)")
        .order("created_at", { ascending: false }).limit(60);
      return data ?? [];
    },
  });

  const setStatus = async (id: string, status: "active" | "removed") => {
    const { error } = await supabase.from("videos").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Video ${status === "removed" ? "removed" : "restored"}`);
    qc.invalidateQueries({ queryKey: ["admin-content"] });
  };

  return (
    <AdminShell title="Content" subtitle="Moderate uploaded videos.">
      {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div>
        : videos.length === 0 ? (
          <div className="glass flex flex-col items-center gap-2 rounded-3xl p-8 text-center">
            <Film className="h-7 w-7 text-muted-foreground" />
            <div className="font-display font-semibold">No videos uploaded yet</div>
            <div className="text-xs text-muted-foreground">Once users start posting, you'll moderate them here.</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {videos.map((v: any) => (
              <div key={v.id} className={`glass overflow-hidden rounded-2xl ${v.status === "removed" ? "opacity-60" : ""}`}>
                <div className="relative aspect-[9/16] bg-black">
                  {v.thumbnail_url
                    ? <img src={v.thumbnail_url} alt="" className="h-full w-full object-cover" />
                    : <video src={v.video_url} className="h-full w-full object-cover" muted />}
                  {v.status === "removed" && (
                    <span className="absolute left-2 top-2 rounded-full bg-destructive/90 px-2 py-0.5 text-[10px] font-semibold text-destructive-foreground">Removed</span>
                  )}
                </div>
                <div className="p-3">
                  <div className="line-clamp-2 text-xs">{v.caption || <span className="text-muted-foreground">No caption</span>}</div>
                  <div className="mt-1 text-[10px] text-muted-foreground">@{v.profiles?.handle}</div>
                  <div className="mt-2 flex gap-1.5">
                    <a href={v.video_url} target="_blank" rel="noreferrer" className="glass inline-flex flex-1 items-center justify-center gap-1 rounded-full px-2 py-1 text-[10px]">
                      <Eye className="h-3 w-3" /> View
                    </a>
                    {v.status === "active"
                      ? <button onClick={() => setStatus(v.id, "removed")} className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-destructive px-2 py-1 text-[10px] font-semibold text-destructive-foreground">
                          <Trash2 className="h-3 w-3" /> Remove
                        </button>
                      : <button onClick={() => setStatus(v.id, "active")} className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-accent px-2 py-1 text-[10px] font-semibold text-background">
                          <RotateCcw className="h-3 w-3" /> Restore
                        </button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </AdminShell>
  );
}
