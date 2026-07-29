import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import SkinToneCamera from "./SkinToneCamera";

const CLOUD_NAME = "hb85nhr5";
const UPLOAD_PRESET = "stylevault_wardrobe";
const API_BASE_URL = "http://localhost:5000";

const skinToneOptions = ["fair", "light", "medium", "olive", "tan", "deep"];
const bodyTypeOptions = ["hourglass", "pear", "apple", "rectangle", "inverted-triangle"];

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

function classifyBodyType(shoulder, waist, hip) {
  const shoulderHipRatio = shoulder / hip;
  const waistHipRatio = waist / hip;
  const waistShoulderRatio = waist / shoulder;

  if (Math.abs(shoulderHipRatio - 1.0) < 0.08 && waistHipRatio > 0.80) return "rectangle";
  if (Math.abs(shoulderHipRatio - 1.0) < 0.10 && waistHipRatio < 0.78) return "hourglass";
  if (shoulderHipRatio < 0.90) return "pear";
  if (shoulderHipRatio > 1.12) return "inverted-triangle";
  if (waistShoulderRatio > 0.85) return "apple";
  return "rectangle";
}

function Analysis({ user, onboarding }) {
  // Skin tone state
  const [faceFile, setFaceFile] = useState(null);
  const [facePreview, setFacePreview] = useState(null);
  const [skinToneResult, setSkinToneResult] = useState(null);
  const [selectedSkinTone, setSelectedSkinTone] = useState("");
  const [analyzingFace, setAnalyzingFace] = useState(false);

  // Body type state
  const [shoulderCm, setShoulderCm] = useState("");
  const [waistCm, setWaistCm] = useState("");
  const [hipCm, setHipCm] = useState("");
  const [selectedBodyType, setSelectedBodyType] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const runSkinToneAnalysis = async (file) => {
    setFaceFile(file);
    setFacePreview(URL.createObjectURL(file));
    setAnalyzingFace(true);
    setMessage("");
    try {
      const imageUrl = await uploadToCloudinary(file);
      const res = await axios.post(`${API_BASE_URL}/api/analysis/skin-tone`, { imageUrl });
      if (res.data.error) {
        setMessage(res.data.error);
      } else {
        setSkinToneResult(res.data);
        setSelectedSkinTone(res.data.predictedSkinTone);
      }
    } catch (err) {
      console.error(err);
      setMessage("Skin tone analysis failed. You can still select manually below.");
    } finally {
      setAnalyzingFace(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) runSkinToneAnalysis(file);
  };

  const handleCalculateBodyType = () => {
    const shoulder = parseFloat(shoulderCm);
    const waist = parseFloat(waistCm);
    const hip = parseFloat(hipCm);

    if (!shoulder || !waist || !hip) {
      setMessage("Please enter all three measurements to calculate body type.");
      return;
    }

    const result = classifyBodyType(shoulder, waist, hip);
    setSelectedBodyType(result);
    setMessage("");
  };

  const handleSaveAndContinue = async () => {
    setSaving(true);
    setMessage("");
    try {
      const currentRes = await axios.get(`${API_BASE_URL}/api/profile/${user.uid}`);
      const current = currentRes.data || {};

      await axios.put(`${API_BASE_URL}/api/profile/${user.uid}`, {
        bodyType: selectedBodyType || current.bodyType || "",
        skinTone: selectedSkinTone || current.skinTone || "",
        fashionStyle: current.fashionStyle || "",
        preferredColors: current.preferredColors || [],
        occasionPreferences: current.occasionPreferences || [],
      });

      if (onboarding) {
        navigate("/dashboard");
      } else {
        navigate("/settings");
      }
    } catch (err) {
      console.error(err);
      setMessage("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: "520px", margin: "50px auto", textAlign: "center" }}>
      <h2>Body Type & Skin Tone Analysis</h2>

      {/* Skin tone section */}
      <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "15px", margin: "20px 0", textAlign: "left" }}>
        <h4>Skin Tone</h4>

        <SkinToneCamera onCapture={runSkinToneAnalysis} />

        <p style={{ fontSize: "13px", margin: "10px 0 4px" }}>Or upload a photo instead:</p>
        <input type="file" accept="image/*" onChange={handleFileUpload} />

        {facePreview && (
          <div style={{ margin: "10px 0" }}>
            <img src={facePreview} alt="Face preview" style={{ maxWidth: "120px", borderRadius: "4px" }} />
          </div>
        )}

        {analyzingFace && <p style={{ fontSize: "13px" }}>Analyzing...</p>}

        {skinToneResult && (
          <p style={{ fontSize: "14px", color: "#4444aa" }}>
            AI suggests: <strong style={{ textTransform: "capitalize" }}>{skinToneResult.predictedSkinTone}</strong>
          </p>
        )}

        <label>Skin Tone</label>
        <select
          value={selectedSkinTone}
          onChange={(e) => setSelectedSkinTone(e.target.value)}
          style={{ display: "block", width: "100%", margin: "6px 0", padding: "6px" }}
        >
          <option value="">Select manually</option>
          {skinToneOptions.map((tone) => (
            <option key={tone} value={tone}>{tone}</option>
          ))}
        </select>
      </div>

      {/* Body type section */}
      <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "15px", margin: "20px 0", textAlign: "left" }}>
        <h4>Body Type (enter your measurements)</h4>
        <p style={{ fontSize: "12px", color: "#777" }}>
          Measure around your shoulders, waist, and hips in centimeters (a soft measuring tape works best).
        </p>

        <label>Shoulder width (cm)</label>
        <input
          type="number"
          value={shoulderCm}
          onChange={(e) => setShoulderCm(e.target.value)}
          style={{ display: "block", width: "100%", margin: "6px 0", padding: "6px" }}
        />

        <label>Waist (cm)</label>
        <input
          type="number"
          value={waistCm}
          onChange={(e) => setWaistCm(e.target.value)}
          style={{ display: "block", width: "100%", margin: "6px 0", padding: "6px" }}
        />

        <label>Hip (cm)</label>
        <input
          type="number"
          value={hipCm}
          onChange={(e) => setHipCm(e.target.value)}
          style={{ display: "block", width: "100%", margin: "6px 0", padding: "6px" }}
        />

        <button type="button" onClick={handleCalculateBodyType} style={{ padding: "6px 12px", margin: "8px 0" }}>
          Calculate Body Type
        </button>

        {selectedBodyType && (
          <p style={{ fontSize: "14px", color: "#4444aa" }}>
            Result: <strong style={{ textTransform: "capitalize" }}>{selectedBodyType}</strong>
          </p>
        )}

        <label>Body Type</label>
        <select
          value={selectedBodyType}
          onChange={(e) => setSelectedBodyType(e.target.value)}
          style={{ display: "block", width: "100%", margin: "6px 0", padding: "6px" }}
        >
          <option value="">Select manually</option>
          {bodyTypeOptions.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {message && <p style={{ color: "red" }}>{message}</p>}

      <button onClick={handleSaveAndContinue} disabled={saving} style={{ width: "100%", padding: "10px" }}>
        {saving ? "Saving..." : onboarding ? "Save & Continue to Dashboard" : "Save & Back to Settings"}
      </button>
    </div>
  );
}

export default Analysis;