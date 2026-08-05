CREATE OR REPLACE FUNCTION public.admin_count()
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.user_roles WHERE role = 'admin'
$$;

CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing INTEGER;
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  SELECT COUNT(*) INTO existing FROM public.user_roles WHERE role = 'admin';
  IF existing > 0 THEN
    RETURN FALSE;
  END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (uid, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN TRUE;
END;
$$;