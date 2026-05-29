// Gift catalog — static product catalog, not user data.
export type Gift = { id: string; name: string; icon: string; cost: number; tier: "common" | "rare" | "legendary" };
export const gifts: Gift[] = [
  { id: "rose", name: "Rose", icon: "🌹", cost: 5, tier: "common" },
  { id: "heart", name: "Heart", icon: "💖", cost: 10, tier: "common" },
  { id: "star", name: "Star", icon: "⭐", cost: 25, tier: "common" },
  { id: "crown", name: "Crown", icon: "👑", cost: 100, tier: "rare" },
  { id: "rocket", name: "Rocket", icon: "🚀", cost: 250, tier: "rare" },
  { id: "diamond", name: "Diamond", icon: "💎", cost: 500, tier: "legendary" },
  { id: "yacht", name: "Yacht", icon: "🛥️", cost: 2000, tier: "legendary" },
  { id: "galaxy", name: "Galaxy", icon: "🌌", cost: 5000, tier: "legendary" },
];
