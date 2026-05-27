import { create } from "zustand";
import { persist } from "zustand/middleware";

type WalletStore = {
  coins: number;
  earned: number;
  topUp: (amount: number) => void;
  spend: (amount: number) => boolean;
  earn: (amount: number) => void;
};

export const useWallet = create<WalletStore>()(
  persist(
    (set, get) => ({
      coins: 1200,
      earned: 8420,
      topUp: (a) => set({ coins: get().coins + a }),
      spend: (a) => {
        if (get().coins < a) return false;
        set({ coins: get().coins - a });
        return true;
      },
      earn: (a) => set({ earned: get().earned + a }),
    }),
    { name: "admiralty-wallet" },
  ),
);
