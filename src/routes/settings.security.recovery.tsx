import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, KeyRound, Loader2, Mail, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/settings/security/recovery")({
  head: () => ({ meta: [{ title: "Account Recovery · Javan" }] }),
  component: AccountRecovery,
});

function AccountRecovery() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const sendRecovery = async () => {
    if (!email) return toast.error("Enter your recovery email.");
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Recovery email sent");
  };

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-background pb-24">
      <header className="glass-strong sticky top-0 z-20 flex items-center gap-3 border-b border-border px-4 py-3">
        <Link to="/settings/security" className="p-1" aria-label="Back to security"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="font-display text-lg font-bold">Account Recovery</h1>
      </header>

      <div className="space-y-5 px-4 pt-5">
        <section className="glass rounded-3xl p-5">
          <div className="bg-gradient-primary flex h-12 w-12 items-center justify-center rounded-2xl shadow-glow">
            <KeyRound className="h-6 w-6 text-primary-foreground" />
          </div>
          <h2 className="mt-5 font-display text-2xl font-bold">Recover access securely</h2>
          <p className="mt-2 text-sm text-muted-foreground">Send a protected reset link to the email attached to your Javan account.</p>
        </section>

        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Recovery email</span>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" placeholder="you@example.com" />
          </div>
        </label>

        <button onClick={sendRecovery} disabled={busy} className="bg-gradient-primary flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          Send recovery link
        </button>
      </div>
    </div>
  );
}