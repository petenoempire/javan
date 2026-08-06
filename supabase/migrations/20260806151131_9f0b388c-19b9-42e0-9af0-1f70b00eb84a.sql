CREATE TABLE IF NOT EXISTS public.pending_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  handle text NOT NULL,
  username text,
  display_name text,
  country text,
  region text,
  ip_address text,
  region_name text,
  sms_code text,
  email_code text,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '10 minutes',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pending_signups_handle_idx ON public.pending_signups (handle, created_at DESC);
GRANT ALL ON public.pending_signups TO service_role;
ALTER TABLE public.pending_signups ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code_type text NOT NULL,
  otp_code text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '10 minutes',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email, code_type)
);
GRANT ALL ON public.verification_codes TO service_role;
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;