import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Bookmark, RefreshCw } from "lucide-react";
import { Button } from "./components/ui/button";
import BottomNav from "./BottomNav";


const occasionOptions = ["casual", "work", "party", "wedding", "festive", "sports", "travel"];
const venueOptions = ["indoor", "outdoor", "beach", "city", "countryside", "rooftop", "garden", "club"];
const crowdOptions = ["intimate", "social", "professional", "festive", "family", "friends"];
const colorOptions = ["black", "white", "red", "blue", "green", "yellow", "pink", "beige", "brown", "purple"];
const API_BASE_URL = "http://localhost:5000";

const slotLabels = {
  dress: "Dress",
  jumpsuit: "Jumpsuit",
  top: "Top",
  bottom: "Bottom",
  jacket: "Jacket",
};

const selectClass =
  "rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

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
  const [excludeIds, setExcludeIds] = useState([]);
  const [regenerating, setRegenerating] = useState(false);
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

  const getRecommendation = async (temperature, excludeList = []) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/recommend`, {
        userId: user.uid,
        temperature,
        occasion,
        venueType,
        crowdType,
        colorPreference,
        customColorHex: customColorHex || null,
        excludeIds: excludeList,
      });

      if (res.data.message) {
        setInfoMessage(res.data.message);
        setOutfit(null);
      } else {
        setOutfit(res.data.outfit);
        setReasoning(res.data.reasoning);
        setExcludeIds(res.data.usedIds || []);
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

  const handleRegenerate = async () => {
    if (!weather) return;
    setRegenerating(true);
    setError("");
    try {
      await getRecommendation(weather.temperature, excludeIds);
    } finally {
      setRegenerating(false);
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
    <div className="min-h-screen bg-background px-6 pt-8 pb-24">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Generate Outfit</h1>
            <p className="mt-1 text-sm text-muted-foreground">Tell us the occasion, we'll style it</p>
          </div>
          <Link
            to="/saved-outfits"
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
          >
            <Bookmark className="h-3.5 w-3.5" />
            Saved Outfits
          </Link>
        </div>

        <div className="mt-6 space-y-4 rounded-lg bg-card p-5 shadow-sm">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Occasion</label>
              <select value={occasion} onChange={(e) => setOccasion(e.target.value)} className={`${selectClass} w-full`}>
                {occasionOptions.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Venue Type</label>
              <select value={venueType} onChange={(e) => setVenueType(e.target.value)} className={`${selectClass} w-full`}>
                {venueOptions.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Crowd Type</label>
              <select value={crowdType} onChange={(e) => setCrowdType(e.target.value)} className={`${selectClass} w-full`}>
                {crowdOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">City / Weather</label>
              <input
                type="text"
                value={weather ? `${weather.city}: ${weather.temperature}°C` : city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setWeather(null);
                }}
                placeholder="e.g. Mumbai"
                className={`${selectClass} w-full`}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Color Preference (optional)</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  type="button"
                  key={color}
                  onClick={() => toggleColor(color)}
                  className={`rounded-full px-3 py-1 text-xs capitalize transition-colors ${
                    colorPreference.includes(color)
                      ? "border-2 border-foreground bg-muted font-semibold"
                      : "border border-input bg-background hover:bg-muted"
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-muted-foreground">Or pick a custom color</label>
            <input
              type="color"
              value={customColorHex || "#ffffff"}
              onChange={(e) => setCustomColorHex(e.target.value)}
              className="h-8 w-12 cursor-pointer rounded border border-input"
            />
          </div>

          <Button onClick={handleGenerate} disabled={loading} className="w-full rounded-full">
            {loading ? "Thinking..." : "Get Outfit"}
          </Button>
        </div>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        {infoMessage && <p className="mt-3 text-sm text-muted-foreground">{infoMessage}</p>}

        {outfit && (
          <>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {Object.entries(outfit).map(([slot, item]) => (
                <div key={slot} className="rounded-lg bg-card p-3 text-left shadow-sm">
                  <p className="mb-1.5 text-xs font-semibold text-muted-foreground">
                    {slotLabels[slot] || slot}
                  </p>
                  <img
                    src={item.imageUrl}
                    alt={item.category}
                    className="h-36 w-full rounded-md object-cover"
                  />
                  <p className="mt-1.5 text-sm capitalize text-foreground">{item.category}</p>
                  {reasoning && reasoning[slot] && (
                    <ul className="mt-1 list-disc pl-4 text-[11px] text-muted-foreground">
                      {reasoning[slot].map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={handleRegenerate}
                disabled={regenerating}
                className="gap-2 rounded-full"
              >
                <RefreshCw className="h-4 w-4" />
                {regenerating ? "Regenerating..." : "Regenerate"}
              </Button>
              <Button onClick={handleSaveOutfit} disabled={saving} className="rounded-full">
                {saving ? "Saving..." : "Save This Outfit"}
              </Button>
            </div>
            {saveMessage && (
              <p className="mt-2 text-center text-sm text-muted-foreground">{saveMessage}</p>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default OutfitRecommendation;