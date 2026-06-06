import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/lib/useRole";
import { Shield, Lock, Crown } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Console · Javan" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminGate,
});

function AdminGate() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading } = useIsAdmin();
  const qc = useQueryClient();

  const { data: adminCount, isLoading: countLoading } = useQuery({
    queryKey: ["admin-count"],
    enabled: !!user && !isAdmin && !loading,
    queryFn: async () => {
      const { data } = await supabase.rpc("admin_count");
      return (data as number) ?? 0;
    },
  });

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <div className="bg-gradient-primary h-10 w-10 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
        <div className="glass max-w-sm rounded-3xl p-8 text-center">
          <div className="bg-gradient-primary mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="mt-4 font-display text-xl font-bold">Admin sign-in required</h1>
          <p className="mt-2 text-sm text-muted-foreground">The Javan admin console is restricted to staff accounts.</p>
          <Link to="/auth" className="bg-gradient-primary mt-6 inline-block rounded-full px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    const canClaim = !countLoading && adminCount === 0;
    const claim = async () => {
      const { data, error } = await supabase.rpc("claim_first_admin");
      if (error) { toast.error(error.message); return; }
      if (data) {
        toast.success("You are now the platform owner.");
        qc.invalidateQueries({ queryKey: ["is-admin"] });
        qc.invalidateQueries({ queryKey: ["admin-count"] });
      } else {
        toast.error("Admin already claimed.");
      }
    };

    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
        <div className="glass max-w-sm rounded-3xl p-8 text-center">
          {canClaim ? (
            <>
              <div className="bg-gradient-gold mx-auto flex h-14 w-14 items-center justify-center rounded-2xl shadow-glow">
                <Crown className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="mt-4 font-display text-xl font-bold">Claim platform ownership</h1>
              <p className="mt-2 text-sm text-muted-foreground">No admin has been assigned yet. As the first claimant, you'll become the Javan owner with full admin access.</p>
              <button onClick={claim} className="bg-gradient-primary mt-6 rounded-full px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow">
                Claim ownership
              </button>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/20">
                <Lock className="h-6 w-6 text-destructive" />
              </div>
              <h1 className="mt-4 font-display text-xl font-bold">Access denied</h1>
              <p className="mt-2 text-sm text-muted-foreground">Your account doesn't have admin privileges.</p>
              <Link to="/" className="glass mt-6 inline-block rounded-full px-6 py-2.5 text-sm font-semibold">
                Back to Javan
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  return <Outlet />;
}
