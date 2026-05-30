import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";

export const Route = createFileRoute("/admin/revenue")({
  component: AdminRevenue,
});

const PLATFORM_CUT = 0.30; // 30%

function AdminRevenue() {
  const { data } = useQuery({
    queryKey: ["admin-revenue"],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const [{ data: gifts }, { data: tops }, { data: pays }] = await Promise.all([
        supabase.from("gifts_sent").select("coin_value,created_at,recipient_id").gte("created_at", since),
        supabase.from("coin_purchases").select("usd_cents,coins,status,created_at").gte("created_at", since),
        supabase.from("payout_requests").select("usd_cents,status,created_at"),
      ]);
      // Build a per-day rollup for 30 days
      const days: Array<{ d: string; gifts: number; topups: number; cut: number }> = [];
      const dayKey = (iso: string) => iso.slice(5, 10);
      const buckets = new Map<string, { gifts: number; topups: number; cut: number }>();
      for (let i = 29; i >= 0; i--) {
        const t = new Date(Date.now() - i * 86400000).toISOString();
        const k = dayKey(t);
        buckets.set(k, { gifts: 0, topups: 0, cut: 0 });
      }
      for (const g of gifts ?? []) {
        const k = dayKey(g.created_at);
        const b = buckets.get(k);
        if (b) {
          const cut = (g.coin_value as number) * PLATFORM_CUT;
          b.gifts += g.coin_value as number;
          b.cut += cut;
        }
      }
      for (const t of tops ?? []) {
        if (t.status !== "succeeded") continue;
        const k = dayKey(t.created_at);
        const b = buckets.get(k);
        if (b) b.topups += (t.usd_cents as number) / 100;
      }
      for (const [d, v] of buckets) days.push({ d, ...v });

      const totalGiftCoins = (gifts ?? []).reduce((a, g) => a + (g.coin_value as number), 0);
      const totalTopUpUsd = (tops ?? []).filter(t => t.status === "succeeded").reduce((a, t) => a + (t.usd_cents as number) / 100, 0);
      const totalCutCoins = totalGiftCoins * PLATFORM_CUT;
      const platformCutUsd = totalCutCoins / 100; // 100 coins = $1
      const pendingPayoutUsd = (pays ?? []).filter(p => p.status === "pending").reduce((a, p) => a + (p.usd_cents as number) / 100, 0);
      const paidPayoutUsd = (pays ?? []).filter(p => p.status === "paid").reduce((a, p) => a + (p.usd_cents as number) / 100, 0);
      const uniqueGifters = new Set((gifts ?? []).map(g => g.recipient_id)).size;

      const split = [
        { name: "Platform cut (30%)", value: Math.round(totalCutCoins / 100) },
        { name: "Creator share (70%)", value: Math.round((totalGiftCoins - totalCutCoins) / 100) },
      ];

      return { days, totalTopUpUsd, platformCutUsd, pendingPayoutUsd, paidPayoutUsd, uniqueGifters, totalGiftCoins, split };
    },
  });

  return (
    <AdminShell title="Revenue" subtitle="Real coin economics across the platform — past 30 days.">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card label="Top-ups 30d" value={`$${(data?.totalTopUpUsd ?? 0).toFixed(2)}`} sub="Card payments processed" />
        <Card label="Platform cut" value={`$${(data?.platformCutUsd ?? 0).toFixed(2)}`} sub="30% of gift coins" highlight />
        <Card label="Pending payouts" value={`$${(data?.pendingPayoutUsd ?? 0).toFixed(2)}`} sub="Awaiting review" />
        <Card label="Paid out" value={`$${(data?.paidPayoutUsd ?? 0).toFixed(2)}`} sub="Lifetime" />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-3xl p-5 lg:col-span-2">
          <div className="font-display font-semibold">Daily revenue · last 30 days</div>
          <div className="mt-1 text-[11px] text-muted-foreground">Stacked: gift coin volume (USD) + card top-ups</div>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <AreaChart data={data?.days ?? []} margin={{ left: -20, right: 0, top: 5, bottom: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="topups" name="Top-ups USD" stackId="1" stroke="var(--primary)" fill="url(#g1)" />
                <Area type="monotone" dataKey="cut" name="Platform cut coins" stackId="1" stroke="var(--accent)" fill="url(#g2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-3xl p-5">
          <div className="font-display font-semibold">Gift coin split</div>
          <div className="mt-1 text-[11px] text-muted-foreground">{(data?.totalGiftCoins ?? 0).toLocaleString()} coins gifted</div>
          <div className="mt-2 h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data?.split ?? []} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={4}>
                  <Cell fill="var(--primary)" />
                  <Cell fill="var(--accent)" />
                </Pie>
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass mt-4 rounded-3xl p-5">
        <div className="font-display font-semibold">Daily platform cut (USD)</div>
        <div className="mt-4 h-56">
          <ResponsiveContainer>
            <BarChart data={data?.days ?? []} margin={{ left: -20, right: 0, top: 5, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="cut" name="Platform cut (coins)" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AdminShell>
  );
}

function Card({ label, value, sub, highlight }: { label: string; value: string; sub: string; highlight?: boolean }) {
  return (
    <div className={`glass rounded-2xl p-5 ${highlight ? "ring-2 ring-primary/40" : ""}`}>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-3xl font-bold">{value}</div>
      <div className="mt-1 text-xs text-accent">{sub}</div>
    </div>
  );
}
