import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000";

const slotLabels = {
  dress: "Dress",
  top: "Top",
  bottom: "Bottom",
  shoes: "Shoes",
  accessory: "Accessory",
};

function SavedOutfits({ user }) {
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOutfits = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/saved-outfits/${user.uid}`);
      setOutfits(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutfits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Delete this saved outfit?");
    if (!confirmed) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/saved-outfits/${id}`);
      setOutfits((prev) => prev.filter((o) => o._id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete.");
    }
  };

  if (loading) return <p style={{ textAlign: "center" }}>Loading saved outfits...</p>;

  return (
    <div style={{ maxWidth: "900px", margin: "50px auto", textAlign: "center" }}>
      <h2>Saved Outfits</h2>

      {outfits.length === 0 ? (
        <p>No saved outfits yet. Generate a recommendation and click "Save This Outfit"!</p>
      ) : (
        outfits.map((saved) => (
          <div
            key={saved._id}
            style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "15px", margin: "20px 0", textAlign: "left" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: "13px", color: "#666", margin: 0 }}>
                <strong style={{ textTransform: "capitalize" }}>{saved.occasion}</strong> · {saved.venueType} · {saved.crowdType} · {saved.city} ({saved.temperature}°C)
              </p>
              <button onClick={() => handleDelete(saved._id)} style={{ fontSize: "12px", color: "red", padding: "4px 8px" }}>
                Delete
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: "12px",
                marginTop: "12px",
              }}
            >
              {Object.entries(saved.outfit || {}).map(([slot, item]) => (
                <div key={slot} style={{ border: "1px solid #eee", borderRadius: "6px", padding: "8px" }}>
                  <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#888" }}>{slotLabels[slot] || slot}</p>
                  <img
                    src={item.imageUrl}
                    alt={item.category}
                    style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "4px" }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default SavedOutfits;