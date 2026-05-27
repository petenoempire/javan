import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { useWallet } from "@/lib/store";
import { Coins, ArrowDownToLine, Plus, TrendingUp } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";

const data = Array.from({ length: 14 }).map((_, i) => ({
  d: i,
  v: 200 + Math.round(Math.sin(i / 2) * 80 + Math.random() * 120 + i * 20),
}));

export const Route = createFileRoute("/wallet")({
  head: () => ({ meta: [{ title: "Wallet · Admiralty" }] }),
  component: WalletPage,
});

function WalletPage() {
  const { coins, earned, topUp } = useWallet();
  const usd = (earned / 100).toFixed(2);

  return (
    <MobileShell>
      <div className="px-5 pt-20">
        <h1 className="font-display text-3xl font-bold">Wallet</h1>

        <div className="bg-gradient-primary relative mt-5 overflow-hidden rounded-3xl p-6 text-primary-foreground shadow-glow">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="text-xs uppercase tracking-wider opacity-80">Coin balance</div>
          <div className="mt-2 flex items-end gap-2">
            <Coins className="mb-1 h-7 w-7" />
            <span className="font-display text-5xl font-bold">{coins.toLocaleString()}</span>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => topUp(500)} className="glass-strong flex flex-1 items-center justify-center gap-1 rounded-full py-2 text-sm font-semibold">
              <Plus className="h-4 w-4" /> Top up
            </button>
            <Link to="/live/$id" params={{ id: "l1" }} className="glass-strong flex flex-1 items-center justify-center gap-1 rounded-full py-2 text-sm font-semibold">
              Spend live
            </Link>
          </div>
        </div>

        <div className="glass mt-5 rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Creator earnings</div>
              <div className="mt-1 flex items-end gap-2">
                <span className="font-display text-3xl font-bold text-gradient">${usd}</span>
                <span className="mb-1 flex items-center gap-0.5 text-xs text-accent"><TrendingUp className="h-3 w-3" /> +24%</span>
              </div>
              <div className="text-xs text-muted-foreground">{earned.toLocaleString()} coins · last 30d</div>
            </div>
            <button className="bg-gradient-gold flex items-center gap-1 rounded-full px-4 py-2 text-xs font-bold text-background shadow-glow">
              <ArrowDownToLine className="h-4 w-4" /> Payout
            </button>
          </div>
          <div className="mt-4 h-24">
            <ResponsiveContainer>
              <LineChart data={data}>
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                <Line type="monotone" dataKey="v" stroke="var(--primary)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <h2 className="mt-7 font-display text-lg font-semibold">Recent gifts</h2>
        <div className="mt-3 space-y-2">
          {[
            { u: "@nova", g: "💎", n: "Diamond", v: 500 },
            { u: "@kai", g: "👑", n: "Crown", v: 100 },
            { u: "@luna", g: "🌹", n: "Rose ×12", v: 60 },
            { u: "@atlas", g: "🚀", n: "Rocket", v: 250 },
          ].map((r, i) => (
            <div key={i} className="glass flex items-center justify-between rounded-2xl p-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{r.g}</span>
                <div>
                  <div className="text-sm font-semibold">{r.n}</div>
                  <div className="text-xs text-muted-foreground">from {r.u}</div>
                </div>
              </div>
              <div className="font-display text-sm font-bold text-gradient">+{r.v}</div>
            </div>
          ))}
        </div>
      </div>
    </MobileShell>
  );
}
