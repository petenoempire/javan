import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_admin/revenue")({
  component: AdminRevenue,
});

const data = Array.from({ length: 30 }).map((_, i) => ({
  d: `${i + 1}`,
  gifts: 200 + Math.round(Math.random() * 800),
  ads: 100 + Math.round(Math.random() * 500),
  subs: 50 + Math.round(Math.random() * 250),
}));

function Card({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-3xl font-bold">{value}</div>
      <div className="mt-1 text-xs text-accent">{sub}</div>
    </div>
  );
}

function AdminRevenue() {
  return (
    <AdminShell title="Revenue" subtitle="Coins, payouts, and monetization streams across the platform.">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card label="Gross 30d" value="$842K" sub="+18.2% vs prev" />
        <Card label="Net (platform)" value="$269K" sub="32% rev share" />
        <Card label="Payouts pending" value="$48K" sub="412 creators" />
        <Card label="ARPDAU" value="$0.42" sub="+6.1%" />
      </div>

      <div className="glass mt-5 rounded-3xl p-5">
        <div className="font-display font-semibold">Daily revenue mix · last 30 days</div>
        <div className="mt-4 h-72">
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ left: -20, right: 0, top: 5, bottom: 0 }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="gifts" stackId="1" stroke="var(--primary)" fill="url(#g1)" />
              <Area type="monotone" dataKey="ads" stackId="1" stroke="var(--accent)" fill="url(#g2)" />
              <Area type="monotone" dataKey="subs" stackId="1" stroke="var(--gold)" fill="url(#g3)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AdminShell>
  );
}
