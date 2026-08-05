
INSERT INTO public.gift_catalog (gift_key, name, coin_value, tier, active) VALUES
('javan_cap','Javan Cap',10,'entry',true),
('rose','Rose',15,'entry',true),
('heart_gift','Heart',20,'entry',true),
('star','Star',30,'entry',true),
('bucket','Bucket',50,'entry',true),
('popcorn','Popcorn',60,'entry',true),
('balloon','Balloon',75,'entry',true),
('cub','Cub',500,'fun',true),
('crown','Crown',750,'fun',true),
('rocket','Rocket',1000,'fun',true),
('fireworks','Fireworks',1500,'fun',true),
('drum','Talking Drum',2000,'fun',true),
('diamond','Diamond',3500,'fun',true),
('yacht','Yacht',5000,'fun',true),
('galaxy','Galaxy',10000,'mid',true),
('panther','Panther',15000,'mid',true),
('eagle','Eagle',25000,'mid',true),
('bull','Bull',40000,'mid',true),
('tiger','Tiger',60000,'mid',true),
('rhino','Rhino',90000,'mid',true),
('lioness','Lioness',250000,'premium',true),
('gorilla','Gorilla',350000,'premium',true),
('hisense_tv','Hisense Smart TV',500000,'premium',true),
('yacht_gold','Golden Yacht',650000,'premium',true),
('mansion','Mansion',800000,'premium',true),
('hippopotamus','Hippopotamus',1000000,'elite',true),
('lion','Lion',1500000,'elite',true),
('private_jet','Private Jet',1800000,'elite',true),
('elephant','Elephant',2500000,'elite',true)
ON CONFLICT (gift_key) DO UPDATE SET name = EXCLUDED.name, coin_value = EXCLUDED.coin_value, tier = EXCLUDED.tier, active = true;

-- Gifts may only be created through public.send_gift()
DROP POLICY IF EXISTS gifts_send_self ON public.gifts_sent;
REVOKE INSERT, UPDATE, DELETE ON public.gifts_sent FROM authenticated, anon;

-- Payout requests may only be created through public.request_payout()
DROP POLICY IF EXISTS pr_self_insert ON public.payout_requests;
REVOKE INSERT, DELETE ON public.payout_requests FROM authenticated, anon;

-- Clients can no longer post fake gift chat rows
DROP POLICY IF EXISTS live_chat_insert_own ON public.live_chat_messages;
CREATE POLICY live_chat_insert_own ON public.live_chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND kind <> 'gift' AND gift_key IS NULL AND gift_coins = 0);

-- Server-side emission of gift chat entries from verified gift transactions
CREATE OR REPLACE FUNCTION public.emit_gift_chat_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.stream_id IS NOT NULL THEN
    BEGIN
      INSERT INTO public.live_chat_messages (stream_id, user_id, kind, body, gift_key, gift_coins)
      VALUES (NEW.stream_id::uuid, NEW.sender_id, 'gift', NEW.gift_name, NEW.gift_key, NEW.coin_value);
    EXCEPTION WHEN others THEN
      NULL;
    END;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS gifts_sent_emit_chat ON public.gifts_sent;
CREATE TRIGGER gifts_sent_emit_chat
AFTER INSERT ON public.gifts_sent
FOR EACH ROW EXECUTE FUNCTION public.emit_gift_chat_message();
