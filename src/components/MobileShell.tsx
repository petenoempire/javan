import React, { ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Home, Compass, Heart, Mail, User } from "lucide-react";
import { useRegion } from "@/providers/RegionProvider";

interface MobileShellProps {
  children: ReactNode;
  showBack?: boolean;
}

export function MobileShell({ children, showBack = false }: MobileShellProps) {
  const navigate = useNavigate();
  const { theme } = useRegion();

  return (
    <div className={`flex flex-col min-h-screen text-white ${theme.backgroundClass}`}>
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">{children}</div>

      {/* Bottom Navigation */}
      <div
        className={`fixed bottom-0 left-0 right-0 max-w-[520px] mx-auto bg-black/80 backdrop-blur-md border-t border-white/5 ${theme.glow}`}
      >
        <div className="flex items-center justify-around h-16 px-2">
          <NavButton icon={Home} label="Home" path="/" accentClass={theme.accent} />
          <NavButton icon={Compass} label="Discover" path="/discover" accentClass={theme.accent} />
          <NavButton icon={Heart} label="Likes" path="/notifications" accentClass={theme.accent} />
          <NavButton icon={Mail} label="Messages" path="/inbox" accentClass={theme.accent} />
          <NavButton icon={User} label="Profile" path="/profile" accentClass={theme.accent} />
        </div>
      </div>
    </div>
  );
}

function NavButton({
  icon: Icon,
  label,
  path,
  accentClass,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  accentClass: string;
}) {
  const navigate = useNavigate();
  const [isActive, setIsActive] = React.useState(false);

  return (
    <button
      onClick={() => navigate({ to: path })}
      onTouchStart={() => setIsActive(true)}
      onTouchEnd={() => setIsActive(false)}
      className={`flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/10 active:scale-90 transition-all ${
        isActive ? accentClass : "text-white"
      }`}
      title={label}
    >
      <Icon className="h-5 w-5" />
      <span className="text-[9px] font-bold uppercase">{label}</span>
    </button>
  );
}
