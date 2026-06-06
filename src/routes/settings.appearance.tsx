import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/settings/appearance")({
  head: () => ({ meta: [{ title: "Appearance · Javan" }] }),
  component: AppearancePage,
});

function AppearancePage() {
  const { theme, toggle } = useTheme();
  const options = [
    { v: "light", label: "Light", desc: "Crisp, daytime friendly", Icon: Sun },
    { v: "dark", label: "Dark", desc: "Easy on the eyes at night", Icon: Moon },
    { v: "system", label: "System", desc: "Match your device theme", Icon: Monitor },
  ] as const;

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-background pb-20">
      <header className="glass-strong sticky top-0 z-10 flex items-center gap-3 border-b border-border px-4 py-3">
        <Link to="/settings" className="p-1"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="font-display text-lg font-bold">Appearance</h1>
      </header>

      <div className="space-y-3 px-4 pt-5">
        {options.map((o) => {
          const active = o.v === theme || (o.v === "system" && false);
          return (
            <button key={o.v}
              onClick={() => { if (o.v !== theme && o.v !== "system") toggle(); }}
              className={`glass flex w-full items-center gap-3 rounded-2xl p-4 text-left transition ${
                active ? "ring-2 ring-primary" : ""
              }`}>
              <div className="bg-gradient-primary flex h-12 w-12 items-center justify-center rounded-xl shadow-glow">
                <o.Icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{o.label}</div>
                <div className="text-[11px] text-muted-foreground">{o.desc}</div>
              </div>
              <span className={`h-4 w-4 rounded-full border-2 ${active ? "bg-primary border-primary" : "border-border"}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
