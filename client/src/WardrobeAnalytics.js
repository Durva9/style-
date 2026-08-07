import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import BottomNav from "./BottomNav";


function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.substring(0, 2), 16),
    parseInt(clean.substring(2, 4), 16),
    parseInt(clean.substring(4, 6), 16),
  ];
}
const API_BASE_URL = "http://localhost:5000";

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return [h, s, v];
}

function nearestColorName(hex) {
  const [r, g, b] = hexToRgb(hex);
  const [h, s, v] = rgbToHsv(r, g, b);

  if (s < 0.12) {
    if (v > 0.9) return "White";
    if (v < 0.2) return "Black";
    return "Gray";
  }

  if (s < 0.35 && v > 0.5 && h >= 20 && h <= 60) {
    return v > 0.75 ? "Beige" : "Brown";
  }
  if (s >= 0.35 && v < 0.5 && h >= 15 && h <= 45) {
    return "Brown";
  }

  if (h < 15 || h >= 345) return "Red";
  if (h < 45) return "Orange";
  if (h < 65) return "Yellow";
  if (h < 170) return "Green";
  if (h < 200) return "Cyan";
  if (h < 260) return "Blue";
  if (h < 290) return "Purple";
  if (h < 345) return "Pink";

  return "Color";
}

function buildDonutGradient(slices) {
  let cumulative = 0;
  const parts = slices.map((s) => {
    const start = cumulative;
    cumulative += s.percentage;
    return `${s.hex} ${start}% ${cumulative}%`;
  });
  return `conic-gradient(${parts.join(", ")})`;
}

function WardrobeAnalytics({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedYear, setSelectedYear] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/wardrobe-analytics/${user.uid}`);
        setData(res.data);

        const years = Array.from(
          new Set(res.data.growthTimeline.map((g) => g.month.split("-")[0]))
        ).sort();
        if (years.length > 0) {
          setSelectedYear(years[years.length - 1]);
        } else {
          setSelectedYear(String(new Date().getFullYear()));
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load analytics.");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [user]);

  const availableYears = useMemo(() => {
    if (!data) return [];
    const years = Array.from(new Set(data.growthTimeline.map((g) => g.month.split("-")[0])));
    return years.sort();
  }, [data]);

  const monthsForSelectedYear = useMemo(() => {
    if (!data || !selectedYear) return [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const lookup = {};
    data.growthTimeline.forEach((g) => {
      if (g.month.startsWith(selectedYear)) {
        const monthIndex = parseInt(g.month.split("-")[1], 10) - 1;
        lookup[monthIndex] = g.count;
      }
    });
    return monthNames.map((name, i) => ({ name, count: lookup[i] || 0 }));
  }, [data, selectedYear]);

  const colorDonutData = useMemo(() => {
    if (!data || data.favoriteColors.length === 0) return [];
    const top5 = data.favoriteColors.slice(0, 5);
    const total = top5.reduce((sum, c) => sum + c.count, 0);
    return top5.map((c) => ({
      hex: c.hex,
      count: c.count,
      percentage: total > 0 ? Math.round((c.count / total) * 1000) / 10 : 0,
    }));
  }, [data]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Loading your wardrobe analytics...
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-destructive">
        {error}
      </div>
    );
  }
  if (!data) return null;

  const maxCategoryCount = Math.max(...Object.values(data.categoryCounts), 1);
  const maxMonthCount = Math.max(...monthsForSelectedYear.map((m) => m.count), 1);
  const maxOccasionCount = Math.max(...Object.values(data.occasionCounts), 1);

  return (
    <div className="min-h-screen bg-background px-6 pt-8 pb-24">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-foreground">Wardrobe Analytics</h1>

        {/* Top stats */}
        <div className="mt-6 flex justify-center gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-foreground">{data.totalItems}</div>
            <div className="text-xs text-muted-foreground">Total Items</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-foreground">{data.savedOutfitsCount}</div>
            <div className="text-xs text-muted-foreground">Saved Outfits</div>
          </div>
        </div>

        {/* Colors donut chart */}
        <section className="mt-8 rounded-lg bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Colors in Your Wardrobe</h2>
          {colorDonutData.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No color data yet.</p>
          ) : (
            <div className="mt-4 flex flex-wrap items-center gap-6">
              <div
                className="relative h-40 w-40 flex-shrink-0 rounded-full"
                style={{ background: buildDonutGradient(colorDonutData) }}
              >
                <div className="absolute left-1/2 top-1/2 h-[90px] w-[90px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-card" />
              </div>
              <div>
                {colorDonutData.map((c, i) => (
                  <div key={i} className="mb-1.5 flex items-center gap-2">
                    <div
                      className="h-3.5 w-3.5 rounded-full border border-border"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="text-sm text-foreground">
                      {nearestColorName(c.hex)} — {c.percentage}% ({c.count} item{c.count !== 1 ? "s" : ""})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Category breakdown */}
        <section className="mt-6 rounded-lg bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Category Breakdown</h2>
          <div className="mt-3 space-y-3">
            {Object.entries(data.categoryCounts).map(([cat, count]) => (
              <div key={cat}>
                <div className="mb-1 flex justify-between text-xs text-foreground">
                  <span className="capitalize">{cat}</span>
                  <span>{count}</span>
                </div>
                <div className="h-2.5 rounded bg-muted">
                  <div
                    className="h-full rounded bg-primary"
                    style={{ width: `${(count / maxCategoryCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Wardrobe growth - year selector + month bars */}
        <section className="mt-6 rounded-lg bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Wardrobe Growth</h2>
            {availableYears.length > 0 && (
              <select
                value={selectedYear || ""}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            )}
          </div>

          {availableYears.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <div className="mt-4 flex h-[100px] items-end gap-2">
              {monthsForSelectedYear.map((m) => (
                <div key={m.name} className="text-center">
                  <div
                    title={`${m.count} item${m.count !== 1 ? "s" : ""}`}
                    className={`mx-auto w-6 rounded-t-sm ${m.count > 0 ? "bg-primary" : "bg-muted"}`}
                    style={{ height: `${(m.count / maxMonthCount) * 80}px` }}
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground">{m.name}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Saved outfits by occasion */}
        <section className="mt-6 rounded-lg bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Saved Outfits by Occasion</h2>
          {Object.keys(data.occasionCounts).length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No saved outfits yet.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {Object.entries(data.occasionCounts).map(([occ, count]) => (
                <div key={occ}>
                  <div className="mb-1 flex justify-between text-xs text-foreground">
                    <span className="capitalize">{occ}</span>
                    <span>{count}</span>
                  </div>
                  <div className="h-2.5 rounded bg-muted">
                    <div
                      className="h-full rounded bg-accent-foreground/70"
                      style={{ width: `${(count / maxOccasionCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <BottomNav />
    </div>
  );
}

export default WardrobeAnalytics;