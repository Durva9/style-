import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Shirt, Sparkles, Camera, BarChart3, Settings } from "lucide-react";

const navItems = [
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/wardrobe", icon: Shirt, label: "Wardrobe" },
  { to: "/recommend", icon: Sparkles, label: "Outfits" },
  { to: "/try-on", icon: Camera, label: "Try-On" },
  { to: "/analytics", icon: BarChart3, label: "Insights" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] transition-colors ${
                isActive ? "text-primary font-semibold" : "text-muted-foreground"
              }`
            }
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}