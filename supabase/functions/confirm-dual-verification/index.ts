import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      email,
      phone,
      handle,
      session_id,
      password,
      sms_code,
      email_code,
    } = await req.json();

    if (!handle || !password || (!sms_code && !email_code)) {
      return new Response(
        JSON.stringify({ error: "Missing required fields." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up the stored pending signup
    let query = supabaseAdmin
      .from("pending_signups")
      .select("*");
    query = session_id
      ? query.eq("id", session_id).single()
      : query.eq("handle", handle.toLowerCase()).order("created_at", { ascending: false }).limit(1).single();
    
    const { data: signupData, error: lookupError } = await query;

    if (lookupError || !signupData) {
      return new Response(
        JSON.stringify({ error: "Verification session not found or expired." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine verification method
    const isPhoneMethod = !!signupData.sms_code;
    const isEmailMethod = !!signupData.email_code;

    const twilioConfigured = Boolean(
      Deno.env.get("TWILIO_ACCOUNT_SID") &&
      Deno.env.get("TWILIO_AUTH_TOKEN") &&
      Deno.env.get("TWILIO_FROM_NUMBER")
    );
    const mockCodeAllowed = Deno.env.get("TWILIO_MOCK_MODE") === "true" || !twilioConfigured;
    const validMockCode = mockCodeAllowed && sms_code === (Deno.env.get("TWILIO_MOCK_CODE") || "123456");

    if (isPhoneMethod && sms_code !== signupData.sms_code && !validMockCode) {
      return new Response(
        JSON.stringify({ error: "Incorrect SMS verification code." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (isEmailMethod && email_code !== signupData.email_code) {
      return new Response(
        JSON.stringify({ error: "Incorrect email verification code." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the user account
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: signupData.email || `${handle.toLowerCase()}@javan.internal`,
      phone: signupData.phone || undefined,
      password,
      email_confirm: true,
      phone_confirm: true,
      user_metadata: {
        handle: handle.toLowerCase(),
        display_name: signupData.display_name,
        country: signupData.country,
        region: signupData.region,
        phone: signupData.phone,
        verified: true,
      },
    });

    if (authError) {
      if (authError.message?.includes("already registered")) {
        return new Response(
          JSON.stringify({ error: "An account with this identifier already exists.", code: "ALREADY_EXISTS" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw authError;
    }

    // Create the profile with server-side captured IP and region
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: authData.user.id,
        handle: handle.toLowerCase(),
        display_name: signupData.display_name,
        signup_ip: signupData.ip_address,
        signup_region: signupData.region_name,
        last_signin_ip: signupData.ip_address,
        last_signin_region: signupData.region_name,
        is_verified: false,
      });

    if (profileError) console.error("[confirm-dual-verification] Profile error:", profileError.message);

    // Clean up
    await supabaseAdmin.from("pending_signups").delete().eq("id", signupData.id);

    return new Response(
      JSON.stringify({
        success: true,
        user_id: authData.user.id,
        message: "Account created successfully.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[confirm-dual-verification] Unexpected error:", err.message);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
