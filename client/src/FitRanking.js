import React, { useState } from "react";
import axios from "axios";
import { Upload, X } from "lucide-react";
import { Button } from "./components/ui/button";
import BottomNav from "./BottomNav";

const CLOUD_NAME = "hb85nhr5";
const UPLOAD_PRESET = "stylevault_wardrobe";
const API_BASE_URL = "http://localhost:5000";


function scoreClasses(score) {
  if (score >= 7) return "bg-success/10 border border-success/30";
  if (score >= 5) return "bg-warning/10 border border-warning/30";
  return "bg-destructive/10 border border-destructive/30";
}

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
    e.target.value = "";

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

  const stillUploading = queue.some((item) => item.uploading);

  return (
    <div className="min-h-screen bg-background px-6 pt-8 pb-24">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground">Rank My Shopping Picks</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add items one at a time as you shop — up to 10. When you're ready, rank them all against your style profile.
        </p>

        <div className="mt-6 rounded-lg bg-card p-5 shadow-sm">
          <label
            htmlFor="fit-ranking-images"
            className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input py-8 text-center ${
              queue.length >= 10 ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-muted"
            }`}
          >
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Tap to add photos</span>
            <input
              id="fit-ranking-images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleAddItems}
              disabled={queue.length >= 10}
              className="hidden"
            />
          </label>
          {queue.length >= 10 && (
            <p className="mt-2 text-xs text-destructive">Limit of 10 items reached.</p>
          )}

          {queue.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              {queue.map((item) => (
                <div key={item.id} className="relative">
                  <img
                    src={item.preview}
                    alt="queued item"
                    className={`h-[70px] w-[70px] rounded-md object-cover ${item.uploading ? "opacity-50" : ""}`}
                  />
                  {item.uploading && (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-foreground">
                      ...
                    </div>
                  )}
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="absolute -right-1.5 -top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-destructive text-white"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {queue.length > 0 && (
            <div className="mt-4 flex justify-center gap-3">
              <Button onClick={handleRank} disabled={analyzing || stillUploading} className="rounded-full">
                {analyzing
                  ? "Ranking..."
                  : stillUploading
                  ? "Uploading..."
                  : `Rank These ${queue.length} Items`}
              </Button>
              <Button onClick={handleStartOver} variant="outline" className="rounded-full">
                Start Over
              </Button>
            </div>
          )}

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </div>

        {ranked && (
          <div className="mt-6 space-y-3">
            {ranked.map((item) => (
              <div
                key={item.rank}
                className={`flex gap-4 rounded-lg p-3 ${scoreClasses(item.score)}`}
              >
                <div className="min-w-[30px] text-xl font-bold text-foreground">#{item.rank}</div>
                <img
                  src={item.imageUrl}
                  alt={item.category}
                  className="h-20 w-20 rounded-md object-cover"
                />
                <div className="flex-1">
                  <p className="mb-1 flex items-center gap-2 text-sm text-foreground">
                    <strong className="capitalize">{item.category || "Item"}</strong>
                    — Score: {item.score}/10
                    {item.detectedColor && (
                      <span
                        className="inline-block h-3 w-3 rounded-full border border-border"
                        style={{ backgroundColor: item.detectedColor }}
                      />
                    )}
                  </p>
                  <ul className="list-disc pl-4 text-xs text-muted-foreground">
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

      <BottomNav />
    </div>
  );
}

export default FitRanking;