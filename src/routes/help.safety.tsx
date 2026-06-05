import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Flag, HeartHandshake, Lock, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/help/safety")({
  head: () => ({ meta: [{ title: "Safety Center · Boogle" }] }),
  component: SafetyCenter,
});

function SafetyCenter() {
  const policies = [
    { icon: ShieldCheck, title: "Community protection", body: "Clear rules for harassment, impersonation, spam, and harmful behavior." },
    { icon: Lock, title: "Account safety", body: "Password, recovery, login alerts, and device protection guidance." },
    { icon: Flag, title: "Report a concern", body: "Route urgent platform issues to review queues with the right context." },
    { icon: HeartHandshake, title: "Creator wellbeing", body: "Resources for healthy audience growth, moderation, and LIVE boundaries." },
  ];

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-background pb-24">
      <header className="glass-strong sticky top-0 z-20 flex items-center gap-3 border-b border-border px-4 py-3">
        <Link to="/help" className="p-1" aria-label="Back to help"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="font-display text-lg font-bold">Safety Center</h1>
      </header>

      <div className="px-4 pt-5">
        <section className="bg-gradient-gold rounded-3xl p-5 text-black shadow-elegant">
          <ShieldCheck className="h-8 w-8" />
          <h2 className="mt-10 font-display text-3xl font-bold">Stay safe on Boogle</h2>
          <p className="mt-2 text-sm opacity-75">Policy overview, account protection, and reporting resources in one place.</p>
        </section>

        <div className="mt-5 space-y-3">
          {policies.map(({ icon: Icon, title, body }) => (
            <article key={title} className="glass rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold">{title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}