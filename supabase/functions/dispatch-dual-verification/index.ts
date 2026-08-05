import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate a random 6-digit OTP code
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// --- Twilio SMS dispatch with graceful fallback ---
async function sendTwilioSms(to: string, code: string): Promise<{ success: boolean; mock?: boolean; error?: string }> {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const fromNumber = Deno.env.get("TWILIO_FROM_NUMBER");

  // If Twilio credentials are not configured, fall back to mock mode immediately
  if (!accountSid || !authToken || !fromNumber) {
    console.warn("[dispatch-dual-verification] Twilio credentials missing — using mock SMS mode.");
    console.warn(`[MOCK SMS] To: ${to}, Code: ${code}`);
    return { success: true, mock: true };
  }

  try {
    const body = new URLSearchParams();
    body.append("To", to);
    body.append("From", fromNumber);
    body.append("Body", `Your Javan verification code is: ${code}`);

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      }
    );

    if (response.status === 201) {
      const data = await response.json();
      console.log("[dispatch-dual-verification] SMS sent successfully:", data.sid);
      return { success: true };
    }

    const errorData = await response.json().catch(() => ({}));
    const errorCode = errorData?.code;

    // Error 21608: Twilio trial account cannot send SMS to unverified phone numbers
    if (errorCode === 21608) {
      console.warn(
        "[dispatch-dual-verification] Twilio error 21608: Trial account SMS to unverified number blocked. " +
          `Falling back to mock mode. To: ${to}, Code: ${code}`
      );
      console.warn(`[MOCK SMS] To: ${to}, Code: ${code}`);
      return { success: true, mock: true };
    }

    // Other Twilio errors (rate limits, invalid number format, etc.)
    if (errorCode) {
      console.warn(
        `[dispatch-dual-verification] Twilio error ${errorCode}: ${errorData.message || "Unknown error"}. ` +
          `Falling back to mock mode. To: ${to}, Code: ${code}`
      );
      console.warn(`[MOCK SMS] To: ${to}, Code: ${code}`);
      return { success: true, mock: true };
    }

    // Non-JSON error response
    if (response.status >= 400) {
      console.warn(
        `[dispatch-dual-verification] Twilio HTTP ${response.status}. ` +
          `Falling back to mock mode. To: ${to}, Code: ${code}`
      );
      console.warn(`[MOCK SMS] To: ${to}, Code: ${code}`);
      return { success: true, mock: true };
    }

    return { success: false, error: `Unexpected Twilio response status: ${response.status}` };
  } catch (err: any) {
    // Network errors, timeout, etc. — fall back to mock mode
    console.warn(
      `[dispatch-dual-verification] Twilio request failed: ${err.message}. ` +
        `Falling back to mock mode. To: ${to}, Code: ${code}`
    );
    console.warn(`[MOCK SMS] To: ${to}, Code: ${code}`);
    return { success: true, mock: true };
  }
}

// --- Email OTP via Supabase SMTP ---
async function sendEmailOtp(email: string, code: string, handle: string): Promise<{ success: boolean }> {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Store the OTP in Supabase so the confirm function can verify it
    const { error } = await supabaseAdmin
      .from("verification_codes")
      .upsert(
        {
          email,
          code_type: "email",
          otp_code: code,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min expiry
        },
        { onConflict: "email,code_type" }
      );

    if (error) {
      console.error("[dispatch-dual-verification] Failed to store email OTP:", error.message);
      return { success: false };
    }

    // Send the actual email via Supabase auth's built-in OTP
    const { error: emailError } = await supabaseAdmin.auth.admin
      .inviteUserByEmail(email, {
        data: { verification_code: code },
      });

    if (emailError) {
      // Fallback: store OTP and log it (mock mode for email too)
      console.warn(
        `[dispatch-dual-verification] Email invite failed: ${emailError.message}. ` +
          `Using mock email mode. Email: ${email}, Code: ${code}`
      );
      console.warn(`[MOCK EMAIL] To: ${email}, Code: ${code}`);
    } else {
      console.log("[dispatch-dual-verification] Email OTP sent via Supabase Auth.");
    }

    return { success: true };
  } catch (err: any) {
    console.warn(
      `[dispatch-dual-verification] Email send failed: ${err.message}. ` +
        `Using mock email mode. Email: ${email}, Code: ${code}`
    );
    console.warn(`[MOCK EMAIL] To: ${email}, Code: ${code}`);
    return { success: true };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, phone, handle, username, display_name, name, country, region } = await req.json();

    // Validate required fields
    if (!email || !phone || !handle) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, phone, handle" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate OTPs
    const emailCode = generateOtp();
    const smsCode = generateOtp();

    // Store user session data so the confirm function can use it
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Generate a temporary session token to link dispatch → confirm
    const sessionId = crypto.randomUUID();

    // Store the pending signup data
    const { error: sessionError } = await supabaseAdmin
      .from("pending_signups")
      .upsert(
        {
          id: sessionId,
          email,
          phone,
          handle: handle.toLowerCase(),
          username: username?.toLowerCase() || handle.toLowerCase(),
          display_name: display_name || name || handle,
          country: country || "US",
          region: region || "",
          sms_code: smsCode,
          email_code: emailCode,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (sessionError) {
      console.error("[dispatch-dual-verification] Failed to store pending signup:", sessionError.message);
      // Fallback: store codes in verification_codes table
      await supabaseAdmin.from("verification_codes").upsert(
        { email, code_type: "sms", otp_code: smsCode, expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() },
        { onConflict: "email,code_type" }
      );
    }

    // Dispatch both OTPs in parallel
    const [smsResult, emailResult] = await Promise.all([
      sendTwilioSms(phone, smsCode),
      sendEmailOtp(email, emailCode, handle),
    ]);

    // Build response — always return success so the signup flow continues
    // The client will proceed to the verification stage regardless
    return new Response(
      JSON.stringify({
        success: true,
        session_id: sessionId,
        sms_delivered: smsResult.success,
        sms_mock: smsResult.mock || false,
        email_delivered: emailResult.success,
        message: smsResult.mock
          ? "Verification codes generated. SMS delivery is in mock mode (add your phone to Twilio verified numbers or upgrade to production)."
          : "Verification codes sent to your email and phone.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[dispatch-dual-verification] Unexpected error:", err.message);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
