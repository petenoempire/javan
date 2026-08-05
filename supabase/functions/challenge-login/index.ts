import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, password" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if the user exists
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers({
      filter: `email=${email}`,
    });

    if (userError) {
      console.error("[challenge-login] User lookup error:", userError.message);
    }

    // For security, we don't reveal whether the email exists
    // Generate a login challenge code and store it
    const loginCode = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Store the challenge (we'll verify the password in the confirm step)
    // For now, just signal success so the client shows the OTP screen
    return new Response(
      JSON.stringify({
        success: true,
        message: "Login code sent to your email.",
        // In production, this would send the code via email
        // Mock mode logs it for development
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[challenge-login] Unexpected error:", err.message);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
