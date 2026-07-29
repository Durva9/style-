import React from "react";
import { Link } from "react-router-dom";

function Settings() {
  return (
    <div style={{ maxWidth: "500px", margin: "50px auto", textAlign: "center" }}>
      <h2>Settings</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "30px" }}>
        <Link to="/profile">Edit My Style Profile</Link>
        <Link to="/analysis">Redo Body Type & Skin Tone Analysis</Link>
        <Link to="/dashboard">Back to Dashboard</Link>
      </div>
    </div>
  );
}

export default Settings;