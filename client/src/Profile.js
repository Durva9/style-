import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "./components/ui/button";
import { Label } from "./components/ui/label";
import { Input } from "./components/ui/input";

const API_BASE_URL = "http://localhost:5000";

const selectClass =
  "block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

function Profile({ user, onboarding }) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [fashionStyle, setFashionStyle] = useState("");
  const [preferredColors, setPreferredColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const colorOptions = ["black", "white", "red", "blue", "green", "yellow", "pink", "beige", "brown", "purple"];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/profile/${user.uid}`);
        const data = res.data;
        setName(data.name || "");
        setGender(data.gender || "");
        setFashionStyle(data.fashionStyle || "");
        setPreferredColors(data.preferredColors || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const toggleColor = (color) => {
    setPreferredColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setMessage("Please enter your name to continue.");
      return;
    }
    if (!gender) {
      setMessage("Please select your gender to continue.");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      await axios.put(`${API_BASE_URL}/api/profile/${user.uid}`, {
        name: name.trim(),
        gender,
        fashionStyle,
        preferredColors,
      });

      if (onboarding) {
        navigate("/onboarding/analysis");
      } else {
        setMessage("Profile saved successfully!");
      }
    } catch (err) {
      console.error(err);
      setMessage("Failed to save profile: " + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 pt-8 pb-24">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center gap-3">
          {!onboarding && (
            <Link
              to="/settings"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          )}
          <h1 className="text-2xl font-bold text-foreground">My Style Profile</h1>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="rounded-lg"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="gender">Gender *</Label>
            <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)} className={selectClass}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-binary</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fashion-style">Fashion Style</Label>
            <select
              id="fashion-style"
              value={fashionStyle}
              onChange={(e) => setFashionStyle(e.target.value)}
              className={selectClass}
            >
              <option value="">Select</option>
              <option value="casual">Casual</option>
              <option value="formal">Formal</option>
              <option value="streetwear">Streetwear</option>
              <option value="ethnic">Ethnic</option>
              <option value="minimalist">Minimalist</option>
              <option value="bohemian">Bohemian</option>
            </select>
          </div>

          <div>
            <Label>Preferred Colors</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  type="button"
                  key={color}
                  onClick={() => toggleColor(color)}
                  className={`rounded-full px-3 py-1.5 text-xs capitalize transition-colors ${
                    preferredColors.includes(color)
                      ? "border-2 border-foreground bg-muted font-semibold"
                      : "border border-input bg-background hover:bg-muted"
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={saving} className="w-full rounded-full">
            {saving ? "Saving..." : onboarding ? "Continue" : "Save Profile"}
          </Button>
        </form>

        {message && <p className="mt-3 text-center text-sm text-muted-foreground">{message}</p>}
      </div>
    </div>
  );
}

export default Profile;