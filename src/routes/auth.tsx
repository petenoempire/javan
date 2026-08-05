import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In or Create Account · Javan" },
      { name: "description", content: "Sign in or create your Javan account to start posting, streaming live, and connecting with creators." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Sign In or Create Account · Javan" },
      { property: "og:description", content: "Sign in or create your Javan account to start posting, streaming live, and connecting with creators." },
      { property: "og:url", content: "https://javan.lovable.app/auth" },
      { name: "twitter:title", content: "Sign In or Create Account · Javan" },
      { name: "twitter:description", content: "Sign in or create your Javan account to start posting, streaming live, and connecting with creators." },
    ],
    links: [{ rel: "canonical", href: "https://javan.lovable.app/auth" }],
  }),
  component: Auth,
});

interface CountryConfig {
  code: string;
  name: string;
  prefix: string;
  flag: string;
  region: "NG" | "GB" | "US" | "GLOBAL";
}

const GLOBAL_COUNTRIES: CountryConfig[] = [
  { code: "NG", name: "Nigeria", prefix: "+234", flag: "🇳🇬", region: "NG" },
  { code: "GB", name: "United Kingdom", prefix: "+44", flag: "🇬🇧", region: "GB" },
  { code: "US", name: "United States", prefix: "+1", flag: "🇺🇸", region: "US" },
  { code: "CA", name: "Canada", prefix: "+1", flag: "🇨🇦", region: "GLOBAL" },
  { code: "AU", name: "Australia", prefix: "+61", flag: "🇦🇺", region: "GLOBAL" },
  { code: "DE", name: "Germany", prefix: "+49", flag: "🇩🇪", region: "GLOBAL" },
  { code: "FR", name: "France", prefix: "+33", flag: "🇫🇷", region: "GLOBAL" },
  { code: "ZA", name: "South Africa", prefix: "+27", flag: "🇿🇦", region: "GLOBAL" },
  { code: "GH", name: "Ghana", prefix: "+233", flag: "🇬🇭", region: "GLOBAL" },
  { code: "KE", name: "Kenya", prefix: "+254", flag: "🇰🇪", region: "GLOBAL" },
  { code: "IN", name: "India", prefix: "+91", flag: "🇮🇳", region: "GLOBAL" },
  { code: "AE", name: "United Arab Emirates", prefix: "+971", flag: "🇦🇪", region: "GLOBAL" },
  { code: "IE", name: "Ireland", prefix: "+353", flag: "🇮", region: "GLOBAL" },
  { code: "IT", name: "Italy", prefix: "+39", flag: "🇮🇹", region: "GLOBAL" },
  { code: "ES", name: "Spain", prefix: "+34", flag: "🇪🇸", region: "GLOBAL" },
  { code: "PT", name: "Portugal", prefix: "+351", flag: "🇵🇹", region: "GLOBAL" },
  { code: "NL", name: "Netherlands", prefix: "+31", flag: "🇳🇱", region: "GLOBAL" },
  { code: "BE", name: "Belgium", prefix: "+32", flag: "🇧🇪", region: "GLOBAL" },
  { code: "CH", name: "Switzerland", prefix: "+41", flag: "🇨🇭", region: "GLOBAL" },
  { code: "SE", name: "Sweden", prefix: "+46", flag: "🇸🇪", region: "GLOBAL" },
  { code: "NO", name: "Norway", prefix: "+47", flag: "🇳🇴", region: "GLOBAL" },
  { code: "DK", name: "Denmark", prefix: "+45", flag: "🇩🇰", region: "GLOBAL" },
  { code: "FI", name: "Finland", prefix: "+358", flag: "🇫🇮", region: "GLOBAL" },
  { code: "PL", name: "Poland", prefix: "+48", flag: "🇵🇱", region: "GLOBAL" },
  { code: "AT", name: "Austria", prefix: "+43", flag: "🇦🇹", region: "GLOBAL" },
  { code: "GR", name: "Greece", prefix: "+30", flag: "🇬🇷", region: "GLOBAL" },
  { code: "TR", name: "Turkey", prefix: "+90", flag: "🇹🇷", region: "GLOBAL" },
  { code: "UA", name: "Ukraine", prefix: "+380", flag: "🇺🇦", region: "GLOBAL" },
  { code: "CZ", name: "Czech Republic", prefix: "+420", flag: "🇨🇿", region: "GLOBAL" },
  { code: "RO", name: "Romania", prefix: "+40", flag: "🇷🇴", region: "GLOBAL" },
  { code: "HU", name: "Hungary", prefix: "+36", flag: "🇭🇺", region: "GLOBAL" },
  { code: "BR", name: "Brazil", prefix: "+55", flag: "🇧", region: "GLOBAL" },
  { code: "MX", name: "Mexico", prefix: "+52", flag: "🇲🇽", region: "GLOBAL" },
  { code: "AR", name: "Argentina", prefix: "+54", flag: "🇦🇷", region: "GLOBAL" },
  { code: "CO", name: "Colombia", prefix: "+57", flag: "🇨🇴", region: "GLOBAL" },
  { code: "CL", name: "Chile", prefix: "+56", flag: "🇨🇱", region: "GLOBAL" },
  { code: "PE", name: "Peru", prefix: "+51", flag: "🇵🇪", region: "GLOBAL" },
  { code: "CN", name: "China", prefix: "+86", flag: "🇨🇳", region: "GLOBAL" },
  { code: "JP", name: "Japan", prefix: "+81", flag: "🇯🇵", region: "GLOBAL" },
  { code: "KR", name: "South Korea", prefix: "+82", flag: "🇰🇷", region: "GLOBAL" },
  { code: "SG", name: "Singapore", prefix: "+65", flag: "🇸🇬", region: "GLOBAL" },
  { code: "MY", name: "Malaysia", prefix: "+60", flag: "🇲🇾", region: "GLOBAL" },
  { code: "TH", name: "Thailand", prefix: "+66", flag: "🇹", region: "GLOBAL" },
  { code: "PH", name: "Philippines", prefix: "+63", flag: "🇵🇭", region: "GLOBAL" },
  { code: "ID", name: "Indonesia", prefix: "+62", flag: "🇮🇩", region: "GLOBAL" },
  { code: "VN", name: "Vietnam", prefix: "+84", flag: "🇻🇳", region: "GLOBAL" },
  { code: "PK", name: "Pakistan", prefix: "+92", flag: "🇵", region: "GLOBAL" },
  { code: "BD", name: "Bangladesh", prefix: "+880", flag: "🇧🇩", region: "GLOBAL" },
  { code: "SA", name: "Saudi Arabia", prefix: "+966", flag: "🇸🇦", region: "GLOBAL" },
  { code: "QA", name: "Qatar", prefix: "+974", flag: "🇶🇦", region: "GLOBAL" },
  { code: "KW", name: "Kuwait", prefix: "+965", flag: "🇰🇼", region: "GLOBAL" },
  { code: "EG", name: "Egypt", prefix: "+20", flag: "🇪🇬", region: "GLOBAL" },
  { code: "MA", name: "Morocco", prefix: "+212", flag: "🇲🇦", region: "GLOBAL" },
  { code: "DZ", name: "Algeria", prefix: "+213", flag: "🇩🇿", region: "GLOBAL" },
  { code: "TN", name: "Tunisia", prefix: "+216", flag: "🇹🇳", region: "GLOBAL" },
  { code: "ET", name: "Ethiopia", prefix: "+251", flag: "🇪🇹", region: "GLOBAL" },
  { code: "TZ", name: "Tanzania", prefix: "+255", flag: "🇹🇿", region: "GLOBAL" },
  { code: "UG", name: "Uganda", prefix: "+256", flag: "🇺🇬", region: "GLOBAL" },
  { code: "RW", name: "Rwanda", prefix: "+250", flag: "🇷🇼", region: "GLOBAL" },
  { code: "CM", name: "Cameroon", prefix: "+237", flag: "🇨", region: "GLOBAL" },
  { code: "CI", name: "Ivory Coast", prefix: "+225", flag: "🇨🇮", region: "GLOBAL" },
  { code: "SN", name: "Senegal", prefix: "+221", flag: "🇸🇳", region: "GLOBAL" },
  { code: "ZM", name: "Zambia", prefix: "+260", flag: "🇿🇲", region: "GLOBAL" },
  { code: "ZW", name: "Zimbabwe", prefix: "+263", flag: "🇿🇼", region: "GLOBAL" },
  { code: "NZ", name: "New Zealand", prefix: "+64", flag: "🇳🇿", region: "GLOBAL" },
  { code: "IL", name: "Israel", prefix: "+972", flag: "🇮🇱", region: "GLOBAL" },
  { code: "JO", name: "Jordan", prefix: "+962", flag: "🇯🇴", region: "GLOBAL" },
  { code: "LB", name: "Lebanon", prefix: "+961", flag: "🇱🇧", region: "GLOBAL" },
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
    if (session) navigate({ to: "/" });
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
        if (!phoneNumber) throw new Error("Phone number is required for secure verification.");
        if (handle.length < 3) throw new Error("Handle must be at least 3 characters.");
        
        const fullPhone = `${selectedCountry.prefix}${phoneNumber.replace(/\D/g, "")}`;
        
        const { error } = await supabase.functions.invoke("dispatch-dual-verification", {
          body: {
            email,
            phone: fullPhone,
            handle: handle.toLowerCase(),
            name,
            country: selectedCountry.code,
            region: selectedCountry.region,
          },
        });

        if (error) throw new Error(error.message || "Failed to dispatch verification codes.");
        
        toast.success("Verification codes sent to SMS and email.");
        setStage("verify_signup");
      } else {
        const { error } = await supabase.functions.invoke("challenge-login", {
          body: { email, password },
        });

        if (error) throw new Error(error.message || "Invalid credentials.");
        
        toast.success("Login code sent to your email.");
        setStage("verify_signin");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Authentication error.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySignupChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (smsOtpInput.length !== 6 || emailOtpInput.length !== 6) {
      toast.error("Both verification codes must be 6 digits.");
      return;
    }
    setLoading(true);

    try {
      const fullPhone = `${selectedCountry.prefix}${phoneNumber.replace(/\D/g, "")}`;
      const { error } = await supabase.functions.invoke("confirm-dual-verification", {
        body: {
          email,
          phone: fullPhone,
          handle: handle.toLowerCase(),
          display_name: name || handle,
          password,
          country: selectedCountry.code,
          region: selectedCountry.region,
          sms_code: smsOtpInput,
          email_code: emailOtpInput,
        },
      });

      if (error) throw new Error(error.message || "Verification failed.");

      const { error: sessionError } = await supabase.auth.signInWithPassword({ email, password });
      if (sessionError) throw sessionError;

      toast.success("Account created and verified successfully!");
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err.message ?? "Verification error.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySigninChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginOtpInput.length !== 5) {
      toast.error("2FA code must be exactly 5 digits.");
      return;
    }
    setLoading(true);

    try {
      const { error } = await supabase.functions.invoke("verify-login-2fa", {
        body: { email, "2fa_code": loginOtpInput },
      });

      if (error) throw new Error(error.message || "Invalid 2FA code.");

      const { error: sessionError } = await supabase.auth.signInWithPassword({ email, password });
      if (sessionError) throw sessionError;

      toast.success("Login verified.");
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err.message ?? "2FA error.");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) toast.error("Google sign-in failed");
  };

  return (
    <div className="mx-auto flex h-[100dvh] max-w-[480px] flex-col justify-center bg-[#020210] px-6 relative overflow-hidden">
      {/* Aurora Background */}
      <div className="aurora-bg">
        <div className="aurora-ribbon" style={{ top: '20%', opacity: 0.3 }}></div>
        <div className="aurora-ribbon" style={{ top: '60%', animationDelay: '-8s', opacity: 0.2 }}></div>
      </div>

      <div className="flex flex-col h-full justify-center py-4">
        <Link to="/" className={`${mode === 'signup' ? 'mb-4' : 'mb-8'} flex flex-col items-center gap-2 transition-all duration-300 shrink-0`}>
          <img 
            src="/logo.png" 
            alt="JAVAN" 
            className={`${mode === 'signup' ? 'h-16 w-16 rounded-[1.25rem]' : 'h-24 w-24 rounded-[2rem]'} object-cover shadow-glow animate-float transition-all duration-300`} 
          />
          <h1 className={`${mode === 'signup' ? 'text-3xl' : 'text-5xl'} font-black text-chrome tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] uppercase`}>
            JAVAN
          </h1>
        </Link>
        
        <div className={`glass-strong rounded-[2.5rem] ${mode === 'signup' ? 'p-6' : 'p-8'} shadow-glow border border-white/10 relative z-10 transition-all duration-300 overflow-y-auto no-scrollbar`}>
          {stage === "credentials" && (
            <>
              <div className="mb-4 flex rounded-full bg-muted p-1 shrink-0">
                {(["signup", "signin"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`flex-1 rounded-full py-2 text-sm font-bold transition duration-200 transform active:scale-95 ${
                      mode === m ? "bg-white/10 text-white shadow-glow scale-105" : "text-white/40 hover:text-white"
                    }`}
                  >
                    {m === "signup" ? "Create Account" : "Sign In"}
                  </button>
                ))}
              </div>
              
              <button
                onClick={google}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card/60 py-2.5 text-sm font-semibold transition active:scale-[0.97] hover:bg-card/80 shrink-0"
              >
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11.1 0 20-8.9 20-20 0-1.3-.1-2.5-.4-3.5z" />
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                  <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.3-7.2 2.3-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2c1.7-1.6 3.1-3.6 3.9-6.9.5-1.9.7-3.9.7-6z" />
                </svg>
                Continue with Google
              </button>

              <div className="relative mb-4 shrink-0">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-[#020210] px-2 text-muted-foreground">or use credentials</span></div>
              </div>

              <form onSubmit={handleInitialSubmit} className="space-y-3">
                {mode === "signup" && (
                  <>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Display Name"
                      required
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200"
                    />
                    <input
                      value={handle}
                      onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                      placeholder="@username"
                      required
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label htmlFor="auth-country" className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Country</label>
                        <select
                          id="auth-country"
                          value={selectedCountry.code}
                          onChange={(e) => handleCountryChange(e.target.value)}
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-cyan-500 text-white font-semibold"
                        >
                          {GLOBAL_COUNTRIES.slice(0, 10).map((country) => (
                            <option key={country.code} value={country.code} className="bg-neutral-900 text-white">
                              {country.flag} {country.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label htmlFor="auth-phone" className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Phone</label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3 text-[10px] font-bold text-muted-foreground select-none">
                            {selectedCountry.prefix}
                          </span>
                          <input
                            id="auth-phone"
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                            placeholder="Phone"
                            required
                            className="w-full rounded-2xl border border-white/10 bg-white/5 py-2 pl-12 pr-3 text-xs font-mono outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  minLength={8}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-primary w-full rounded-full py-3 mt-2 text-sm font-bold text-white shadow-glow active:scale-[0.96] disabled:opacity-60 uppercase tracking-widest transition-all duration-150 hover:opacity-90 shrink-0"
                >
                  {loading ? "Processing..." : mode === "signup" ? "Create Account" : "Sign In"}
                </button>
              </form>
            </>
          )}
          
          {stage === "verify_signup" && (
            <form onSubmit={handleVerifySignupChallenge} className="space-y-4">
              <div className="text-center pb-2">
                <h3 className="text-white text-lg font-black uppercase tracking-tight">Verify Email & Phone</h3>
                <p className="text-xs text-muted-foreground mt-1">Enter the 6-digit codes sent to both your email and phone.</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-amber-400 uppercase tracking-widest pl-1">SMS Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={smsOtpInput}
                  onChange={(e) => setSmsOtpInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  required
                  className="w-full rounded-2xl border border-amber-500/30 bg-background text-center py-3 text-lg font-mono tracking-[0.5em] font-black outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-150"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest pl-1">Email Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={emailOtpInput}
                  onChange={(e) => setEmailOtpInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  required
                  className="w-full rounded-2xl border border-cyan-500/30 bg-background text-center py-3 text-lg font-mono tracking-[0.5em] font-black outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-150"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-cyan-500 hover:from-amber-400 hover:to-cyan-400 text-black rounded-full py-3 text-sm font-black uppercase tracking-widest transition-all duration-150 active:scale-95 disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Create Account"}
              </button>
              <button
                type="button"
                onClick={() => setStage("credentials")}
                className="w-full text-center text-xs text-neutral-500 hover:text-neutral-300 transition underline pt-2"
              >
                Back to Credentials
              </button>
            </form>
          )}
          
          {stage === "verify_signin" && (
            <form onSubmit={handleVerifySigninChallenge} className="space-y-4">
              <div className="text-center pb-2">
                <h3 className="text-white text-lg font-black uppercase tracking-tight">Two-Factor Authentication</h3>
                <p className="text-xs text-muted-foreground mt-1">Enter the 5-digit code sent to your email.</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest pl-1">2FA Code</label>
                <input
                  type="text"
                  maxLength={5}
                  value={loginOtpInput}
                  onChange={(e) => setLoginOtpInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="00000"
                  required
                  className="w-full rounded-2xl border border-emerald-500/40 bg-background text-center py-3 text-xl font-mono tracking-[0.6em] font-black outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-150"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black rounded-full py-3 text-sm font-black uppercase tracking-widest transition-all duration-150 active:scale-95 disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Unlock Session"}
              </button>
              <button
                type="button"
                onClick={() => setStage("credentials")}
                className="w-full text-center text-xs text-neutral-500 hover:text-neutral-300 transition underline pt-2"
              >
                Back to Sign In
              </button>
            </form>
          )}
          
          <Link to="/" className="mt-4 block text-center text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition shrink-0">← back to home</Link>
        </div>
      </div>
    </div>
  );
}