import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { Users, Film, ShieldCheck, Flag, MessageCircle, Heart } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const { data: stats } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [u, v, p, r, m, l] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("videos").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("verifications").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("messages").select("id", { count: "exact", head: true }),
        supabase.from("video_likes").select("video_id", { count: "exact", head: true }),
      ]);
      return {
        users: u.count ?? 0,
        videos: v.count ?? 0,
        pendingVerifications: p.count ?? 0,
        openReports: r.count ?? 0,
        messages: m.count ?? 0,
        likes: l.count ?? 0,
      };
    },
  });

  return (
    <AdminShell title="Overview" subtitle="Real activity from the Javan platform.">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Card icon={Users} label="Registered users" value={stats?.users ?? 0} grad="bg-gradient-primary" />
        <Card icon={Film} label="Active videos" value={stats?.videos ?? 0} grad="bg-gradient-live" />
        <Card icon={Heart} label="Total likes" value={stats?.likes ?? 0} grad="bg-gradient-primary" />
        <Card icon={MessageCircle} label="Messages sent" value={stats?.messages ?? 0} grad="bg-gradient-primary" />
        <Card icon={ShieldCheck} label="Pending verifications" value={stats?.pendingVerifications ?? 0} grad="bg-gradient-gold" highlight={!!stats?.pendingVerifications} />
        <Card icon={Flag} label="Open reports" value={stats?.openReports ?? 0} grad="bg-gradient-live" highlight={!!stats?.openReports} />
      </div>

      <div className="glass mt-6 rounded-3xl p-6 text-sm text-muted-foreground">
        <div className="font-display text-base font-semibold text-foreground">Welcome, admin.</div>
        <p className="mt-2">This platform shows only real activity from registered users. All previous demo accounts and seed content have been cleared. Review pending verifications and open reports from the sidebar to keep the community healthy.</p>
      </div>
    </AdminShell>
  );
}

function Card({ icon: Icon, label, value, grad, highlight }: any) {
  return (
    <div className={`glass rounded-2xl p-4 ${highlight ? "ring-2 ring-gold" : ""}`}>
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${grad}`}>
        <Icon className="h-4 w-4 text-primary-foreground" />
      </div>
      <div className="mt-3 font-display text-2xl font-bold">{value.toLocaleString()}</div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
