import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Plus,
  Sparkles,
  Shirt,
  ThumbsUp,
  ListOrdered,
} from "lucide-react";
import { Button } from "./components/ui/button";
import BottomNav from "./BottomNav";

const API_BASE_URL = "http://localhost:5000";

const CLOTHING_CATEGORIES = ["shirt", "tshirt", "jeans", "dress"];

const moreLinks = [
  { to: "/fit-advisor", label: "Should You Buy It?", icon: ThumbsUp },
  { to: "/fit-ranking", label: "Rank My Shopping Picks", icon: ListOrdered },
];

function Dashboard({ user }) {
  const [clothesCount, setClothesCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [name, setName] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/items/${user.uid}`);
        const items = res.data;
        setClothesCount(items.filter((i) => CLOTHING_CATEGORIES.includes(i.category)).length);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingStats(false);
      }
    };
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/profile/${user.uid}`);
        setName(res.data.name || "");
      } catch (err) {
        console.error(err);
      }
    };
    if (user?.uid) {
      fetchStats();
      fetchProfile();
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-background px-6 pt-8 pb-24">
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-bold text-foreground">Hey {name || "there"}! 👋</h1>
        {!name && <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>}

        {/* Total Clothes */}
        <div className="mt-6 flex items-center gap-3 rounded-lg bg-card p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
            <Shirt className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Clothes</p>
            <p className="text-lg font-bold text-foreground">{loadingStats ? "…" : clothesCount}</p>
          </div>
        </div>

        {/* Primary actions */}
        <div className="mt-8 flex gap-3">
          <Button asChild className="flex-1 gap-2 rounded-full">
            <Link to="/add-item">
              <Plus className="h-4 w-4" /> Add Item
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1 gap-2 rounded-full">
            <Link to="/recommend">
              <Sparkles className="h-4 w-4" /> Generate Outfit
            </Link>
          </Button>
        </div>

        {/* Secondary features not on the bottom bar */}
        <p className="mt-8 mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          More
        </p>
        <div className="grid grid-cols-2 gap-3">
          {moreLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-2 rounded-lg bg-card p-4 text-center shadow-sm transition-colors hover:bg-muted"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent">
                <Icon className="h-4 w-4 text-accent-foreground" />
              </div>
              <p className="text-xs font-medium text-foreground">{label}</p>
            </Link>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

export default Dashboard;