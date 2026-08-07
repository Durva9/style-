import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "./components/ui/button";
import BottomNav from "./BottomNav";

const API_BASE_URL = "http://localhost:5000";

const categoryOptions = ["shirt", "tshirt", "jeans", "dress"];

function Wardrobe({ user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingItemId, setEditingItemId] = useState(null);
  const [editCategory, setEditCategory] = useState("");

  const fetchItems = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/items/${user.uid}`);
      setItems(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load wardrobe items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [user]);

  const handleDelete = async (itemId) => {
    const confirmed = window.confirm("Delete this item? This cannot be undone.");
    if (!confirmed) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/items/item/${itemId}`);
      setItems((prev) => prev.filter((item) => item._id !== itemId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete item.");
    }
  };

  const startEdit = (item) => {
    setEditingItemId(item._id);
    setEditCategory(item.category);
  };

  const cancelEdit = () => {
    setEditingItemId(null);
    setEditCategory("");
  };

  const saveEdit = async (itemId) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/api/items/item/${itemId}`, {
        category: editCategory,
      });
      setItems((prev) =>
        prev.map((item) => (item._id === itemId ? res.data : item))
      );
      setEditingItemId(null);
      setEditCategory("");
    } catch (err) {
      console.error(err);
      alert("Failed to update item.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Loading your wardrobe...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 pt-8 pb-24">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-foreground">My Wardrobe</h1>
          <div className="flex gap-2">
            <Button asChild size="sm" className="gap-1.5 rounded-full">
              <Link to="/add-item">
                <Plus className="h-3.5 w-3.5" /> Add Item
              </Link>
            </Button>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        {items.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Your wardrobe is empty. Start adding items!
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {items.map((item) => (
              <div key={item._id} className="rounded-lg bg-card p-3 shadow-sm">
                <img
                  src={item.imageUrl}
                  alt={item.category}
                  className="h-36 w-full rounded-md object-cover"
                />

                {editingItemId === item._id ? (
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="mt-2 w-full rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat} className="capitalize">
                        {cat}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="mt-2 text-sm capitalize text-foreground">{item.category}</p>
                )}

                {item.colors && item.colors.length > 0 && (
                  <div className="mt-1.5 flex justify-center gap-1">
                    {item.colors.slice(0, 5).map((color, idx) => (
                      <div
                        key={idx}
                        title={`${color.hex} (${color.percentage}%)`}
                        className="h-[18px] w-[18px] rounded-full border border-border"
                        style={{ backgroundColor: color.hex }}
                      />
                    ))}
                  </div>
                )}

                {item.wornCount > 0 && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Worn {item.wornCount} time{item.wornCount !== 1 ? "s" : ""}
                  </p>
                )}

                <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
                  {editingItemId === item._id ? (
                    <>
                      <button
                        onClick={() => saveEdit(item._id)}
                        className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="rounded-full border border-input px-2.5 py-1 text-[11px] text-foreground hover:bg-muted"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(item)}
                        className="flex items-center gap-1 rounded-full border border-input px-2.5 py-1 text-[11px] text-foreground hover:bg-muted"
                      >
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="flex items-center gap-1 rounded-full border border-input px-2.5 py-1 text-[11px] text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </>
                  )}
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

export default Wardrobe;