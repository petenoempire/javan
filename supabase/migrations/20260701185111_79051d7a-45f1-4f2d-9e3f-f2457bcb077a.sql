CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller uuid := auth.uid();
BEGIN
  IF caller IS NULL THEN
    RETURN FALSE;
  END IF;
  IF _user_id IS DISTINCT FROM caller AND NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = caller AND role = 'admin'
  ) THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
END;
$$;