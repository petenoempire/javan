import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const started = useRef(false);
  const [status, setStatus] = useState("Finalizing Session...");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    let cancelled = false;
    const finish = (message?: string) => {
      if (cancelled) return;
      if (message) {
        setStatus(message);
        toast.error(message);
      }
      window.setTimeout(() => {
        if (!cancelled) navigate({ to: "/auth", replace: true });
      }, message ? 1200 : 0);
    };

    const completeCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const providerError = params.get("error_description") || hash.get("error_description") || params.get("error") || hash.get("error");
        if (providerError) {
          finish(decodeURIComponent(providerError.replace(/\+/g, " ")));
          return;
        }

        const code = params.get("code");
        if (code) {
          setStatus("Exchanging Google session...");
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          window.history.replaceState({}, document.title, "/auth/callback");
        } else {
          const accessToken = hash.get("access_token");
          const refreshToken = hash.get("refresh_token");
          if (accessToken && refreshToken) {
            setStatus("Restoring Google session...");
            const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
            if (error) throw error;
            window.history.replaceState({}, document.title, "/auth/callback");
          }
        }
      } catch (error) {
        console.error("Google OAuth callback error:", error);
        finish(error instanceof Error ? error.message : "Authentication failed. Please try again.");
      }
    };

    void completeCallback();
    const timeout = window.setTimeout(() => {
      if (!cancelled && !session) finish("Google sign-in timed out. Please try again.");
    }, 12000);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [navigate, session]);

  useEffect(() => {
    if (session) navigate({ to: "/discover", replace: true });
  }, [navigate, session]);

  useEffect(() => {
    if (!authLoading && !session && !window.location.search.includes("code=") && !window.location.hash.includes("access_token")) {
      const timer = window.setTimeout(() => navigate({ to: "/auth", replace: true }), 3000);
      return () => window.clearTimeout(timer);
    }
  }, [authLoading, navigate, session]);

  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center bg-[#020210] text-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-500" />
        <h2 className="text-xl font-black uppercase tracking-widest">{status}</h2>
        <p className="text-sm text-white/40">You will be redirected in a moment.</p>
      </div>
    </div>
  );
}
