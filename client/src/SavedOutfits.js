import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import BottomNav from "./BottomNav";


const slotLabels = {
  dress: "Dress",
  top: "Top",
  bottom: "Bottom",
  shoes: "Shoes",
  accessory: "Accessory",
};
const API_BASE_URL = "http://localhost:5000";

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Loading saved outfits...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 pt-8 pb-24">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-3">
          <Link
            to="/recommend"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Saved Outfits</h1>
        </div>

        {outfits.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            No saved outfits yet. Generate a recommendation and click "Save This Outfit"!
          </p>
        ) : (
          <div className="mt-6 space-y-5">
            {outfits.map((saved) => (
              <div key={saved._id} className="rounded-lg bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    <strong className="capitalize text-foreground">{saved.occasion}</strong> ·{" "}
                    {saved.venueType} · {saved.crowdType} · {saved.city} ({saved.temperature}°C)
                  </p>
                  <button
                    onClick={() => handleDelete(saved._id)}
                    className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {Object.entries(saved.outfit || {}).map(([slot, item]) => (
                    <div key={slot} className="rounded-md border border-border p-2">
                      <p className="mb-1 text-xs text-muted-foreground">{slotLabels[slot] || slot}</p>
                      <img
                        src={item.imageUrl}
                        alt={item.category}
                        className="h-28 w-full rounded object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default SavedOutfits;