-- Assumes: profiles(id, coins, earned_coins), 
-- gift_transactions(id, stream_id, viewer_id, streamer_id, gift_key, coin_cost, created_at),
-- platform_revenue(id, source, amount_coins, amount_usd_cents, created_at),
-- payout_requests(id, user_id, coin_amount, usd_cents, fee_usd_cents, currency, status, payout_method, created_at)

-- Module 5.I: Coin-to-Diamond gift split (50/50)
create or replace function process_gift_transaction(
  p_viewer_id uuid,
  p_streamer_id uuid,
  p_stream_id uuid,
  p_gift_key text,
  p_coin_cost bigint
) returns json
language plpgsql
security definer
as $$
declare
  v_viewer_balance bigint;
  v_streamer_diamonds bigint;
  v_platform_share bigint;
  v_creator_share bigint;
begin
  -- Lock the viewer's row to prevent race conditions on balance
  select coins into v_viewer_balance from profiles where id = p_viewer_id for update;

  if v_viewer_balance is null then
    raise exception 'Viewer profile not found';
  end if;

  if v_viewer_balance < p_coin_cost then
    raise exception 'Insufficient coin balance';
  end if;

  v_creator_share := p_coin_cost / 2;
  v_platform_share := p_coin_cost - v_creator_share;

  -- Deduct from viewer
  update profiles set coins = coins - p_coin_cost where id = p_viewer_id;

  -- Credit streamer's diamond/earned balance
  update profiles set earned_coins = coalesce(earned_coins, 0) + v_creator_share where id = p_streamer_id;

  -- Log the transaction
  insert into gift_transactions (viewer_id, streamer_id, stream_id, gift_key, coin_cost, creator_share, platform_share)
  values (p_viewer_id, p_streamer_id, p_stream_id, p_gift_key, p_coin_cost, v_creator_share, v_platform_share);

  -- Route platform's cut to revenue ledger
  insert into platform_revenue (source, amount_coins)
  values ('gift_split', v_platform_share);

  return json_build_object(
    'success', true,
    'creator_share', v_creator_share,
    'platform_share', v_platform_share
  );
end;
$$;

-- Module 5.III: Withdrawal with 2.5% platform fee
create or replace function process_withdrawal(
  p_user_id uuid,
  p_coin_amount bigint,
  p_currency text
) returns json
language plpgsql
security definer
as $$
declare
  v_earned_balance bigint;
  v_usd_cents bigint;
  v_fee_cents bigint;
  v_net_cents bigint;
  v_payout_id uuid;
begin
  select earned_coins into v_earned_balance from profiles where id = p_user_id for update;

  if v_earned_balance is null or v_earned_balance < p_coin_amount then
    raise exception 'Insufficient earned balance for withdrawal';
  end if;

  -- 100 coins = $1 USD, matching your Wallet.tsx coinsToUsd logic
  v_usd_cents := (p_coin_amount * 100) / 100;
  v_fee_cents := round(v_usd_cents * 0.025);
  v_net_cents := v_usd_cents - v_fee_cents;

  update profiles set earned_coins = earned_coins - p_coin_amount where id = p_user_id;

  insert into payout_requests (user_id, coin_amount, usd_cents, fee_usd_cents, currency, status, payout_method)
  values (p_user_id, p_coin_amount, v_net_cents, v_fee_cents, p_currency, 'pending', 'bank_transfer')
  returning id into v_payout_id;

  insert into platform_revenue (source, amount_usd_cents)
  values ('withdrawal_fee', v_fee_cents);

  return json_build_object(
    'success', true,
    'payout_id', v_payout_id,
    'net_usd_cents', v_net_cents,
    'fee_usd_cents', v_fee_cents
  );
end;
$$;
