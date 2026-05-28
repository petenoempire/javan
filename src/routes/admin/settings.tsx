import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Shield, UserPlus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [handle, setHandle] = useState("");

  const { data: admins } = useQuery({
    queryKey: ["admin-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("user_id, role, created_at, profiles:profiles!inner(handle, display_name, avatar_url)")
        .eq("role", "admin");
      return data ?? [];
    },
  });

  const grant = async () => {
    if (!handle.trim()) return;
    const { data: prof } = await supabase.from("profiles").select("id").eq("handle", handle.trim().replace(/^@/, "")).maybeSingle();
    if (!prof) { toast.error("User not found"); return; }
    const { error } = await supabase.from("user_roles").insert({ user_id: prof.id, role: "admin" });
    if (error) { toast.error(error.message); return; }
    toast.success("Admin granted");
    setHandle("");
    qc.invalidateQueries({ queryKey: ["admin-list"] });
  };

  const revoke = async (uid: string) => {
    if (uid === user?.id) { toast.error("You can't revoke your own admin role"); return; }
    const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", "admin");
    if (error) { toast.error(error.message); return; }
    toast.success("Admin revoked");
    qc.invalidateQueries({ queryKey: ["admin-list"] });
  };

  return (
    <AdminShell title="Settings" subtitle="Platform configuration and admin team.">
      <div className="glass rounded-3xl p-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-primary flex h-10 w-10 items-center justify-center rounded-xl">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display text-lg font-semibold">Admin team</div>
            <div className="text-xs text-muted-foreground">Grant or revoke console access by handle.</div>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="@handle"
            className="glass flex-1 rounded-2xl px-4 py-2.5 text-sm outline-none"
          />
          <button onClick={grant} className="bg-gradient-primary flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow">
            <UserPlus className="h-4 w-4" /> Grant admin
          </button>
        </div>

        <div className="mt-6 space-y-2">
          {admins?.map((a: any) => (
            <div key={a.user_id} className="flex items-center justify-between rounded-2xl border border-border/60 px-3 py-2">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-primary h-9 w-9 overflow-hidden rounded-full">
                  {a.profiles?.avatar_url && <img src={a.profiles.avatar_url} alt="" className="h-full w-full object-cover" />}
                </div>
                <div>
                  <div className="text-sm font-semibold">{a.profiles?.display_name}</div>
                  <div className="text-xs text-muted-foreground">@{a.profiles?.handle}</div>
                </div>
              </div>
              <button onClick={() => revoke(a.user_id)} className="glass flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-destructive">
                <Trash2 className="h-3 w-3" /> Revoke
              </button>
            </div>
          ))}
          {!admins?.length && <div className="text-sm text-muted-foreground">No admins yet.</div>}
        </div>
      </div>
    </AdminShell>
  );
}
