import { createContext, useContext, useMemo, ReactNode } from "react";
import { useAuth } from "@/lib/auth";

export type Region = "NG" | "GB" | "US" | "GLOBAL";

interface RegionTheme {
  region: Region;
  gradientFrom: string;
  gradientTo: string;
  accent: string;
  glow: string;
  backgroundClass: string;
  label: string;
}

interface RegionFeatures {
  showLocalTrendingCharts: boolean;
  showUkContentHub: boolean;
  showUsPremiumTools: boolean;
  showNgCreatorSuite: boolean;
  payoutMultiplier: number;
}

interface RegionContextValue {
  theme: RegionTheme;
  features: RegionFeatures;
}

const REGION_THEMES: Record<Region, RegionTheme> = {
  GB: {
    region: "GB",
    gradientFrom: "from-blue-700",
    gradientTo: "to-red-600",
    accent: "text-blue-400",
    glow: "shadow-[0_0_24px_rgba(59,130,246,0.35)]",
    backgroundClass: "bg-gradient-to-b from-blue-950/40 via-background to-red-950/20",
    label: "United Kingdom",
  },
  US: {
    region: "US",
    gradientFrom: "from-blue-600",
    gradientTo: "to-red-500",
    accent: "text-red-400",
    glow: "shadow-[0_0_24px_rgba(239,68,68,0.3)]",
    backgroundClass: "bg-gradient-to-b from-blue-950/30 via-background to-neutral-950",
    label: "United States",
  },
  NG: {
    region: "NG",
    gradientFrom: "from-emerald-500",
    gradientTo: "to-teal-400",
    accent: "text-emerald-400",
    glow: "shadow-[0_0_32px_rgba(16,185,129,0.45)]",
    backgroundClass: "bg-gradient-to-b from-emerald-950/40 via-background to-teal-950/20",
    label: "Nigeria",
  },
  GLOBAL: {
    region: "GLOBAL",
    gradientFrom: "from-fuchsia-600",
    gradientTo: "to-rose-600",
    accent: "text-fuchsia-400",
    glow: "shadow-glow",
    backgroundClass: "bg-background",
    label: "Global",
  },
};

const REGION_FEATURES: Record<Region, RegionFeatures> = {
  GB: {
    showLocalTrendingCharts: true,
    showUkContentHub: true,
    showUsPremiumTools: false,
    showNgCreatorSuite: false,
    payoutMultiplier: 1,
  },
  US: {
    showLocalTrendingCharts: false,
    showUkContentHub: false,
    showUsPremiumTools: true,
    showNgCreatorSuite: false,
    payoutMultiplier: 1,
  },
  NG: {
    showLocalTrendingCharts: false,
    showUkContentHub: false,
    showUsPremiumTools: false,
    showNgCreatorSuite: true,
    payoutMultiplier: 1.25,
  },
  GLOBAL: {
    showLocalTrendingCharts: false,
    showUkContentHub: false,
    showUsPremiumTools: false,
    showNgCreatorSuite: false,
    payoutMultiplier: 1,
  },
};

const RegionContext = createContext<RegionContextValue | null>(null);

export function RegionProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();

  const region: Region = (profile as any)?.region ?? "GLOBAL";

  const value = useMemo<RegionContextValue>(
    () => ({
      theme: REGION_THEMES[region] ?? REGION_THEMES.GLOBAL,
      features: REGION_FEATURES[region] ?? REGION_FEATURES.GLOBAL,
    }),
    [region]
  );

  return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>;
}

export function useRegion(): RegionContextValue {
  const ctx = useContext(RegionContext);
  if (!ctx) {
    throw new Error("useRegion must be used within a RegionProvider");
  }
  return ctx;
}
