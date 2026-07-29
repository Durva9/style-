import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000";

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.substring(0, 2), 16),
    parseInt(clean.substring(2, 4), 16),
    parseInt(clean.substring(4, 6), 16),
  ];
}

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

  // Low saturation = grayscale family
  if (s < 0.12) {
    if (v > 0.9) return "White";
    if (v < 0.2) return "Black";
    return "Gray";
  }

  // Muted/desaturated warm tones = beige/brown family
  if (s < 0.35 && v > 0.5 && h >= 20 && h <= 60) {
    return v > 0.75 ? "Beige" : "Brown";
  }
  if (s >= 0.35 && v < 0.5 && h >= 15 && h <= 45) {
    return "Brown";
  }

  // Hue-based naming for saturated colors
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

  if (loading) return <p style={{ textAlign: "center" }}>Loading your wardrobe analytics...</p>;
  if (error) return <p style={{ textAlign: "center", color: "red" }}>{error}</p>;
  if (!data) return null;

  const maxCategoryCount = Math.max(...Object.values(data.categoryCounts), 1);
  const maxMonthCount = Math.max(...monthsForSelectedYear.map((m) => m.count), 1);
  const maxOccasionCount = Math.max(...Object.values(data.occasionCounts), 1);

  return (
    <div style={{ maxWidth: "800px", margin: "50px auto" }}>
      <h2 style={{ textAlign: "center" }}>Wardrobe Analytics</h2>

      <div style={{ display: "flex", justifyContent: "center", gap: "30px", margin: "25px 0", textAlign: "center" }}>
        <div>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>{data.totalItems}</div>
          <div style={{ fontSize: "12px", color: "#888" }}>Total Items</div>
        </div>
        <div>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>{data.savedOutfitsCount}</div>
          <div style={{ fontSize: "12px", color: "#888" }}>Saved Outfits</div>
        </div>
      </div>

      {/* Colors donut chart */}
      <section style={{ marginBottom: "35px" }}>
        <h3>Colors in Your Wardrobe</h3>
        {colorDonutData.length === 0 ? (
          <p style={{ color: "#888", fontSize: "14px" }}>No color data yet.</p>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "25px", flexWrap: "wrap" }}>
            <div
              style={{
                width: "160px",
                height: "160px",
                borderRadius: "50%",
                background: buildDonutGradient(colorDonutData),
                position: "relative",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "90px",
                  height: "90px",
                  borderRadius: "50%",
                  backgroundColor: "#fff",
                }}
              />
            </div>
            <div>
              {colorDonutData.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <div
                    style={{
                      width: "14px",
                      height: "14px",
                      borderRadius: "50%",
                      backgroundColor: c.hex,
                      border: "1px solid #999",
                    }}
                  />
                  <span style={{ fontSize: "13px" }}>
  {nearestColorName(c.hex)} — {c.percentage}% ({c.count} item{c.count !== 1 ? "s" : ""})
</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Category breakdown */}
      <section style={{ marginBottom: "30px" }}>
        <h3>Category Breakdown</h3>
        {Object.entries(data.categoryCounts).map(([cat, count]) => (
          <div key={cat} style={{ marginBottom: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "2px" }}>
              <span style={{ textTransform: "capitalize" }}>{cat}</span>
              <span>{count}</span>
            </div>
            <div style={{ backgroundColor: "#eee", borderRadius: "4px", height: "10px" }}>
              <div
                style={{
                  width: `${(count / maxCategoryCount) * 100}%`,
                  backgroundColor: "#6c63ff",
                  height: "100%",
                  borderRadius: "4px",
                }}
              />
            </div>
          </div>
        ))}
      </section>

      {/* Wardrobe growth - year selector + month bars */}
      <section style={{ marginBottom: "30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Wardrobe Growth</h3>
          {availableYears.length > 0 && (
            <select value={selectedYear || ""} onChange={(e) => setSelectedYear(e.target.value)} style={{ padding: "4px" }}>
              {availableYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}
        </div>

        {availableYears.length === 0 ? (
          <p style={{ color: "#888", fontSize: "14px" }}>No data yet.</p>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "100px", marginTop: "12px" }}>
            {monthsForSelectedYear.map((m) => (
              <div key={m.name} style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: "24px",
                    height: `${(m.count / maxMonthCount) * 80}px`,
                    backgroundColor: m.count > 0 ? "#6c63ff" : "#eee",
                    borderRadius: "3px 3px 0 0",
                    margin: "0 auto",
                  }}
                  title={`${m.count} item${m.count !== 1 ? "s" : ""}`}
                />
                <p style={{ fontSize: "10px", margin: "4px 0 0", color: "#888" }}>{m.name}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Saved outfits by occasion */}
      <section style={{ marginBottom: "30px" }}>
        <h3>Saved Outfits by Occasion</h3>
        {Object.keys(data.occasionCounts).length === 0 ? (
          <p style={{ color: "#888", fontSize: "14px" }}>No saved outfits yet.</p>
        ) : (
          Object.entries(data.occasionCounts).map(([occ, count]) => (
            <div key={occ} style={{ marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "2px" }}>
                <span style={{ textTransform: "capitalize" }}>{occ}</span>
                <span>{count}</span>
              </div>
              <div style={{ backgroundColor: "#eee", borderRadius: "4px", height: "10px" }}>
                <div
                  style={{
                    width: `${(count / maxOccasionCount) * 100}%`,
                    backgroundColor: "#ff8c69",
                    height: "100%",
                    borderRadius: "4px",
                  }}
                />
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

export default WardrobeAnalytics;