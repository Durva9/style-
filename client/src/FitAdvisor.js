import React, { useState } from "react";
import axios from "axios";

const CLOUD_NAME = "hb85nhr5";
const UPLOAD_PRESET = "stylevault_wardrobe";
const API_BASE_URL = "http://localhost:5000";

function FitAdvisor({ user }) {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploadType, setUploadType] = useState("garment");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError("");
    }
  };

  const handleAnalyze = async () => {
    if (!image) {
      setError("Please select an image first.");
      return;
    }

    setAnalyzing(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", image);
      formData.append("upload_preset", UPLOAD_PRESET);

      const cloudinaryRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        formData
      );
      const imageUrl = cloudinaryRes.data.secure_url;

      const res = await axios.post(`${API_BASE_URL}/api/fit-advisor`, {
        userId: user.uid,
        imageUrl,
      });

      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError("Something went wrong analyzing this item. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div style={{ maxWidth: "480px", margin: "50px auto", textAlign: "center" }}>
      <h2>Should You Buy It?</h2>
      <p style={{ fontSize: "13px", color: "#666" }}>
        Upload a photo of the item, or a photo of yourself wearing it — we'll check it against your style profile.
      </p>

      <div style={{ margin: "15px 0" }}>
        <label style={{ marginRight: "15px" }}>
          <input
            type="radio"
            checked={uploadType === "garment"}
            onChange={() => setUploadType("garment")}
          />{" "}
          Just the item
        </label>
        <label>
          <input
            type="radio"
            checked={uploadType === "wearing"}
            onChange={() => setUploadType("wearing")}
          />{" "}
          Me wearing it
        </label>
      </div>

      <input type="file" accept="image/*" onChange={handleImageChange} />

      {preview && (
        <div style={{ margin: "15px 0" }}>
          <img src={preview} alt="Preview" style={{ maxWidth: "220px", borderRadius: "6px" }} />
        </div>
      )}

      {image && (
        <button onClick={handleAnalyze} disabled={analyzing} style={{ width: "100%", padding: "10px" }}>
          {analyzing ? "Analyzing..." : "Check This Item"}
        </button>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {result && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            borderRadius: "8px",
            textAlign: "left",
            backgroundColor:
              result.score >= 7 ? "#e6f7e6" : result.score >= 5 ? "#fff4e5" : "#fde8e8",
          }}
        >
          <h3 style={{ margin: "0 0 8px" }}>{result.verdict}</h3>
          <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#555" }}>
            Detected: <strong style={{ textTransform: "capitalize" }}>{result.category || "unknown item"}</strong>
            {result.detectedColor && (
              <span>
                {" "}·{" "}
                <span
                  style={{
                    display: "inline-block",
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: result.detectedColor,
                    border: "1px solid #999",
                    verticalAlign: "middle",
                  }}
                />
              </span>
            )}
          </p>
          <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "14px" }}>
            {result.reasons.map((r, i) => (
              <li key={i} style={{ marginBottom: "4px" }}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default FitAdvisor;