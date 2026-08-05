import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      email,
      phone,
      handle,
      username,
      display_name,
      name,
      password,
      country,
      region,
      sms_code,
      email_code,
    } = await req.json();

    // Validate required fields
    if (!email || !phone || !handle || !sms_code || !email_code || !password) {
      return new Response(
        JSON.stringify({ error: "Missing required fields." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up the stored OTPs
    const { data: signupData, error: lookupError } = await supabaseAdmin
      .from("pending_signups")
      .select("*")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    let expectedSmsCode = sms_code;
    let expectedEmailCode = email_code;

    if (lookupError) {
      // Fallback: check verification_codes table
      const { data: codes } = await supabaseAdmin
        .from("verification_codes")
        .select("code_type, otp_code")
        .in("code_type", ["sms", "email"])
        .eq("email", email)
        .gt("expires_at", new Date().toISOString());

      if (codes) {
        for (const c of codes) {
          if (c.code_type === "sms") expectedSmsCode = c.otp_code;
          if (c.code_type === "email") expectedEmailCode = c.otp_code;
        }
      }
    } else if (signupData) {
      expectedSmsCode = signupData.sms_code;
      expectedEmailCode = signupData.email_code;
    }

    // Verify both codes
    const smsValid = sms_code === expectedSmsCode;
    const emailValid = email_code === expectedEmailCode;

    if (!smsValid && !emailValid) {
      return new Response(
        JSON.stringify({ error: "Both verification codes are incorrect. Please check and try again." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!smsValid) {
      return new Response(
        JSON.stringify({ error: "SMS verification code is incorrect." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!emailValid) {
      return new Response(
        JSON.stringify({ error: "Email verification code is incorrect." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the user account via Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      phone_confirm: true,
      user_metadata: {
        handle: handle.toLowerCase(),
        display_name: display_name || name || handle,
        country: country || "US",
        region: region || "",
        phone,
        verified: true,
      },
    });

    if (authError) {
      // If user already exists, try signing in instead
      if (authError.message?.includes("already registered")) {
        return new Response(
          JSON.stringify({
            error: "An account with this email already exists. Please try logging in.",
            code: "ALREADY_EXISTS",
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("[confirm-dual-verification] Auth create user error:", authError.message);
      return new Response(
        JSON.stringify({ error: authError.message || "Failed to create account." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the profile row
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: authData.user.id,
        handle: handle.toLowerCase(),
        username: username?.toLowerCase() || handle.toLowerCase(),
        display_name: display_name || name || handle,
        country: country || "US",
        region: region || "",
        is_verified: false,
      });

    if (profileError) {
      console.error("[confirm-dual-verification] Profile insert error:", profileError.message);
      // Don't fail the whole flow — the profile can be created on first login
    }

    // Clean up pending signup data
    await supabaseAdmin
      .from("pending_signups")
      .delete()
      .eq("email", email);

    // Clean up verification codes
    await supabaseAdmin
      .from("verification_codes")
      .delete()
      .eq("email", email);

    return new Response(
      JSON.stringify({
        success: true,
        user_id: authData.user.id,
        message: "Account created and verified successfully.",
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
