import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Once session is established, or if loading finished and no session
    if (!loading) {
      if (session) {
        navigate({ to: "/" });
      } else {
        // If no session found after loading, go back to auth
        navigate({ to: "/auth" });
      }
    }
  }, [session, loading, navigate]);

  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center bg-[#020210] text-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-500" />
        <h2 className="text-xl font-black uppercase tracking-widest">Finalizing Session...</h2>
        <p className="text-sm text-white/40">You will be redirected in a moment.</p>
      </div>
    </div>
  );
}
