import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const API_BASE_URL = "http://localhost:5000";

const occasionOptions = ["casual", "work", "party", "wedding", "festive", "sports", "travel"];
const venueOptions = ["indoor", "outdoor", "beach", "city", "countryside", "rooftop", "garden", "club"];
const crowdOptions = ["intimate", "social", "professional", "festive", "family", "friends"];
const colorOptions = ["black", "white", "red", "blue", "green", "yellow", "pink", "beige", "brown", "purple"];

const slotLabels = {
  dress: "Dress",
  jumpsuit: "Jumpsuit",
  top: "Top",
  bottom: "Bottom",
  jacket: "Jacket",
};

function OutfitRecommendation({ user }) {
  const [occasion, setOccasion] = useState("casual");
  const [venueType, setVenueType] = useState("outdoor");
  const [crowdType, setCrowdType] = useState("intimate");
  const [colorPreference, setColorPreference] = useState([]);
  const [customColorHex, setCustomColorHex] = useState("");
  const [city, setCity] = useState("");

  const [weather, setWeather] = useState(null);
  const [outfit, setOutfit] = useState(null);
  const [reasoning, setReasoning] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const toggleColor = (color) => {
    setColorPreference((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const getRecommendation = async (temperature) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/recommend`, {
        userId: user.uid,
        temperature,
        occasion,
        venueType,
        crowdType,
        colorPreference,
        customColorHex: customColorHex || null,
      });

      if (res.data.message) {
        setInfoMessage(res.data.message);
        setOutfit(null);
      } else {
        setOutfit(res.data.outfit);
        setReasoning(res.data.reasoning);
        setInfoMessage("");
      }
    } catch (err) {
      console.error(err);
      setError("Could not generate a recommendation. Please try again.");
    }
  };

  const fetchWithCity = (cityName) => {
    axios
      .get(`${API_BASE_URL}/api/weather`, { params: { city: cityName } })
      .then(async (weatherRes) => {
        setWeather(weatherRes.data);
        await getRecommendation(weatherRes.data.temperature);
      })
      .catch(() => setError("Could not fetch weather for that city."))
      .finally(() => setLoading(false));
  };

  const handleGenerate = () => {
    setLoading(true);
    setError("");
    setInfoMessage("");
    setOutfit(null);
    setSaveMessage("");

    if (city.trim()) {
      fetchWithCity(city.trim());
    } else {
      setError("Please type your city name.");
      setLoading(false);
    }
  };

  const handleSaveOutfit = async () => {
    if (!outfit) return;
    setSaving(true);
    setSaveMessage("");
    try {
      await axios.post(`${API_BASE_URL}/api/saved-outfits`, {
        userId: user.uid,
        occasion,
        venueType,
        crowdType,
        city: weather?.city || city,
        temperature: weather?.temperature,
        outfit,
      });
      setSaveMessage("Outfit saved!");
    } catch (err) {
      console.error(err);
      setSaveMessage("Failed to save outfit.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: "750px", margin: "50px auto", textAlign: "center" }}>
      <h2>AI Outfit Recommendation</h2>
      <p>
        <Link to="/saved-outfits">View Saved Outfits</Link>
      </p>

      <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "15px", textAlign: "left", margin: "20px 0" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "10px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px" }}>Occasion</label>
            <select value={occasion} onChange={(e) => setOccasion(e.target.value)} style={{ padding: "6px" }}>
              {occasionOptions.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px" }}>Venue Type</label>
            <select value={venueType} onChange={(e) => setVenueType(e.target.value)} style={{ padding: "6px" }}>
              {venueOptions.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px" }}>Crowd Type</label>
            <select value={crowdType} onChange={(e) => setCrowdType(e.target.value)} style={{ padding: "6px" }}>
              {crowdOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px" }}>City / Weather</label>
            <input
              type="text"
              value={weather ? `${weather.city}: ${weather.temperature}°C, ${weather.description}` : city}
              onChange={(e) => {
                setCity(e.target.value);
                setWeather(null);
              }}
              placeholder="Type your city, e.g. Mumbai"
              style={{ padding: "6px", minWidth: "220px" }}
            />
          </div>
        </div>

        <label style={{ display: "block", fontSize: "12px", marginTop: "10px" }}>Color Preference (optional)</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", margin: "6px 0" }}>
          {colorOptions.map((color) => (
            <button
              type="button"
              key={color}
              onClick={() => toggleColor(color)}
              style={{
                padding: "4px 10px",
                borderRadius: "16px",
                fontSize: "12px",
                border: colorPreference.includes(color) ? "2px solid #333" : "1px solid #ccc",
                backgroundColor: colorPreference.includes(color) ? "#eee" : "#fff",
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {color}
            </button>
          ))}
        </div>

        <label style={{ display: "block", fontSize: "12px", marginTop: "8px" }}>Or pick a custom color</label>
        <input
          type="color"
          value={customColorHex || "#ffffff"}
          onChange={(e) => setCustomColorHex(e.target.value)}
          style={{ marginTop: "4px" }}
        />

        <div style={{ marginTop: "15px", textAlign: "center" }}>
          <button onClick={handleGenerate} disabled={loading} style={{ padding: "8px 20px" }}>
            {loading ? "Thinking..." : "Get Outfit"}
          </button>
        </div>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {infoMessage && <p>{infoMessage}</p>}

      {outfit && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: "15px",
              marginTop: "20px",
            }}
          >
            {Object.entries(outfit).map(([slot, item]) => (
              <div
                key={slot}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  padding: "10px",
                  textAlign: "left",
                }}
              >
                <p style={{ margin: "0 0 6px", fontWeight: "bold", fontSize: "13px", color: "#888" }}>
                  {slotLabels[slot] || slot}
                </p>
                <img
                  src={item.imageUrl}
                  alt={item.category}
                  style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "4px" }}
                />
                <p style={{ marginTop: "6px", textTransform: "capitalize" }}>{item.category}</p>
                {reasoning && reasoning[slot] && (
                  <ul style={{ fontSize: "11px", color: "#777", paddingLeft: "16px", margin: "4px 0 0" }}>
                    {reasoning[slot].map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          <button onClick={handleSaveOutfit} disabled={saving} style={{ padding: "10px 20px", marginTop: "20px" }}>
            {saving ? "Saving..." : "Save This Outfit"}
          </button>
          {saveMessage && <p style={{ fontSize: "13px", color: "#4444aa" }}>{saveMessage}</p>}
        </>
      )}
    </div>
  );
}

export default OutfitRecommendation;