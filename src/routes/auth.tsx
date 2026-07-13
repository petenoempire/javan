import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Secure Gateway · Javan" }] }),
  component: Auth,
});

interface CountryConfig {
  code: string;
  name: string;
  prefix: string;
  flag: string;
}

const GLOBAL_COUNTRIES: CountryConfig[] = [
  { code: "NG", name: "Nigeria", prefix: "+234", flag: "🇳🇬" },
  { code: "GB", name: "United Kingdom", prefix: "+44", flag: "🇬🇧" },
  { code: "US", name: "United States", prefix: "+1", flag: "🇺🇸" },
  { code: "CA", name: "Canada", prefix: "+1", flag: "🇨🇦" },
  { code: "AU", name: "Australia", prefix: "+61", flag: "🇦🇺" },
  { code: "DE", name: "Germany", prefix: "+49", flag: "🇩🇪" },
  { code: "FR", name: "France", prefix: "+33", flag: "🇫🇷" },
  { code: "ZA", name: "South Africa", prefix: "+27", flag: "🇿🇦" },
  { code: "GH", name: "Ghana", prefix: "+233", flag: "🇬🇭" },
  { code: "KE", name: "Kenya", prefix: "+254", flag: "🇰🇪" },
  { code: "IN", name: "India", prefix: "+91", flag: "🇮🇳" },
  { code: "AE", name: "United Arab Emirates", prefix: "+971", flag: "🇦🇪" },
];

