import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import { User, Camera, LogOut } from "lucide-react";
import { Button } from "./components/ui/button";
import BottomNav from "./BottomNav";

const settingsLinks = [
  { to: "/profile", label: "Edit My Style Profile", icon: User },
  { to: "/analysis", label: "Redo Body Type & Skin Tone Analysis", icon: Camera },
];

function Settings() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background px-6 pt-8 pb-24">
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your preferences</p>

        <div className="mt-6 overflow-hidden rounded-lg bg-card shadow-sm">
          {settingsLinks.map(({ to, label, icon: Icon }, idx) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-4 py-4 text-sm font-medium text-foreground transition-colors hover:bg-muted ${
                idx !== settingsLinks.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
                <Icon className="h-4 w-4 text-accent-foreground" />
              </div>
              {label}
            </Link>
          ))}
        </div>

        <Button
          variant="outline"
          className="mt-6 w-full gap-2 rounded-full text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}

export default Settings;