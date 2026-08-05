
-- 1) Prevent self-elevation: restrict which columns a non-admin user can change on their own profile row
CREATE OR REPLACE FUNCTION public.profiles_guard_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins can update anything
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- For self-updates, freeze privileged columns to their OLD values
  IF auth.uid() = OLD.id THEN
    NEW.id := OLD.id;
    NEW.is_verified := OLD.is_verified;
    NEW.coins := OLD.coins;
    NEW.earned_coins := OLD.earned_coins;
    NEW.suspended_until := OLD.suspended_until;
    NEW.banned := OLD.banned;
    NEW.created_at := OLD.created_at;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Not allowed';
END;
$$;

DROP TRIGGER IF EXISTS profiles_guard_self_update_trg ON public.profiles;
CREATE TRIGGER profiles_guard_self_update_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.profiles_guard_self_update();

-- 2) Server-side gift catalog + atomic send_gift RPC so coin balances cannot be forged client-side
CREATE TABLE IF NOT EXISTS public.gift_catalog (
  gift_key text PRIMARY KEY,
  name text NOT NULL,
  coin_value integer NOT NULL CHECK (coin_value > 0),
  tier text NOT NULL DEFAULT 'common',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.gift_catalog TO anon, authenticated;
GRANT ALL ON public.gift_catalog TO service_role;

ALTER TABLE public.gift_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS gift_catalog_public_read ON public.gift_catalog;
CREATE POLICY gift_catalog_public_read ON public.gift_catalog
FOR SELECT USING (active = true);

INSERT INTO public.gift_catalog (gift_key, name, coin_value, tier) VALUES
  ('rose', 'Rose', 10, 'common'),
  ('heart', 'Heart', 25, 'common'),
  ('star', 'Star', 50, 'common'),
  ('diamond', 'Diamond', 250, 'rare'),
  ('crown', 'Crown', 1000, 'rare'),
  ('rocket', 'Rocket', 5000, 'legendary')
ON CONFLICT (gift_key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.send_gift(_recipient uuid, _gift_key text, _stream_id text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  g record;
  bal integer;
  new_id uuid;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF me = _recipient THEN RAISE EXCEPTION 'Cannot gift yourself'; END IF;

  SELECT gift_key, name, coin_value INTO g
    FROM public.gift_catalog WHERE gift_key = _gift_key AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid gift'; END IF;

  SELECT coins INTO bal FROM public.profiles WHERE id = me FOR UPDATE;
  IF bal IS NULL OR bal < g.coin_value THEN RAISE EXCEPTION 'Insufficient coins'; END IF;

  INSERT INTO public.gifts_sent (sender_id, recipient_id, gift_key, gift_name, coin_value, stream_id)
  VALUES (me, _recipient, g.gift_key, g.name, g.coin_value, _stream_id)
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.send_gift(uuid, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.send_gift(uuid, text, text) TO authenticated;
