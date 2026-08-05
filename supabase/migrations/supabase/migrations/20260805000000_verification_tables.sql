-- Tables for dual verification flow (dispatch + confirm)
-- Required by dispatch-dual-verification and confirm-dual-verification Edge Functions

-- Pending signups: stores user data + OTPs during the verification stage
CREATE TABLE IF NOT EXISTS public.pending_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  handle TEXT NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT NOT NULL,
  country TEXT DEFAULT 'US',
  region TEXT DEFAULT '',
  sms_code TEXT NOT NULL,
  email_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pending_signups_email ON public.pending_signups(email);

-- Verification codes: stores OTPs with expiry for lookup
CREATE TABLE IF NOT EXISTS public.verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code_type TEXT NOT NULL CHECK (code_type IN ('sms', 'email')),
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(email, code_type)
);

CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON public.verification_codes(email);

-- RLS: pending_signups and verification_codes are managed by Edge Functions
-- (service role key bypasses RLS), so no policies needed.
-- But if row-level security is enabled, allow all operations for service role:
ALTER TABLE public.pending_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Clean up expired rows periodically (Edge Functions should also clean up after use)
-- This is a safeguard; in practice, confirm-dual-verification deletes rows on success.
