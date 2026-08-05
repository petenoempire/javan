-- Add IP and region tracking to pending_signups
ALTER TABLE public.pending_signups 
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS region_name TEXT;

-- Add IP and region tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS signup_ip TEXT,
ADD COLUMN IF NOT EXISTS signup_region TEXT,
ADD COLUMN IF NOT EXISTS last_signin_ip TEXT,
ADD COLUMN IF NOT EXISTS last_signin_region TEXT;
