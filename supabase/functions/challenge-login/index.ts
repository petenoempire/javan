import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

type Json = Record<string, unknown>;
const json = (body: Json, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

function admin() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("2FA service is not configured");
  return createClient(url, key, { auth: { persistSession: false } });
}

function anon() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !key) throw new Error("2FA service is not configured");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function generateCode() {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String(10000 + (bytes[0] % 90000));
}

async function digest(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function deliverSms(phone: string, code: string): Promise<{ mock: boolean }> {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const fromNumber = Deno.env.get("TWILIO_FROM_NUMBER");
  const mockMode = Deno.env.get("TWILIO_MOCK_MODE") === "true";

  if (mockMode || !accountSid || !authToken || !fromNumber) {
    console.warn(`[challenge-login] Mock SMS mode for ${phone}; code is not sent externally.`);
    return { mock: true };
  }

  const body = new URLSearchParams({
    To: phone,
    From: fromNumber,
    Body: `Your Javan sign-in code is ${code}. It expires in 10 minutes.`,
  });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });
  if (!response.ok) throw new Error("Unable to send the sign-in code");
  return { mock: false };
}

async function deliverEmail(email: string, code: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("LOGIN_2FA_FROM");
  if (!apiKey || !from) throw new Error("2FA email delivery is not configured");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Your Javan sign-in code",
      text: `Your Javan sign-in code is ${code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
    }),
  });
  if (!response.ok) throw new Error("Unable to send the sign-in code");
}

function genericFailure() {
  return json({ error: "Invalid credentials." }, 400);
}

async function verifyCode(supabaseAdmin: ReturnType<typeof admin>, identifier: string, code: string) {
  if (!/^\d{5}$/.test(code)) return json({ error: "Enter the 5-digit code." }, 400);
  const { data: row, error } = await supabaseAdmin
    .from("verification_codes")
    .select("id,login_code,login_code_hash,expires_at,failed_attempts,locked_until,purpose")
    .eq("email", identifier)
    .eq("purpose", "login")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!row) return json({ error: "This code is invalid or expired. Request a new code." }, 400);

  const lockedUntil = row.locked_until ? new Date(row.locked_until).getTime() : 0;
  if (lockedUntil > Date.now()) {
    return json({ error: "Too many incorrect attempts. Try again later.", lockedUntil: row.locked_until }, 423);
  }
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    return json({ error: "This code has expired. Request a new code." }, 400);
  }

  const codeHash = await digest(code);
  const valid = row.login_code_hash ? codeHash === row.login_code_hash : row.login_code === code;
  if (!valid) {
    const attempts = Number(row.failed_attempts ?? 0) + 1;
    const nextLock = attempts >= MAX_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS).toISOString() : null;
    await supabaseAdmin.from("verification_codes").update({ failed_attempts: attempts, locked_until: nextLock }).eq("id", row.id);
    if (nextLock) return json({ error: "Too many incorrect attempts. Try again in 15 minutes.", lockedUntil: nextLock }, 423);
    return json({ error: `Incorrect code. ${MAX_ATTEMPTS - attempts} attempts remaining.` }, 400);
  }

  const { error: deleteError } = await supabaseAdmin.from("verification_codes").delete().eq("id", row.id);
  if (deleteError) throw deleteError;
  return json({ success: true, message: "2FA verified." });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json() as Json;
    const method = body.method === "phone" ? "phone" : "email";
    const identifier = String(body.identifier ?? (method === "phone" ? body.phone : body.email) ?? "").trim();
    const email = method === "email" ? identifier.toLowerCase() : "";
    const phone = method === "phone" ? identifier : "";
    const step = body.step === "verify" ? "verify" : "challenge";

    if (method === "email" && (!email || email.length > 320 || !/^\S+@\S+\.\S+$/.test(email))) {
      return json({ error: "Enter a valid email address." }, 400);
    }
    if (method === "phone" && !/^\+[1-9]\d{7,14}$/.test(phone)) {
      return json({ error: "Enter a valid phone number in international format." }, 400);
    }

    const supabaseAdmin = admin();
    if (step === "verify") return await verifyCode(supabaseAdmin, identifier, String(body.code ?? "").trim());

    const password = String(body.password ?? "");
    if (!password || password.length > 512) return genericFailure();
    const credentials = method === "phone" ? { phone, password } : { email, password };
    const { data: signIn, error: signInError } = await anon().auth.signInWithPassword(credentials);
    if (signInError || !signIn.user) return genericFailure();
    await anon().auth.signOut();

    const { data: previous } = await supabaseAdmin
      .from("verification_codes")
      .select("last_sent_at,locked_until")
      .eq("email", identifier)
      .eq("purpose", "login")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (previous?.locked_until && new Date(previous.locked_until).getTime() > Date.now()) {
      return json({ error: "Too many incorrect attempts. Try again later.", lockedUntil: previous.locked_until }, 423);
    }
    if (previous?.last_sent_at && Date.now() - new Date(previous.last_sent_at).getTime() < RESEND_COOLDOWN_MS) {
      return json({ error: "A code was sent recently. Please wait before requesting another.", retryAfter: RESEND_COOLDOWN_MS - (Date.now() - new Date(previous.last_sent_at).getTime()) }, 429);
    }

    const code = generateCode();
    const now = new Date().toISOString();
    const { error: upsertError } = await supabaseAdmin.from("verification_codes").upsert({
      email: identifier,
      purpose: "login",
      login_code: null,
      login_code_hash: await digest(code),
      expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
      failed_attempts: 0,
      locked_until: null,
      last_sent_at: now,
    }, { onConflict: "email,purpose" });
    if (upsertError) throw upsertError;

    const delivery = method === "phone"
      ? await deliverSms(phone, code)
      : await deliverEmail(email, code).then(() => ({ mock: false }));
    return json({
      success: true,
      message: `${method === "phone" ? "SMS" : "Login"} verification code sent.`,
      method,
      mock: delivery.mock,
      ...(method === "phone" && delivery.mock ? { test_code: code } : {}),
      expiresAt: new Date(Date.now() + CODE_TTL_MS).toISOString(),
      resendAfter: new Date(Date.now() + RESEND_COOLDOWN_MS).toISOString(),
    });
  } catch (error) {
    console.error("[challenge-login]", error instanceof Error ? error.message : "unexpected error");
    return json({ error: "The sign-in verification service is temporarily unavailable." }, 503);
  }
});
