import React, { useState } from "react";
import axios from "axios";

const CLOUD_NAME = "hb85nhr5";
const UPLOAD_PRESET = "stylevault_wardrobe";
const API_BASE_URL = "http://localhost:5000";

async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  const res = await axios.post(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    formData
  );
  return res.data.secure_url;
}

function VirtualTryOn() {
  const [bodyFile, setBodyFile] = useState(null);
  const [bodyPreview, setBodyPreview] = useState(null);
  const [garmentFile, setGarmentFile] = useState(null);
  const [garmentPreview, setGarmentPreview] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleBodyChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBodyFile(file);
      setBodyPreview(URL.createObjectURL(file));
      setResultImage(null);
    }
  };

  const handleGarmentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setGarmentFile(file);
      setGarmentPreview(URL.createObjectURL(file));
      setResultImage(null);
    }
  };

  const handleTryOn = async () => {
    if (!bodyFile || !garmentFile) {
      setError("Please upload both a full-body photo and a garment photo.");
      return;
    }

    setLoading(true);
    setError("");
    setResultImage(null);

    try {
      const bodyImageUrl = await uploadToCloudinary(bodyFile);
      const garmentImageUrl = await uploadToCloudinary(garmentFile);

      const res = await axios.post(`${API_BASE_URL}/api/tryon/basic`, {
        bodyImageUrl,
        garmentImageUrl,
      });

      if (res.data.error) {
        setError(res.data.error);
      } else {
        setResultImage(res.data.resultImageBase64);
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong generating the try-on preview.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "50px auto", textAlign: "center" }}>
      <h2>Virtual Try-On</h2>
      <p style={{ fontSize: "13px", color: "#666" }}>
        Upload a full-body photo of yourself (standing, front-facing) and a photo of the garment.
      </p>

      <div style={{ display: "flex", gap: "20px", justifyContent: "center", margin: "20px 0" }}>
        <div>
          <p style={{ fontSize: "13px", fontWeight: "bold" }}>Your Photo</p>
          <input type="file" accept="image/*" onChange={handleBodyChange} />
          {bodyPreview && <img src={bodyPreview} alt="body" style={{ width: "120px", marginTop: "8px", borderRadius: "6px" }} />}
        </div>
        <div>
          <p style={{ fontSize: "13px", fontWeight: "bold" }}>Garment Photo</p>
          <input type="file" accept="image/*" onChange={handleGarmentChange} />
          {garmentPreview && <img src={garmentPreview} alt="garment" style={{ width: "120px", marginTop: "8px", borderRadius: "6px" }} />}
        </div>
      </div>

      <button onClick={handleTryOn} disabled={loading} style={{ padding: "10px 24px" }}>
        {loading ? "Generating..." : "Try It On"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {resultImage && (
        <div style={{ marginTop: "25px" }}>
          <h3>Preview</h3>
          <img src={resultImage} alt="try-on result" style={{ maxWidth: "300px", borderRadius: "8px" }} />
        </div>
      )}
    </div>
  );
}

export default VirtualTryOn;