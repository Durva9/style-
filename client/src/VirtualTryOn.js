import React, { useState } from "react";
import axios from "axios";
import { Upload } from "lucide-react";
import { Button } from "./components/ui/button";
import BottomNav from "./BottomNav";

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
  const [garmentDescription, setGarmentDescription] = useState("");
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
        garmentDescription: garmentDescription || "a garment",
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
    <div className="min-h-screen bg-background px-6 pt-8 pb-24">
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-bold text-foreground">Virtual Try-On</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a full-body photo of yourself (standing, front-facing) and a photo of the garment.
        </p>

        <div className="mt-6 rounded-lg bg-card p-5 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="mb-2 text-xs font-semibold text-foreground">Your Photo</p>
              <label
                htmlFor="body-photo"
                className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-input py-6 text-center hover:bg-muted"
              >
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Select photo</span>
                <input id="body-photo" type="file" accept="image/*" onChange={handleBodyChange} className="hidden" />
              </label>
              {bodyPreview && (
                <img src={bodyPreview} alt="body" className="mt-2 h-28 w-full rounded-md object-cover" />
              )}
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-foreground">Garment Photo</p>
              <label
                htmlFor="garment-photo"
                className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-input py-6 text-center hover:bg-muted"
              >
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Select photo</span>
                <input id="garment-photo" type="file" accept="image/*" onChange={handleGarmentChange} className="hidden" />
              </label>
              {garmentPreview && (
                <img src={garmentPreview} alt="garment" className="mt-2 h-28 w-full rounded-md object-cover" />
              )}
            </div>
          </div>

          <input
            type="text"
            placeholder="Describe the garment (e.g. 'blue denim jacket')"
            value={garmentDescription}
            onChange={(e) => setGarmentDescription(e.target.value)}
            className="mt-4 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />

          <Button onClick={handleTryOn} disabled={loading} className="mt-4 w-full rounded-full">
            {loading ? "Generating (this can take up to 5 min)..." : "Try It On"}
          </Button>

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </div>

        {resultImage && (
          <div className="mt-6 text-center">
            <h3 className="mb-2 text-sm font-semibold text-foreground">Preview</h3>
            <img src={resultImage} alt="try-on result" className="mx-auto max-w-[300px] rounded-lg shadow-sm" />
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default VirtualTryOn;