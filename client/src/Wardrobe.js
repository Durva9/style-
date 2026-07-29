import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

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

  const handleMarkWorn = async (itemId) => {
  try {
    const res = await axios.put(`${API_BASE_URL}/api/items/item/${itemId}/wear`);
    setItems((prev) =>
      prev.map((item) => (item._id === itemId ? res.data : item))
    );
  } catch (err) {
    console.error(err);
    alert("Failed to mark as worn.");
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

  if (loading) return <p style={{ textAlign: "center" }}>Loading your wardrobe...</p>;

  return (
    <div style={{ maxWidth: "900px", margin: "50px auto", textAlign: "center" }}>
      <h2>My Wardrobe</h2>
<Link to="/add-item">+ Add New Item</Link>
{" | "}
<Link to="/analytics">View Wardrobe Analytics</Link>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {items.length === 0 ? (
        <p>Your wardrobe is empty. Start adding items!</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "15px",
            marginTop: "20px",
          }}
        >
          {items.map((item) => (
            <div
              key={item._id}
              style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "10px",
              }}
            >
              <img
                src={item.imageUrl}
                alt={item.category}
                style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "4px" }}
              />

              {editingItemId === item._id ? (
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  style={{ width: "100%", margin: "8px 0", padding: "4px" }}
                >
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              ) : (
                <p style={{ marginTop: "8px", textTransform: "capitalize" }}>{item.category}</p>
              )}

              {item.colors && item.colors.length > 0 && (
                <div style={{ display: "flex", justifyContent: "center", gap: "4px", marginTop: "6px" }}>
                  {item.colors.slice(0, 5).map((color, idx) => (
                    <div
                      key={idx}
                      title={`${color.hex} (${color.percentage}%)`}
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        backgroundColor: color.hex,
                        border: "1px solid #999",
                      }}
                    />
                  ))}
                </div>
              )}

              {item.wornCount > 0 && (
  <p style={{ fontSize: "11px", color: "#888", margin: "4px 0 0" }}>
    Worn {item.wornCount} time{item.wornCount !== 1 ? "s" : ""}
  </p>
)}

              <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "10px" }}>
                {editingItemId === item._id ? (
                  <>
                    <button onClick={() => saveEdit(item._id)} style={{ fontSize: "12px", padding: "4px 8px" }}>
                      Save
                    </button>
                    <button onClick={cancelEdit} style={{ fontSize: "12px", padding: "4px 8px" }}>
                      Cancel
                    </button>
                  </>
                ) : (
  <>
    <button onClick={() => startEdit(item)} style={{ fontSize: "12px", padding: "4px 8px" }}>
      Edit
    </button>
    <button
      onClick={() => handleDelete(item._id)}
      style={{ fontSize: "12px", padding: "4px 8px", color: "red" }}
    >
      Delete
    </button>
  </>
)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Wardrobe;