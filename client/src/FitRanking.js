import React, { useState } from "react";
import axios from "axios";

const CLOUD_NAME = "hb85nhr5";
const UPLOAD_PRESET = "stylevault_wardrobe";
const API_BASE_URL = "http://localhost:5000";

function FitRanking({ user }) {
  const [queue, setQueue] = useState([]); // { file, preview, uploadedUrl, uploading }
  const [analyzing, setAnalyzing] = useState(false);
  const [ranked, setRanked] = useState(null);
  const [error, setError] = useState("");

  const uploadSingleFile = async (file) => {
  const preview = URL.createObjectURL(file);
  const tempId = Date.now() + Math.random();

  setQueue((prev) => [...prev, { id: tempId, preview, uploadedUrl: null, uploading: true }]);

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    const res = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      formData
    );

    setQueue((prev) =>
      prev.map((item) =>
        item.id === tempId ? { ...item, uploadedUrl: res.data.secure_url, uploading: false } : item
      )
    );
  } catch (err) {
    console.error(err);
    setQueue((prev) => prev.filter((item) => item.id !== tempId));
    setError("One or more images failed to upload. Please try again.");
  }
};

const handleAddItems = async (e) => {
  const selectedFiles = Array.from(e.target.files);
  if (selectedFiles.length === 0) return;

  const remainingSlots = 10 - queue.length;
  const filesToAdd = selectedFiles.slice(0, remainingSlots);

  if (selectedFiles.length > remainingSlots) {
    setError(`Only ${remainingSlots} more item(s) could be added (10 max total).`);
  } else {
    setError("");
  }

  setRanked(null);
  e.target.value = ""; // allows re-selecting the same file(s) again later

  // Upload all selected files in parallel, each appearing in the queue as it completes
  filesToAdd.forEach((file) => uploadSingleFile(file));
};

  const handleRemove = (id) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleRank = async () => {
    const readyUrls = queue.filter((item) => item.uploadedUrl).map((item) => item.uploadedUrl);

    if (readyUrls.length === 0) {
      setError("Please add at least one item first.");
      return;
    }

    setAnalyzing(true);
    setError("");
    setRanked(null);

    try {
      const rankRes = await axios.post(`${API_BASE_URL}/api/rank-fit`, {
        userId: user.uid,
        imageUrls: readyUrls,
      });

      setRanked(rankRes.data.ranked);
    } catch (err) {
      console.error(err);
      setError("Something went wrong ranking these items. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStartOver = () => {
    setQueue([]);
    setRanked(null);
    setError("");
  };

  const scoreColor = (score) => {
    if (score >= 7) return "#e6f7e6";
    if (score >= 5) return "#fff4e5";
    return "#fde8e8";
  };

  const stillUploading = queue.some((item) => item.uploading);

  return (
    <div style={{ maxWidth: "700px", margin: "50px auto", textAlign: "center" }}>
      <h2>Rank My Shopping Picks</h2>
      <p style={{ fontSize: "13px", color: "#666" }}>
        Add items one at a time as you shop — up to 10. When you're ready, rank them all against your style profile.
      </p>

      <input type="file" accept="image/*" multiple onChange={handleAddItems} disabled={queue.length >= 10} />
      {queue.length >= 10 && <p style={{ fontSize: "12px", color: "#a55" }}>Limit of 10 items reached.</p>}

      {queue.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            justifyContent: "center",
            margin: "15px 0",
          }}
        >
          {queue.map((item) => (
            <div key={item.id} style={{ position: "relative" }}>
              <img
                src={item.preview}
                alt="queued item"
                style={{
                  width: "70px",
                  height: "70px",
                  objectFit: "cover",
                  borderRadius: "4px",
                  opacity: item.uploading ? 0.5 : 1,
                }}
              />
              {item.uploading && (
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: "10px" }}>
                  ...
                </div>
              )}
              <button
                onClick={() => handleRemove(item.id)}
                style={{
                  position: "absolute",
                  top: "-6px",
                  right: "-6px",
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  border: "none",
                  backgroundColor: "#d33",
                  color: "white",
                  fontSize: "11px",
                  cursor: "pointer",
                  lineHeight: "18px",
                  padding: 0,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {queue.length > 0 && (
        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
          <button
            onClick={handleRank}
            disabled={analyzing || stillUploading}
            style={{ padding: "10px 20px" }}
          >
            {analyzing
              ? "Ranking..."
              : stillUploading
              ? "Uploading..."
              : `Rank These ${queue.length} Items`}
          </button>
          <button onClick={handleStartOver} style={{ padding: "10px 20px" }}>
            Start Over
          </button>
        </div>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {ranked && (
        <div style={{ marginTop: "25px", textAlign: "left" }}>
          {ranked.map((item) => (
            <div
              key={item.rank}
              style={{
                display: "flex",
                gap: "15px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "12px",
                backgroundColor: scoreColor(item.score),
              }}
            >
              <div style={{ fontSize: "20px", fontWeight: "bold", minWidth: "30px" }}>
                #{item.rank}
              </div>
              <img
                src={item.imageUrl}
                alt={item.category}
                style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "6px" }}
              />
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 4px" }}>
                  <strong style={{ textTransform: "capitalize" }}>{item.category || "Item"}</strong>
                  {" "}— Score: {item.score}/10
                  {item.detectedColor && (
                    <span
                      style={{
                        display: "inline-block",
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        backgroundColor: item.detectedColor,
                        border: "1px solid #999",
                        marginLeft: "8px",
                        verticalAlign: "middle",
                      }}
                    />
                  )}
                </p>
                <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px" }}>
                  {item.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FitRanking;