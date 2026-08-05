import { useState, useEffect } from "react";

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return null;
  });

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsDesktop(mql.matches);
    
    // In case the initial state was wrong or changed before effect
    setIsDesktop(mql.matches);
    
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isDesktop;
}
