
-- 1. Switch economy to 80/20 + clean 100 coins = $1 USD rate
CREATE OR REPLACE FUNCTION public.apply_gift_economy()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE creator_share integer;
BEGIN
  creator_share := (NEW.coin_value * 80) / 100;
  UPDATE profiles SET coins = GREATEST(coins - NEW.coin_value, 0) WHERE id = NEW.sender_id;
  UPDATE profiles SET earned_coins = earned_coins + creator_share WHERE id = NEW.recipient_id;
  INSERT INTO notifications(user_id, actor_id, kind, body)
  VALUES (NEW.recipient_id, NEW.sender_id, 'gift', NEW.gift_name || ' (+' || creator_share || ' coins)');
  INSERT INTO public.transactions(user_id, kind, coins, usd_cents, ref_id, meta)
  VALUES
    (NEW.sender_id, 'gift_out', -NEW.coin_value, -NEW.coin_value, NEW.id, jsonb_build_object('recipient', NEW.recipient_id, 'gift', NEW.gift_name)),
    (NEW.recipient_id, 'gift_in', creator_share, creator_share, NEW.id, jsonb_build_object('sender', NEW.sender_id, 'gift', NEW.gift_name));
  RETURN NEW;
END $function$;

-- 2. Platform config (single-row tunables)
CREATE TABLE IF NOT EXISTS public.platform_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  creator_share_pct integer NOT NULL DEFAULT 80,
  min_payout_usd_cents integer NOT NULL DEFAULT 2000,
  payout_hold_days integer NOT NULL DEFAULT 7,
  coin_to_usd_cents numeric NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.platform_config TO anon, authenticated;
GRANT ALL ON public.platform_config TO service_role;
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "platform_config readable" ON public.platform_config FOR SELECT USING (true);
CREATE POLICY "platform_config admin write" ON public.platform_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.platform_config (id) VALUES (true) ON CONFLICT DO NOTHING;

-- 3. Coin packages
CREATE TABLE IF NOT EXISTS public.coin_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coins integer NOT NULL,
  usd_cents integer NOT NULL,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coin_packages TO anon, authenticated;
GRANT ALL ON public.coin_packages TO service_role;
ALTER TABLE public.coin_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coin_packages readable" ON public.coin_packages FOR SELECT USING (active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "coin_packages admin write" ON public.coin_packages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.coin_packages (coins, usd_cents, label, sort_order) VALUES
  (100, 100, 'Starter', 1),
  (500, 500, 'Fan', 2),
  (1000, 1000, 'Supporter', 3),
  (5000, 5000, 'Patron', 4),
  (10000, 10000, 'Champion', 5),
  (100000, 100000, 'Whale', 6)
ON CONFLICT DO NOTHING;

-- 4. Append-only transactions ledger
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('purchase','gift_out','gift_in','payout','refund','adjustment')),
  coins integer NOT NULL DEFAULT 0,
  usd_cents integer NOT NULL DEFAULT 0,
  ref_id uuid,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS transactions_user_created_idx ON public.transactions(user_id, created_at DESC);
GRANT SELECT ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tx self read" ON public.transactions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 5. Fraud flags
CREATE TABLE IF NOT EXISTS public.fraud_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  related_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text NOT NULL,
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high')),
  resolved boolean NOT NULL DEFAULT false,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.fraud_flags TO authenticated;
GRANT ALL ON public.fraud_flags TO service_role;
ALTER TABLE public.fraud_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fraud_flags admin" ON public.fraud_flags FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. Payout request hardening — hold window
ALTER TABLE public.payout_requests
  ADD COLUMN IF NOT EXISTS available_after timestamptz,
  ADD COLUMN IF NOT EXISTS verified_at_request boolean NOT NULL DEFAULT false;

-- 7. request_payout RPC enforces verification + min + hold
CREATE OR REPLACE FUNCTION public.request_payout(
  _coins integer, _method text, _details text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me uuid := auth.uid();
  cfg public.platform_config%ROWTYPE;
  bal integer;
  verified boolean;
  new_id uuid;
  banned_flag boolean;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO cfg FROM public.platform_config LIMIT 1;
  SELECT banned INTO banned_flag FROM public.profiles WHERE id = me;
  IF banned_flag THEN RAISE EXCEPTION 'Account is suspended'; END IF;
  SELECT EXISTS(SELECT 1 FROM public.verifications WHERE user_id = me AND status = 'approved') INTO verified;
  IF NOT verified THEN RAISE EXCEPTION 'Identity verification required before withdrawals'; END IF;
  IF _coins < cfg.min_payout_usd_cents THEN
    RAISE EXCEPTION 'Minimum withdrawal is % coins ($%)', cfg.min_payout_usd_cents, (cfg.min_payout_usd_cents::numeric / 100);
  END IF;
  SELECT earned_coins INTO bal FROM public.profiles WHERE id = me FOR UPDATE;
  IF bal IS NULL OR bal < _coins THEN RAISE EXCEPTION 'Insufficient earnings'; END IF;
  UPDATE public.profiles SET earned_coins = earned_coins - _coins WHERE id = me;
  INSERT INTO public.payout_requests(user_id, coins, usd_cents, payout_method, payout_details, status, available_after, verified_at_request)
  VALUES (me, _coins, _coins, _method, _details, 'hold', now() + (cfg.payout_hold_days || ' days')::interval, true)
  RETURNING id INTO new_id;
  INSERT INTO public.transactions(user_id, kind, coins, usd_cents, ref_id, meta)
  VALUES (me, 'payout', -_coins, -_coins, new_id, jsonb_build_object('method', _method, 'status', 'hold'));
  RETURN new_id;
END $$;

-- 8. send_gift: block self-gift via linked devices (basic — sender = recipient already blocked; add velocity flag)
CREATE OR REPLACE FUNCTION public.send_gift(_recipient uuid, _gift_key text, _stream_id text DEFAULT NULL)
 RETURNS uuid
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  me uuid := auth.uid();
  g record;
  bal integer;
  new_id uuid;
  recent_count integer;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF me = _recipient THEN RAISE EXCEPTION 'Cannot gift yourself'; END IF;
  SELECT gift_key, name, coin_value INTO g
    FROM public.gift_catalog WHERE gift_key = _gift_key AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid gift'; END IF;
  SELECT coins INTO bal FROM public.profiles WHERE id = me FOR UPDATE;
  IF bal IS NULL OR bal < g.coin_value THEN RAISE EXCEPTION 'Insufficient coins'; END IF;

  -- Velocity check: >50 gifts to same recipient in 1h → flag
  SELECT COUNT(*) INTO recent_count FROM public.gifts_sent
    WHERE sender_id = me AND recipient_id = _recipient AND created_at > now() - interval '1 hour';
  IF recent_count > 50 THEN
    INSERT INTO public.fraud_flags(user_id, related_user_id, reason, severity, meta)
    VALUES (me, _recipient, 'gift_velocity', 'high', jsonb_build_object('window','1h','count',recent_count));
  END IF;

  INSERT INTO public.gifts_sent (sender_id, recipient_id, gift_key, gift_name, coin_value, stream_id)
  VALUES (me, _recipient, g.gift_key, g.name, g.coin_value, _stream_id)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$function$;
