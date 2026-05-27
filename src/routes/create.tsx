import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Camera, Radio, Music2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/create")({
  head: () => ({ meta: [{ title: "Create · Admiralty" }] }),
  component: Create,
});

const actions = [
  { icon: Camera, label: "Record video", desc: "Up to 3 minutes, full creative suite", to: "/", grad: "bg-gradient-primary" },
  { icon: Radio, label: "Go live", desc: "Stream now, earn gifts in real time", to: "/live/new", grad: "bg-gradient-live" },
  { icon: Music2, label: "Use a sound", desc: "Browse trending audio & remixes", to: "/discover", grad: "bg-gradient-gold" },
  { icon: Sparkles, label: "AI remix", desc: "Auto-edit, captions, effects", to: "/", grad: "bg-gradient-primary" },
];

function Create() {
  return (
    <MobileShell>
      <div className="px-5 pt-20">
        <h1 className="font-display text-3xl font-bold">Create</h1>
        <p className="mt-1 text-sm text-muted-foreground">What are we making today?</p>
        <div className="mt-6 space-y-3">
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <Link key={a.label} to={a.to} className="glass flex items-center gap-4 rounded-3xl p-4 shadow-elegant active:scale-[0.98]">
                <div className={`${a.grad} flex h-14 w-14 items-center justify-center rounded-2xl shadow-glow`}>
                  <Icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <div className="font-display font-semibold">{a.label}</div>
                  <div className="text-xs text-muted-foreground">{a.desc}</div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="glass mt-8 rounded-3xl p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Creator earnings</div>
          <div className="mt-2 flex items-end justify-between">
            <div>
              <div className="font-display text-3xl font-bold text-gradient">$1,284</div>
              <div className="text-xs text-muted-foreground">last 30 days · +18%</div>
            </div>
            <Link to="/wallet" className="bg-gradient-primary rounded-full px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow">
              Wallet →
            </Link>
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
