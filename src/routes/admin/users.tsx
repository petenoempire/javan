import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Search, BadgeCheck, Coins } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", q],
    queryFn: async () => {
      let query = supabase.from("profiles").select("id,handle,display_name,avatar_url,is_verified,coins,earned_coins,created_at").order("created_at", { ascending: false }).limit(100);
      if (q.trim()) query = query.or(`handle.ilike.%${q}%,display_name.ilike.%${q}%`);
      const { data } = await query;
      return data ?? [];
    },
  });

  return (
    <AdminShell title="Users" subtitle="Search, audit and manage every Admiralty account.">
      <div className="glass mb-4 flex items-center gap-2 rounded-2xl px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by handle or name…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="glass overflow-hidden rounded-3xl">
        <div className="hidden grid-cols-12 gap-3 border-b border-border/60 px-4 py-3 text-[11px] uppercase tracking-wider text-muted-foreground md:grid">
          <div className="col-span-5">User</div>
          <div className="col-span-2">Coins</div>
          <div className="col-span-2">Earned</div>
          <div className="col-span-3 text-right">Joined</div>
        </div>
        {isLoading && <div className="p-6 text-sm text-muted-foreground">Loading…</div>}
        {data?.length === 0 && <div className="p-6 text-sm text-muted-foreground">No users found.</div>}
        {data?.map((u: any) => (
          <div key={u.id} className="grid grid-cols-1 gap-3 border-b border-border/40 px-4 py-3 last:border-0 md:grid-cols-12 md:items-center">
            <div className="col-span-5 flex items-center gap-3">
              <div className="bg-gradient-primary h-10 w-10 overflow-hidden rounded-full">
                {u.avatar_url && <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1 truncate text-sm font-semibold">
                  {u.display_name}
                  {u.is_verified && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}
                </div>
                <div className="truncate text-xs text-muted-foreground">@{u.handle}</div>
              </div>
            </div>
            <div className="col-span-2 flex items-center gap-1 text-sm"><Coins className="h-3.5 w-3.5 text-gold" />{u.coins?.toLocaleString() ?? 0}</div>
            <div className="col-span-2 text-sm">{u.earned_coins?.toLocaleString() ?? 0}</div>
            <div className="col-span-3 text-right text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
