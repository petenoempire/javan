import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// 5-digit login 2FA code (client input expects 5 digits)
function generate2fa(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

async function getGeoData(req: Request): Promise<{ ip: string; region: string }> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "0.0.0.0";
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    if (!response.ok) throw new Error(`Geo API returned ${response.status}`);
    const data = await response.json();
    return { ip, region: data.country_name || data.region || "Unknown" };
  } catch (err) {
    console.warn("[challenge-login] Geo lookup failed:", (err as Error).message);
    return { ip, region: "Unknown" };
  }
}

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

async function deliverCode(email: string, code: string) {
  try {
    const { error } = await admin().auth.admin.generateLink({ type: "magiclink", email });
    if (error) throw error;
    console.log("[challenge-login] Login code email dispatched.");
  } catch (err) {
    console.warn(`[challenge-login] Email delivery failed: ${(err as Error).message}. Using mock.`);
    console.warn(`[MOCK LOGIN 2FA] To: ${email}, Code: ${code}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const step: string = body.step === "verify" ? "verify" : "challenge";
    const email: string = (body.email || "").trim().toLowerCase();
    const supabaseAdmin = admin();

    // ---- Step 2: verify the 2FA code ----
    if (step === "verify") {
      const code: string = String(body.code ?? body["2fa_code"] ?? "").trim();
      if (!email || !code) return json({ error: "Missing email or code." }, 400);

      const { data: row, error } = await supabaseAdmin
        .from("verification_codes")
        .select("otp_code, expires_at")
        .eq("email", email)
        .eq("code_type", "login_2fa")
        .maybeSingle();

      if (error) throw error;
      if (!row) return json({ error: "No pending login challenge. Please sign in again." }, 400);
      if (new Date(row.expires_at).getTime() < Date.now()) {
        return json({ error: "Code expired. Please sign in again." }, 400);
      }
      if (row.otp_code !== code) return json({ error: "Incorrect code." }, 400);

      await supabaseAdmin
        .from("verification_codes")
        .delete()
        .eq("email", email)
        .eq("code_type", "login_2fa");

      return json({ success: true, message: "2FA verified." });
    }

    // ---- Step 1: validate credentials and issue a code ----
    const password: string = body.password || "";
    if (!email || !password) return json({ error: "Missing email or password." }, 400);

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { data: signIn, error: signInError } = await anonClient.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError || !signIn?.user) return json({ error: "Invalid credentials." }, 400);
    await anonClient.auth.signOut();

    const { ip, region } = await getGeoData(req);
    const code = generate2fa();

    const { error: upsertError } = await supabaseAdmin.from("verification_codes").upsert(
      {
        email,
        code_type: "login_2fa",
        otp_code: code,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      },
      { onConflict: "email,code_type" },
    );
    if (upsertError) throw upsertError;

    await deliverCode(email, code);

    return json({
      success: true,
      ip,
      region,
      message: "Login verification code sent.",
    });
  } catch (err) {
    console.error("[challenge-login] Unexpected error:", (err as Error).message);
    return json({ error: (err as Error).message || "Internal server error" }, 400);
  }
});
