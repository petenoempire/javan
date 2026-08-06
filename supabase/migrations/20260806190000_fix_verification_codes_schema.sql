ALTER TABLE public.verification_codes
  ADD COLUMN IF NOT EXISTS purpose text DEFAULT 'login',
  ADD COLUMN IF NOT EXISTS code_type text DEFAULT 'login',
  ADD COLUMN IF NOT EXISTS login_code text,
  ADD COLUMN IF NOT EXISTS otp_code text,
  ADD COLUMN IF NOT EXISTS login_code_hash text,
  ADD COLUMN IF NOT EXISTS failed_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until timestamptz,
  ADD COLUMN IF NOT EXISTS last_sent_at timestamptz;

-- Ensure unique constraint exists for (email, code_type) or (email, purpose)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'verification_codes_email_code_type_key'
  ) THEN
    ALTER TABLE public.verification_codes ADD CONSTRAINT verification_codes_email_code_type_key UNIQUE (email, code_type);
  END IF;
EXCEPTION
  WHEN others => NULL;
END $$;
