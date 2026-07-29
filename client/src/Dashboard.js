import React from "react";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import { useNavigate, Link } from "react-router-dom";

function Dashboard({ user }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <div style={{ maxWidth: "500px", margin: "50px auto", textAlign: "center" }}>
      <h2>Welcome to your Style Vault Dashboard</h2>
      <p>Logged in as: {user?.email}</p>

      <div style={{ margin: "20px 0", lineHeight: "2" }}>
        <Link to="/add-item">Add Wardrobe Item</Link>
        {" | "}
        <Link to="/wardrobe">View My Wardrobe</Link>
        {" | "}
        <Link to="/recommend">Outfit Recommendation</Link>
        {" | "}
        <Link to="/saved-outfits">Saved Outfits</Link>
        {" | "}
        <Link to="/fit-advisor">Should You Buy It?</Link>
        {" | "}
        <Link to="/fit-ranking">Rank My Shopping Picks</Link>
        {" | "}
        <Link to="/settings">Settings</Link>
        {" | "}
        <Link to="/try-on">Virtual Try-On</Link>
      </div>

      <button onClick={handleLogout} style={{ padding: "10px 20px" }}>
        Logout
      </button>
    </div>
  );
}

export default Dashboard;