function Auth() {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [stage, setStage] = useState<"credentials" | "verify_signup" | "verify_signin">("credentials");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [handle, setHandle] = useState("");
  const [name, setName] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<CountryConfig>(GLOBAL_COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState("");
  
  const [smsOtpInput, setSmsOtpInput] = useState("");
  const [emailOtpInput, setEmailOtpInput] = useState("");
  const [loginOtpInput, setLoginOtpInput] = useState("");
  
  const [loading, setLoading] = useState(false);
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) navigate({ to: "/profile" });
  }, [session, navigate]);

  const handleCountryChange = (countryCode: string) => {
    const target = GLOBAL_COUNTRIES.find(c => c.code === countryCode);
    if (target) setSelectedCountry(target);
  };

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (mode === "signup") {
        if (!phoneNumber) throw new Error("A valid telephone string is required for dual-channel validation verification.");
        
        const fullPhone = `${selectedCountry.prefix}${phoneNumber.replace(/\D/g, "")}`;
        
        const response = await fetch("/api/v1/auth/dispatch-dual-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, phone: fullPhone, handle: handle.toLowerCase(), name, country: selectedCountry.code }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to trigger registration safety challenges.");
        
        toast.success("Security challenges triggered. Verify SMS and Email codes.");
        setStage("verify_signup");
      } else {
        const response = await fetch("/api/v1/auth/challenge-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Invalid authentication credentials.");
        
        toast.success("Identity matching validated. 5-Digit 2FA Challenge issued.");
        setStage("verify_signin");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong during authorization.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySignupChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (smsOtpInput.length !== 6 || emailOtpInput.length !== 6) {
      toast.error("Both validation verification fields require complete 6-digit structures.");
      return;
    }
    setLoading(true);

    try {
      const fullPhone = `${selectedCountry.prefix}${phoneNumber.replace(/\D/g, "")}`;
      const response = await fetch("/api/v1/auth/confirm-dual-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone: fullPhone, handle: handle.toLowerCase(), display_name: name || handle, password, country: selectedCountry.code, sms_code: smsOtpInput, email_code: emailOtpInput })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Verification failed. Tokens could be expired.");

      const { error: sessionError } = await supabase.auth.signInWithPassword({ email, password });
      if (sessionError) throw sessionError;

      toast.success("Dual verification clean! Profile locked and verified.");
      navigate({ to: "/profile" });
    } catch (err: any) {
      toast.error(err.message ?? "Verification exception.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySigninChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginOtpInput.length !== 5) {
      toast.error("Security authorization requires an exact 5-digit security code match.");
      return;
    }
    setLoading(true);

    try {
      const response = await fetch("/api/v1/auth/verify-login-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, "2fa_code": loginOtpInput })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Invalid or expired 5-digit 2FA factor token.");

      const { error: sessionError } = await supabase.auth.signInWithPassword({ email, password });
      if (sessionError) throw sessionError;

      toast.success("Security clearance verified. Welcome back.");
      navigate({ to: "/profile" });
    } catch (err: any) {
      toast.error(err.message ?? "2FA Exception occurred.");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) toast.error("Google sign-in failed");
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-[480px] flex-col justify-center bg-background px-6">
      <Link to="/" className="mb-6 text-center font-display text-4xl font-bold text-gradient">Javan</Link>
      <div className="glass rounded-3xl p-6 shadow-elegant border border-white/5 bg-black/40 backdrop-blur-md">
        {stage === "credentials" && (
          <>
            <div className="mb-5 flex rounded-full bg-muted p-1">
              {(["signup", "signin"] as const).map((m) => (
                <button key={m} type="button" onClick={() => setMode(m)}
                  className={`flex-1 rounded-full py-2 text-sm font-bold transition duration-200 transform active:scale-95 ${mode === m ? "bg-background text-foreground shadow-elegant scale-105" : "text-muted-foreground"}`}>
                  {m === "signup" ? "Create Account" : "Sign In"}
                </button>
              ))}
            </div>
            <button onClick={google}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card/60 py-3 text-sm font-semibold transition active:scale-[0.97]">
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.3-7.2 2.3-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2c-.4.4 6.6-4.8 6.6-14.9 0-1.3-.1-2.3-.4-3.5z"/>
              </svg>
              Continue with Google
            </button>
            <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border/50" /> or secure keys <div className="h-px flex-1 bg-border/50" />
            </div>
            <form onSubmit={handleInitialSubmit} className="space-y-3">
              {mode === "signup" && (
                <>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Display Name" required
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary transition-all duration-200" />
                  <input value={handle} onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    placeholder="Unique Handle (@username)" required
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary transition-all duration-200" />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Country Registry Selection</label>
                    <select value={selectedCountry.code} onChange={(e) => handleCountryChange(e.target.value)}
                      className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary text-foreground font-semibold">
                      {GLOBAL_COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code} className="bg-neutral-900 text-white">{country.flag} {country.name} ({country.prefix})</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Phone Number Token Endpoint</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-4 text-sm font-mono font-bold text-muted-foreground select-none">{selectedCountry.flag} {selectedCountry.prefix}</span>
                      <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))} placeholder="Mobile Number" required 
                        className="w-full rounded-2xl border border-border bg-background py-3 pl-20 pr-4 text-sm font-mono outline-none focus:ring-2 focus:ring-primary transition-all duration-200" />
                    </div>
                  </div>
                </>
              )}
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Registry Address" required
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary transition-all duration-200" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Account Password" required minLength={8}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary transition-all duration-200" />
              <button type="submit" disabled={loading}
                className="bg-gradient-primary w-full rounded-full py-3 text-sm font-bold text-primary-foreground shadow-glow active:scale-[0.96] disabled:opacity-60 uppercase tracking-widest mt-2 transition-transform">
                {loading ? "Processing..." : mode === "signup" ? "Trigger Dual Verification" : "Verify Credentials"}
              </button>
            </form>
          </>
        )}
        {stage === "verify_signup" && (
          <form onSubmit={handleVerifySignupChallenge} className="space-y-4">
            <div className="text-center pb-2">
              <h3 className="text-white text-lg font-black uppercase tracking-tight">Dual-Channel Verification</h3>
              <p className="text-xs text-muted-foreground mt-1">Codes have been transmitted across both system protocols to lock identity validation.</p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-amber-400 uppercase tracking-widest pl-1">6-Digit Mobile SMS Code</label>
              <input type="text" maxLength={6} value={smsOtpInput} onChange={(e) => setSmsOtpInput(e.target.value.replace(/\D/g, ""))} placeholder="000000" required 
                className="w-full rounded-2xl border border-amber-500/30 bg-background text-center py-3 text-lg font-mono tracking-[0.5em] font-black outline-none focus:ring-2 focus:ring-amber-500 text-amber-300" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest pl-1">6-Digit Email SMTP Code</label>
              <input type="text" maxLength={6} value={emailOtpInput} onChange={(e) => setEmailOtpInput(e.target.value.replace(/\D/g, ""))} placeholder="000000" required 
                className="w-full rounded-2xl border border-cyan-500/30 bg-background text-center py-3 text-lg font-mono tracking-[0.5em] font-black outline-none focus:ring-2 focus:ring-cyan-500 text-cyan-300" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-cyan-500 hover:from-amber-400 hover:to-cyan-400 text-black rounded-full py-3 text-sm font-black uppercase tracking-widest transition transform active:scale-95 disabled:opacity-50">
              {loading ? "Validating Ledger..." : "Authorize Creation"}
            </button>
            <button type="button" onClick={() => setStage("credentials")} className="w-full text-center text-xs text-neutral-500 hover:text-neutral-300 transition underline pt-2 block">
              Change Credentials Configuration
            </button>
          </form>
        )}
        {stage === "verify_signin" && (
          <form onSubmit={handleVerifySigninChallenge} className="space-y-4">
            <div className="text-center pb-2">
              <h3 className="text-white text-lg font-black uppercase tracking-tight">2FA Security Lock</h3>
              <p className="text-xs text-muted-foreground mt-1">Every active authentication route session requires validation matching of the 5-digit factor key.</p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest pl-1">5-Digit Authentication Identity Token</label>
              <input type="text" maxLength={5} value={loginOtpInput} onChange={(e) => setLoginOtpInput(e.target.value.replace(/\D/g, ""))} placeholder="00000" required 
                className="w-full rounded-2xl border border-emerald-500/40 bg-background text-center py-3 text-xl font-mono tracking-[0.6em] font-black outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black rounded-full py-3 text-sm font-black uppercase tracking-widest transition transform active:scale-95 disabled:opacity-50">
              {loading ? "Releasing Locks..." : "Verify & Unlock Session"}
            </button>
            <button type="button" onClick={() => setStage("credentials")} className="w-full text-center text-xs text-neutral-500 hover:text-neutral-300 transition underline pt-2 block">
              Abort Session Access
            </button>
          </form>
        )}
        <Link to="/" className="mt-5 block text-center text-xs text-muted-foreground hover:text-foreground transition">← back to feed</Link>
      </div>
    </div>
  );
}
