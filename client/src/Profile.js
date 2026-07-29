import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const API_BASE_URL = "http://localhost:5000";

function Profile({ user, onboarding }) {
  const [gender, setGender] = useState("");
  const [fashionStyle, setFashionStyle] = useState("");
  const [preferredColors, setPreferredColors] = useState([]);
  const [occasionPreferences, setOccasionPreferences] = useState([]);
  const [bodyType, setBodyType] = useState("");
  const [skinTone, setSkinTone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const colorOptions = ["black", "white", "red", "blue", "green", "yellow", "pink", "beige", "brown", "purple"];
  const occasionOptions = ["casual", "work", "party", "wedding", "festive", "sports", "travel"];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/profile/${user.uid}`);
        const data = res.data;
        setGender(data.gender || "");
        setFashionStyle(data.fashionStyle || "");
        setPreferredColors(data.preferredColors || []);
        setOccasionPreferences(data.occasionPreferences || []);
        setBodyType(data.bodyType || "");
        setSkinTone(data.skinTone || "");
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

  const toggleOccasion = (occasion) => {
    setOccasionPreferences((prev) =>
      prev.includes(occasion) ? prev.filter((o) => o !== occasion) : [...prev, occasion]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await axios.put(`${API_BASE_URL}/api/profile/${user.uid}`, {
        gender,
        fashionStyle,
        preferredColors,
        occasionPreferences,
        bodyType,
        skinTone,
      });

      if (onboarding) {
        navigate("/onboarding/analysis");
      } else {
        setMessage("Profile saved successfully!");
      }
    } catch (err) {
      console.error(err);
      setMessage("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p style={{ textAlign: "center" }}>Loading profile...</p>;

  return (
    <div style={{ maxWidth: "500px", margin: "50px auto" }}>
      <h2 style={{ textAlign: "center" }}>My Style Profile</h2>

      {/* Read-only Body Type / Skin Tone summary, synced from Analysis page */}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "12px",
          margin: "0 0 20px",
          fontSize: "14px",
        }}
      >
        <p style={{ margin: "0 0 6px" }}>
          <strong>Skin Tone:</strong> <span style={{ textTransform: "capitalize" }}>{skinTone || "Not set"}</span>
        </p>
        <p style={{ margin: 0 }}>
          <strong>Body Type:</strong> <span style={{ textTransform: "capitalize" }}>{bodyType || "Not set"}</span>
        </p>
        <p style={{ margin: "8px 0 0", fontSize: "12px" }}>
          {onboarding ? (
            "You'll set these on the next step."
          ) : (
            <Link to="/analysis">Redo Body Type & Skin Tone Analysis</Link>
          )}
        </p>
      </div>

      <form onSubmit={handleSave}>

        <label>Gender</label>
        <select value={gender} onChange={(e) => setGender(e.target.value)} style={{ display: "block", width: "100%", margin: "8px 0 16px", padding: "8px" }}>
          <option value="">Select</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="non-binary">Non-binary</option>
          <option value="prefer-not-to-say">Prefer not to say</option>
        </select>

        <label>Fashion Style</label>
        <select value={fashionStyle} onChange={(e) => setFashionStyle(e.target.value)} style={{ display: "block", width: "100%", margin: "8px 0 16px", padding: "8px" }}>
          <option value="">Select</option>
          <option value="casual">Casual</option>
          <option value="formal">Formal</option>
          <option value="streetwear">Streetwear</option>
          <option value="ethnic">Ethnic</option>
          <option value="minimalist">Minimalist</option>
          <option value="bohemian">Bohemian</option>
        </select>

        <label>Preferred Colors</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", margin: "8px 0 16px" }}>
          {colorOptions.map((color) => (
            <button
              type="button"
              key={color}
              onClick={() => toggleColor(color)}
              style={{
                padding: "6px 12px",
                borderRadius: "20px",
                border: preferredColors.includes(color) ? "2px solid #333" : "1px solid #ccc",
                backgroundColor: preferredColors.includes(color) ? "#eee" : "#fff",
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {color}
            </button>
          ))}
        </div>

        <label>Occasion Preferences</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", margin: "8px 0 16px" }}>
          {occasionOptions.map((occasion) => (
            <button
              type="button"
              key={occasion}
              onClick={() => toggleOccasion(occasion)}
              style={{
                padding: "6px 12px",
                borderRadius: "20px",
                border: occasionPreferences.includes(occasion) ? "2px solid #333" : "1px solid #ccc",
                backgroundColor: occasionPreferences.includes(occasion) ? "#eee" : "#fff",
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {occasion}
            </button>
          ))}
        </div>

        <button type="submit" disabled={saving} style={{ width: "100%", padding: "10px", marginTop: "10px" }}>
          {saving ? "Saving..." : onboarding ? "Continue" : "Save Profile"}
        </button>
      </form>

      {message && <p style={{ textAlign: "center" }}>{message}</p>}
    </div>
  );
}

export default Profile;