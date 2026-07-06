
CREATE OR REPLACE FUNCTION public.admin_search_profiles(_q text DEFAULT NULL, _limit int DEFAULT 100)
RETURNS SETOF public.profiles
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role('admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN QUERY
    SELECT p.* FROM public.profiles p
    WHERE _q IS NULL OR _q = '' OR p.handle ILIKE '%'||_q||'%' OR p.display_name ILIKE '%'||_q||'%'
    ORDER BY p.created_at DESC
    LIMIT _limit;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_search_profiles(text, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_search_profiles(text, int) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_profiles_by_ids(_ids uuid[])
RETURNS SETOF public.profiles
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role('admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN QUERY SELECT p.* FROM public.profiles p WHERE p.id = ANY(_ids);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_profiles_by_ids(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_profiles_by_ids(uuid[]) TO authenticated, service_role;
