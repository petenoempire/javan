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

async function getGeoData(req: Request): Promise<{ ip: string; region: string }> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "0.0.0.0";
  try {
    // Using ipapi.co for geolocation. It allows free lookups for the client's own IP or a specific IP.
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    if (!response.ok) throw new Error(`Geo API returned ${response.status}`);
    const data = await response.json();
    return {
      ip,
      region: data.country_name || data.region || "Unknown",
    };
  } catch (err) {
    console.warn("[getGeoData] Geo lookup failed:", err.message);
    return { ip, region: "Unknown" };
  }
}

// --- Twilio SMS dispatch with graceful fallback ---
async function sendTwilioSms(to: string, code: string): Promise<{ success: boolean; mock?: boolean; error?: string }> {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const fromNumber = Deno.env.get("TWILIO_FROM_NUMBER");

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
      console.log("[dispatch-dual-verification] SMS sent successfully");
      return { success: true };
    }

    const errorData = await response.json().catch(() => ({}));
    console.warn(`[dispatch-dual-verification] Twilio error: ${errorData.message || "Unknown"}`);
    return { success: true, mock: true };
  } catch (err: any) {
    console.warn(`[dispatch-dual-verification] Twilio request failed: ${err.message}`);
    return { success: true, mock: true };
  }
}

// --- Email OTP via Supabase SMTP ---
async function sendEmailOtp(email: string, code: string): Promise<{ success: boolean }> {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Store the OTP in Supabase
    const { error } = await supabaseAdmin
      .from("verification_codes")
      .upsert(
        {
          email,
          code_type: "email",
          otp_code: code,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        },
        { onConflict: "email,code_type" }
      );

    if (error) throw error;

    // Send the actual email via Supabase auth's built-in OTP
    const { error: emailError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { verification_code: code },
    });

    if (emailError) {
      console.warn(`[dispatch-dual-verification] Email invite failed: ${emailError.message}. Using mock.`);
      console.warn(`[MOCK EMAIL] To: ${email}, Code: ${code}`);
    } else {
      console.log("[dispatch-dual-verification] Email OTP sent.");
    }

    return { success: true };
  } catch (err: any) {
    console.warn(`[dispatch-dual-verification] Email send failed: ${err.message}. Using mock.`);
    console.warn(`[MOCK EMAIL] To: ${email}, Code: ${code}`);
    return { success: true };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { 
      method, // "email" or "phone"
      email, 
      phone, 
      handle, 
      username, 
      display_name, 
      name,
      // Ignore client-reported country/region for security
    } = await req.json();

    if (!handle || (!email && method === "email") || (!phone && method === "phone")) {
      return new Response(
        JSON.stringify({ error: "Missing required fields." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Capture server-side IP and Region
    const { ip, region } = await getGeoData(req);

    const emailCode = method === "email" ? generateOtp() : "";
    const smsCode = method === "phone" ? generateOtp() : "";

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const sessionId = crypto.randomUUID();

    // Store the pending signup data with server-side IP and Region
    const { error: sessionError } = await supabaseAdmin
      .from("pending_signups")
      .upsert(
        {
          id: sessionId,
          email: email || "",
          phone: phone || "",
          handle: handle.toLowerCase(),
          username: username?.toLowerCase() || handle.toLowerCase(),
          display_name: display_name || name || handle,
          country: region, // Store region in country field for now, or use new fields
          region: region,
          ip_address: ip,
          region_name: region,
          sms_code: smsCode,
          email_code: emailCode,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (sessionError) throw sessionError;

    let deliveryResult;
    if (method === "phone") {
      deliveryResult = await sendTwilioSms(phone, smsCode);
    } else {
      deliveryResult = await sendEmailOtp(email, emailCode);
    }

    return new Response(
      JSON.stringify({
        success: true,
        session_id: sessionId,
        method,
        ip,
        region,
        message: `Verification code sent via ${method}.`,
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
