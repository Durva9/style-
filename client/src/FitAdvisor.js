import React, { useState } from "react";
import axios from "axios";
import { Upload } from "lucide-react";
import { Button } from "./components/ui/button";
import BottomNav from "./BottomNav";

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

  const resultStyles = !result
    ? ""
    : result.score >= 7
    ? "bg-success/10 border border-success/30"
    : result.score >= 5
    ? "bg-warning/10 border border-warning/30"
    : "bg-destructive/10 border border-destructive/30";

  return (
    <div className="min-h-screen bg-background px-6 pt-8 pb-24">
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-bold text-foreground">Should You Buy It?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a photo of the item, or a photo of yourself wearing it — we'll check it against your style profile.
        </p>

        <div className="mt-6 rounded-lg bg-card p-5 shadow-sm">
          <div className="flex gap-4 text-sm text-foreground">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={uploadType === "garment"}
                onChange={() => setUploadType("garment")}
                className="accent-primary"
              />
              Just the item
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={uploadType === "wearing"}
                onChange={() => setUploadType("wearing")}
                className="accent-primary"
              />
              Me wearing it
            </label>
          </div>

          <label
            htmlFor="fit-advisor-image"
            className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input py-8 text-center hover:bg-muted"
          >
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              {image ? "Change photo" : "Tap to select a photo"}
            </span>
            <input
              id="fit-advisor-image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>

          {preview && (
            <div className="mt-4 flex justify-center">
              <img src={preview} alt="Preview" className="max-h-56 rounded-lg object-cover" />
            </div>
          )}

          {image && (
            <Button onClick={handleAnalyze} disabled={analyzing} className="mt-4 w-full rounded-full">
              {analyzing ? "Analyzing..." : "Check This Item"}
            </Button>
          )}

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </div>

        {result && (
          <div className={`mt-4 rounded-lg p-4 text-left ${resultStyles}`}>
            <h3 className="mb-2 text-base font-bold text-foreground">{result.verdict}</h3>
            <p className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              Detected:{" "}
              <strong className="capitalize text-foreground">{result.category || "unknown item"}</strong>
              {result.detectedColor && (
                <span
                  className="inline-block h-3 w-3 rounded-full border border-border"
                  style={{ backgroundColor: result.detectedColor }}
                />
              )}
            </p>
            <ul className="list-disc pl-4 text-sm text-foreground">
              {result.reasons.map((r, i) => (
                <li key={i} className="mb-1">{r}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default FitAdvisor;