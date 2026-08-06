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
      method,
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

    // Determine the method from the client and stored challenge. Phone signup must never
    // fall back to the email field, which may contain stale data from a previous attempt.
    const isPhoneMethod = method === "phone" || (!method && !!signupData.sms_code);
    const isEmailMethod = !isPhoneMethod && (method === "email" || !!signupData.email_code);
    if (!isPhoneMethod && !isEmailMethod) {
      return new Response(
        JSON.stringify({ error: "Invalid verification method." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    // Create the user account using only the verified identifier. In particular,
    // phone signup must not send an email field, because Supabase will then attempt
    // to create or reconcile an email identity and can report a misleading duplicate email error.
    const baseHandle = handle.toLowerCase();
    const metadataFor = (profileHandle: string) => ({
      handle: profileHandle,
      display_name: signupData.display_name,
      country: signupData.country,
      region: signupData.region,
      phone: signupData.phone,
      verified: true,
    });
    const buildAuthPayload = (profileHandle: string) => isPhoneMethod
      ? { phone: signupData.phone, password, phone_confirm: true, user_metadata: metadataFor(profileHandle) }
      : { email: signupData.email, password, email_confirm: true, user_metadata: metadataFor(profileHandle) };

    let authData;
    let authError;
    ({ data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser(buildAuthPayload(baseHandle)));
    if (authError && /profiles_handle_key|duplicate key.*handle/i.test(authError.message || "")) {
      const retryHandle = `${baseHandle}_${crypto.randomUUID().slice(0, 6)}`;
      ({ data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser(buildAuthPayload(retryHandle)));
    }
    if (authError) {
      const duplicate = /already registered|already exists|already been registered/i.test(authError.message || "");
      if (duplicate) {
        // OTP possession has already been verified. Return a normal response so the
        // client can attempt to sign in with the credentials just supplied instead
        // of surfacing the provider's email-oriented error as an unhandled failure.
        await supabaseAdmin.from("pending_signups").delete().eq("id", signupData.id);
        return new Response(
          JSON.stringify({
            success: true,
            already_exists: true,
            method: isPhoneMethod ? "phone" : "email",
            message: `This ${isPhoneMethod ? "phone number" : "email address"} is already registered. Continuing to sign you in.`,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw authError;
    }

    // The database trigger on auth.users creates the profile row and resolves any
    // handle collision. Update that row by ID; do not insert a second profile.
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        display_name: signupData.display_name,
        signup_ip: signupData.ip_address,
        signup_region: signupData.region_name,
        last_signin_ip: signupData.ip_address,
        last_signin_region: signupData.region_name,
        is_verified: false,
      })
      .eq("id", authData.user.id);

    if (profileError) {
      console.error("[confirm-dual-verification] Profile update error:", profileError.message);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error("Database error finalizing user profile");
    }

    // Clean up
    await supabaseAdmin.from("pending_signups").delete().eq("id", signupData.id);

    return new Response(
      JSON.stringify({
        success: true,
        already_exists: false,
        method: isPhoneMethod ? "phone" : "email",
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
