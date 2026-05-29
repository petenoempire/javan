import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Flag, CheckCircle2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/reports")({
  component: AdminReports,
});

function AdminReports() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"open" | "reviewed" | "dismissed" | "actioned">("open");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin-reports", tab],
    queryFn: async () => {
      const { data } = await supabase.from("reports").select("*").eq("status", tab).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const setStatus = async (id: string, status: "reviewed" | "dismissed" | "actioned") => {
    if (!user) return;
    const { error } = await supabase.from("reports").update({ status, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Marked ${status}`);
    qc.invalidateQueries({ queryKey: ["admin-reports"] });
  };

  const removeContent = async (r: any) => {
    if (r.target_type === "video") {
      const { error } = await supabase.from("videos").update({ status: "removed" }).eq("id", r.target_id);
      if (error) { toast.error(error.message); return; }
    } else if (r.target_type === "comment") {
      const { error } = await supabase.from("comments").delete().eq("id", r.target_id);
      if (error) { toast.error(error.message); return; }
    }
    await setStatus(r.id, "actioned");
  };

  return (
    <AdminShell title="Reports" subtitle="Triage user reports and take action on offending content.">
      <div className="glass mb-4 inline-flex rounded-full p-1">
        {(["open", "reviewed", "dismissed", "actioned"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize ${tab === t ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div>
        : items.length === 0 ? (
          <div className="glass flex flex-col items-center gap-2 rounded-3xl p-8 text-center">
            <Flag className="h-7 w-7 text-muted-foreground" />
            <div className="font-display font-semibold">No {tab} reports</div>
            <div className="text-xs text-muted-foreground">User reports will appear here when filed.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((r: any) => (
              <div key={r.id} className="glass rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{r.reason}</div>
                    <div className="text-xs text-muted-foreground">{r.target_type} · {r.target_id}</div>
                    {r.details && <div className="mt-2 text-xs">"{r.details}"</div>}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                </div>
                {tab === "open" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => removeContent(r)} className="inline-flex items-center gap-1 rounded-full bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground">
                      <Trash2 className="h-3.5 w-3.5" /> Remove content
                    </button>
                    <button onClick={() => setStatus(r.id, "reviewed")} className="glass inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Mark reviewed
                    </button>
                    <button onClick={() => setStatus(r.id, "dismissed")} className="glass inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs">
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      }
    </AdminShell>
  );
}
