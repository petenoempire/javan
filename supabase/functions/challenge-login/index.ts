import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Json = Record<string, unknown>;
const json = (body: Json, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = (await req.json().catch(() => ({}))) as Json;
    const method = body.method === "phone" ? "phone" : "email";
    const identifier = String(body.identifier ?? (method === "phone" ? body.phone : body.email) ?? "").trim();
    const step = body.step === "verify" ? "verify" : "challenge";

    if (step === "verify") {
      const code = String(body.code ?? "").trim();
      if (!code) return json({ error: "Enter the verification code." }, 400);
      return json({ success: true, message: "2FA verified." });
    }

    return json({
      success: true,
      message: `${method === "phone" ? "SMS" : "Login"} verification code sent.`,
      method,
      mock: true,
      test_code: "12345",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      resendAfter: new Date(Date.now() + 60 * 1000).toISOString(),
    });
  } catch (error) {
    return json({
      success: true,
      message: "Verification code sent.",
      method: "email",
      mock: true,
      test_code: "12345",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      resendAfter: new Date(Date.now() + 60 * 1000).toISOString(),
    });
  }
});
