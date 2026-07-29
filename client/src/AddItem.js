import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CLOUD_NAME = "hb85nhr5";
const UPLOAD_PRESET = "stylevault_wardrobe";
const API_BASE_URL = "http://localhost:5000";

const categoryOptions = ["shirt", "tshirt", "jeans", "dress"];

function classifyByFilename(filename) {
  const name = filename.toLowerCase();

  if (name.includes("tshirt") || name.includes("t-shirt") || name.includes("tee")) {
    return "tshirt";
  }
  if (name.includes("jean")) {
    return "jeans";
  }
  if (name.includes("dress")) {
    return "dress";
  }
  if (name.includes("shirt")) {
    return "shirt";
  }
  return null;
}

function AddItem({ user }) {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [category, setCategory] = useState("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setUploadedImageUrl(null);
      setSuggestion(null);
      setCategory("");
      setMessage("");
    }
  };

  const handleAnalyze = async () => {
    if (!image) {
      setMessage("Please select an image first.");
      return;
    }

    setAnalyzing(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", image);
      formData.append("upload_preset", UPLOAD_PRESET);

      const cloudinaryRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        formData
      );
      const imageUrl = cloudinaryRes.data.secure_url;
      setUploadedImageUrl(imageUrl);

      const filenameMatch = classifyByFilename(image.name);
let result;

if (filenameMatch) {
  result = {
    predictedCategory: filenameMatch,
    topPredictions: [{ label: filenameMatch, confidence: 100 }],
  };
} else {
  const classifyRes = await axios.post(`${API_BASE_URL}/api/items/classify`, {
    imageUrl,
  });
  result = classifyRes.data;
}

setSuggestion(result);
if (result.predictedCategory) {
  setCategory(result.predictedCategory);
}
    } catch (err) {
      console.error(err);
      setMessage("Analysis failed, but you can still pick a category manually.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!uploadedImageUrl) {
      setMessage("Please analyze the image first.");
      return;
    }
    if (!category) {
      setMessage("Please select a category.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await axios.post(`${API_BASE_URL}/api/items`, {
        userId: user.uid,
        imageUrl: uploadedImageUrl,
        category: category,
      });

      navigate("/wardrobe");
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong while saving. Check console for details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: "420px", margin: "50px auto", textAlign: "center" }}>
      <h2>Add Wardrobe Item</h2>

      <input type="file" accept="image/*" onChange={handleImageChange} />

      {preview && (
        <div style={{ margin: "15px 0" }}>
          <img src={preview} alt="Preview" style={{ maxWidth: "200px" }} />
        </div>
      )}

      {image && !uploadedImageUrl && (
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          style={{ width: "100%", padding: "10px", marginBottom: "15px" }}
        >
          {analyzing ? "Analyzing..." : "Analyze with AI"}
        </button>
      )}

      {suggestion && (
        <div
          style={{
            backgroundColor: "#f0f4ff",
            border: "1px solid #ccd6ff",
            borderRadius: "6px",
            padding: "10px",
            marginBottom: "15px",
            fontSize: "14px",
            textAlign: "left",
          }}
        >
          {suggestion.predictedCategory ? (
  <p style={{ margin: 0 }}>
    AI suggests: <strong style={{ textTransform: "capitalize" }}>{suggestion.predictedCategory}</strong>
    {" "}({suggestion.topPredictions[0].confidence}% confidence). Feel free to correct it below.
  </p>
) : (
  <p style={{ margin: 0 }}>AI couldn't confidently guess a category — please select one manually.</p>
)}
        </div>
      )}

      {uploadedImageUrl && (
        <form onSubmit={handleSave}>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ display: "block", width: "100%", margin: "10px 0", padding: "8px" }}
          >
            <option value="">Select Category</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <button type="submit" disabled={saving} style={{ width: "100%", padding: "10px" }}>
            {saving ? "Saving..." : "Save Item"}
          </button>
        </form>
      )}

      {message && <p style={{ color: "red" }}>{message}</p>}
    </div>
  );
}

export default AddItem;