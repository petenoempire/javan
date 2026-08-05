import { useEffect, useRef } from "react";
import type { StudioMode } from "@/lib/studio/types";

const MODES: { key: StudioMode; label: string }[] = [
  { key: "photo", label: "PHOTO" },
  { key: "15s", label: "15s" },
  { key: "60s", label: "60s" },
  { key: "3min", label: "3 MIN" },
  { key: "text", label: "TEXT" },
  { key: "template", label: "TEMPLATES" },
  { key: "live", label: "LIVE" },
];

export function ModeCarousel({
  value,
  onChange,
  disabled,
}: {
  value: StudioMode;
  onChange: (m: StudioMode) => void;
  disabled?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const el = itemRefs.current[value];
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [value]);

  const select = (m: StudioMode) => {
    if (disabled) return;
    if (m !== value && "vibrate" in navigator) navigator.vibrate?.(8);
    onChange(m);
  };

  return (
    <div className="relative w-full">
      <div
        ref={trackRef}
        className="no-scrollbar flex items-center gap-6 overflow-x-auto px-[42vw] py-2"
        role="tablist"
        aria-label="Capture mode"
      >
        {MODES.map((m) => (
          <button
            key={m.key}
            ref={(el) => {
              itemRefs.current[m.key] = el;
            }}
            role="tab"
            aria-selected={value === m.key}
            disabled={disabled}
            onClick={() => select(m.key)}
            className={`shrink-0 text-[11px] font-black uppercase tracking-[0.18em] transition-all active:scale-90 disabled:opacity-40 ${
              value === m.key ? "scale-110 text-white" : "text-white/45"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <span className="pointer-events-none absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-white" />
    </div>
  );
}
