import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { ArrowLeft, Users, Eye, DollarSign, Percent, TrendingUp } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Owner panel · Admiralty" }] }),
  component: Admin,
});

const usersData = Array.from({ length: 12 }).map((_, i) => ({
  m: ["J","F","M","A","M","J","J","A","S","O","N","D"][i],
  users: 40 + i * 14 + Math.round(Math.random() * 20),
  revenue: 20 + i * 9 + Math.round(Math.random() * 15),
}));

const engagementData = Array.from({ length: 7 }).map((_, i) => ({
  d: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i],
  watch: 220 + Math.round(Math.random() * 180),
}));

const revenueSplit = [
  { name: "Live gifts", value: 48, color: "var(--primary)" },
  { name: "Ads", value: 27, color: "var(--accent)" },
  { name: "Data value", value: 18, color: "var(--gold)" },
  { name: "Subscriptions", value: 7, color: "var(--rose)" },
];

function Stat({ icon: Icon, label, value, delta, grad }: any) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${grad}`}>
          <Icon className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="flex items-center gap-0.5 text-[11px] font-semibold text-accent">
          <TrendingUp className="h-3 w-3" /> {delta}
        </span>
      </div>
      <div className="mt-3 font-display text-2xl font-bold">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function Admin() {
  return (
    <MobileShell>
      <div className="px-5 pt-20">
        <div className="flex items-center gap-3">
          <Link to="/profile" className="glass rounded-full p-2"><ArrowLeft className="h-4 w-4" /></Link>
          <div>
            <h1 className="font-display text-2xl font-bold">Owner panel</h1>
            <p className="text-xs text-muted-foreground">Admiralty growth & monetization</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Stat icon={Users} label="Active users" value="1.42M" delta="+12.4%" grad="bg-gradient-primary" />
          <Stat icon={Eye} label="Watch time (hrs)" value="4.8M" delta="+18.7%" grad="bg-gradient-live" />
          <Stat icon={DollarSign} label="Data value gen." value="$184K" delta="+9.1%" grad="bg-gradient-gold" />
          <Stat icon={Percent} label="Platform cut" value="32%" delta="+1.2pp" grad="bg-gradient-primary" />
        </div>

        <div className="glass mt-5 rounded-3xl p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="font-display font-semibold">Users & revenue</div>
              <div className="text-xs text-muted-foreground">trailing 12 months</div>
            </div>
            <div className="flex gap-2 text-[10px]">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> Users (k)</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accent" /> Rev ($k)</span>
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer>
              <AreaChart data={usersData} margin={{ left: -20, right: 0, top: 5, bottom: 0 }}>
                <defs>
                  <linearGradient id="gu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="users" stroke="var(--primary)" strokeWidth={2} fill="url(#gu)" />
                <Area type="monotone" dataKey="revenue" stroke="var(--accent)" strokeWidth={2} fill="url(#gr)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4">
          <div className="glass rounded-3xl p-5">
            <div className="font-display font-semibold">Watch time / day</div>
            <div className="text-xs text-muted-foreground">hours (thousands)</div>
            <div className="mt-2 h-36">
              <ResponsiveContainer>
                <BarChart data={engagementData} margin={{ left: -25, right: 0, top: 5, bottom: 0 }}>
                  <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="watch" fill="var(--primary)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass rounded-3xl p-5">
            <div className="font-display font-semibold">Revenue mix</div>
            <div className="text-xs text-muted-foreground">data monetization & engagement</div>
            <div className="mt-2 flex items-center gap-4">
              <div className="h-32 w-32">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={revenueSplit} dataKey="value" innerRadius={36} outerRadius={56} paddingAngle={3} stroke="none">
                      {revenueSplit.map((e) => <Cell key={e.name} fill={e.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {revenueSplit.map((r) => (
                  <div key={r.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
                      {r.name}
                    </span>
                    <span className="font-semibold">{r.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
