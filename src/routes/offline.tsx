import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, DownloadCloud, Trash2, Play, Wifi } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/offline")({
  head: () => ({ meta: [{ title: "Offline videos · Boogle" }] }),
  component: OfflinePage,
});

function OfflinePage() {
  const { user } = useAuth();

  const { data: saved = [] } = useQuery({
    queryKey: ["offline-list", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("videos")
        .select("id,caption,thumbnail_url,video_url,created_at")
        .eq("user_id", user!.id).eq("status", "active")
        .order("created_at", { ascending: false }).limit(20);
      return data ?? [];
    },
  });

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-background pb-20">
      <header className="glass-strong sticky top-0 z-10 flex items-center gap-3 border-b border-border px-4 py-3">
        <Link to="/profile" className="p-1"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="font-display text-lg font-bold">Offline videos</h1>
      </header>

      <div className="px-4 pt-5">
        <div className="glass mb-4 flex items-center gap-3 rounded-2xl p-4">
          <Wifi className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <div className="text-sm font-semibold">Save for offline</div>
            <div className="text-[11px] text-muted-foreground">Cache videos for travel & low-signal viewing.</div>
          </div>
        </div>

        {saved.length === 0 ? (
          <div className="glass rounded-3xl p-10 text-center">
            <DownloadCloud className="mx-auto h-8 w-8 text-muted-foreground" />
            <div className="mt-3 font-display font-semibold">No saved videos</div>
            <div className="mt-1 text-xs text-muted-foreground">Tap the download icon on any video to save it here.</div>
          </div>
        ) : (
          <ul className="glass divide-y divide-border/40 overflow-hidden rounded-2xl">
            {saved.map((v: any) => (
              <li key={v.id} className="flex items-center gap-3 px-3 py-3">
                <div className="relative h-14 w-12 overflow-hidden rounded-lg bg-muted">
                  {v.thumbnail_url
                    ? <img src={v.thumbnail_url} className="h-full w-full object-cover" alt="" />
                    : <video src={v.video_url} className="h-full w-full object-cover" muted />}
                  <Play className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{v.caption || "Untitled"}</div>
                  <div className="text-[11px] text-muted-foreground">{new Date(v.created_at).toLocaleDateString()}</div>
                </div>
                <button onClick={() => toast.success("Removed from offline")} className="rounded-full p-2 text-muted-foreground hover:bg-muted">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
