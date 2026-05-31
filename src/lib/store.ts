import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";

/**
 * Wallet is read-only from the client. Coin balances live in profiles.coins /
 * profiles.earned_coins and are mutated server-side via SECURITY DEFINER RPCs
 * (send_gift, top-up webhooks, payout reviews). Never persist coins in
 * localStorage — that would let users forge balances.
 */
export function useWallet() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["wallet", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("coins, earned_coins")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return { coins: data?.coins ?? 0, earned: data?.earned_coins ?? 0 };
    },
  });
  return {
    coins: q.data?.coins ?? 0,
    earned: q.data?.earned ?? 0,
    refetch: q.refetch,
    loading: q.isLoading,
  };
}
