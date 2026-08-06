-- Make auth profile creation resilient to concurrent handle collisions.
-- The live trigger previously checked for availability and then inserted, which
-- could still lose a race and abort phone signup on profiles_handle_key.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_handle text;
  final_handle text;
  suffix integer := 0;
BEGIN
  base_handle := lower(regexp_replace(
    coalesce(
      NEW.raw_user_meta_data->>'handle',
      split_part(coalesce(NEW.email, ''), '@', 1),
      'user' || substr(NEW.id::text, 1, 8)
    ),
    '[^a-z0-9_]', '', 'g'
  ));

  IF base_handle = '' THEN
    base_handle := 'user' || substr(NEW.id::text, 1, 8);
  END IF;

  final_handle := base_handle;
  LOOP
    BEGIN
      INSERT INTO public.profiles (id, handle, display_name, avatar_url)
      VALUES (
        NEW.id,
        final_handle,
        coalesce(NEW.raw_user_meta_data->>'display_name', final_handle),
        NEW.raw_user_meta_data->>'avatar_url'
      );
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      suffix := suffix + 1;
      final_handle := base_handle || '_' || suffix::text;
    END;
  END LOOP;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
COMMENT ON FUNCTION public.handle_new_user() IS
  'Creates an auth profile and retries handle suffixes on unique collisions.';
