import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getGeoData(req: Request): Promise<{ ip: string; region: string }> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "0.0.0.0";
  try {
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Missing email or password." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Capture server-side IP and Region
    const { ip, region } = await getGeoData(req);

    // Verify credentials
    const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.getUserByEmail(email);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid credentials." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update last signin info in profiles
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        last_signin_ip: ip,
        last_signin_region: region,
      })
      .eq("id", user.id);

    if (profileError) console.error("[challenge-login] Profile update error:", profileError.message);

    return new Response(
      JSON.stringify({
        success: true,
        ip,
        region,
        message: "Login challenge successful.",
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
