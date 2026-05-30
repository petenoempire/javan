
ALTER TYPE notification_kind ADD VALUE IF NOT EXISTS 'like';
ALTER TYPE notification_kind ADD VALUE IF NOT EXISTS 'comment';
ALTER TYPE notification_kind ADD VALUE IF NOT EXISTS 'message';
ALTER TYPE notification_kind ADD VALUE IF NOT EXISTS 'payout';
ALTER TYPE notification_kind ADD VALUE IF NOT EXISTS 'topup';

CREATE TABLE public.coin_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  coins integer NOT NULL CHECK (coins > 0),
  usd_cents integer NOT NULL CHECK (usd_cents > 0),
  provider text NOT NULL DEFAULT 'stripe',
  provider_ref text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','succeeded','failed','refunded')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.coin_purchases TO authenticated;
GRANT ALL ON public.coin_purchases TO service_role;
ALTER TABLE public.coin_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY cp_self_read ON public.coin_purchases FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));
CREATE POLICY cp_self_insert ON public.coin_purchases FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER cp_set_updated_at BEFORE UPDATE ON public.coin_purchases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  coins integer NOT NULL CHECK (coins >= 10000),
  usd_cents integer NOT NULL,
  payout_method text NOT NULL CHECK (payout_method IN ('paypal','bank','stripe')),
  payout_details text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','rejected')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid,
  reviewed_at timestamptz
);
GRANT SELECT, INSERT ON public.payout_requests TO authenticated;
GRANT ALL ON public.payout_requests TO service_role;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY pr_self_read ON public.payout_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));
CREATE POLICY pr_self_insert ON public.payout_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY pr_admin_update ON public.payout_requests FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER pr_set_updated_at BEFORE UPDATE ON public.payout_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.get_or_create_conversation(other_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := auth.uid(); a uuid; b uuid; cid uuid;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF other_id = me THEN RAISE EXCEPTION 'Cannot message yourself'; END IF;
  IF me < other_id THEN a := me; b := other_id; ELSE a := other_id; b := me; END IF;
  SELECT id INTO cid FROM conversations WHERE user_a = a AND user_b = b;
  IF cid IS NULL THEN
    INSERT INTO conversations(user_a, user_b) VALUES (a, b) RETURNING id INTO cid;
  END IF;
  RETURN cid;
END $$;
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.notify_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner uuid;
BEGIN
  SELECT user_id INTO owner FROM videos WHERE id = NEW.video_id;
  IF owner IS NOT NULL AND owner <> NEW.user_id THEN
    INSERT INTO notifications(user_id, actor_id, kind, body)
    VALUES (owner, NEW.user_id, 'like', 'liked your video');
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_like ON public.video_likes;
CREATE TRIGGER trg_notify_like AFTER INSERT ON public.video_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_like();

CREATE OR REPLACE FUNCTION public.notify_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner uuid;
BEGIN
  SELECT user_id INTO owner FROM videos WHERE id = NEW.video_id;
  IF owner IS NOT NULL AND owner <> NEW.user_id THEN
    INSERT INTO notifications(user_id, actor_id, kind, body)
    VALUES (owner, NEW.user_id, 'comment', left(NEW.body, 140));
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_comment ON public.comments;
CREATE TRIGGER trg_notify_comment AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_comment();

CREATE OR REPLACE FUNCTION public.notify_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE recipient uuid;
BEGIN
  SELECT CASE WHEN c.user_a = NEW.sender_id THEN c.user_b ELSE c.user_a END
    INTO recipient FROM conversations c WHERE c.id = NEW.conversation_id;
  UPDATE conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
  IF recipient IS NOT NULL THEN
    INSERT INTO notifications(user_id, actor_id, kind, body)
    VALUES (recipient, NEW.sender_id, 'message', left(NEW.body, 140));
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_message ON public.messages;
CREATE TRIGGER trg_notify_message AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_message();

DROP TRIGGER IF EXISTS trg_notify_follow ON public.follows;
CREATE TRIGGER trg_notify_follow AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.notify_follow();

CREATE OR REPLACE FUNCTION public.apply_gift_economy()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE creator_share integer;
BEGIN
  creator_share := (NEW.coin_value * 70) / 100;
  UPDATE profiles SET coins = GREATEST(coins - NEW.coin_value, 0) WHERE id = NEW.sender_id;
  UPDATE profiles SET earned_coins = earned_coins + creator_share WHERE id = NEW.recipient_id;
  INSERT INTO notifications(user_id, actor_id, kind, body)
  VALUES (NEW.recipient_id, NEW.sender_id, 'gift', NEW.gift_name || ' (+' || creator_share || ' coins)');
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_apply_gift ON public.gifts_sent;
CREATE TRIGGER trg_apply_gift AFTER INSERT ON public.gifts_sent
  FOR EACH ROW EXECUTE FUNCTION public.apply_gift_economy();
