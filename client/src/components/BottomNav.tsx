import React from "react";
import { Home, Compass, Plus, Inbox, User } from "lucide-react";
import { Link, useLocation } from "wouter";

export const BottomNav: React.FC = () => {
  const [pathname] = useLocation();

  const tabs = [
    { path: "/", label: "Home", icon: Home },
    { path: "/discover", label: "Discover", icon: Compass },
    { path: "/create", label: "Create", icon: Plus },
    { path: "/inbox", label: "Inbox", icon: Inbox },
    { path: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-black/80 backdrop-blur max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = pathname === tab.path;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.path}
              href={tab.path}
              className={`flex-1 flex flex-col items-center justify-center py-4 px-2 transition-colors ${
                isActive
                  ? "text-cyan-400"
                  : "text-white/50 hover:text-white"
              }`}
            >
              <Icon className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
