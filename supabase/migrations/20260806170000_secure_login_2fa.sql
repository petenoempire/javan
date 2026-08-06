-- Secure login 2FA state used by challenge-login and verify-login-2fa.
-- The table may already exist under either the legacy schema or the current schema.
ALTER TABLE public.verification_codes
  ADD COLUMN IF NOT EXISTS login_code_hash text,
  ADD COLUMN IF NOT EXISTS failed_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until timestamptz,
  ADD COLUMN IF NOT EXISTS last_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS verification_codes_login_lookup_idx
  ON public.verification_codes (email, purpose, created_at DESC);

CREATE INDEX IF NOT EXISTS verification_codes_lockout_idx
  ON public.verification_codes (email, purpose, locked_until);

REVOKE ALL ON public.verification_codes FROM anon, authenticated;
GRANT ALL ON public.verification_codes TO service_role;

ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;
