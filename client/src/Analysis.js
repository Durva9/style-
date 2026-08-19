import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import SkinToneCamera from "./SkinToneCamera";
import { Button } from "./components/ui/button";
import { Label } from "./components/ui/label";
import { Input } from "./components/ui/input";
import { ArrowLeft } from "lucide-react";

const CLOUD_NAME = "hb85nhr5";
const UPLOAD_PRESET = "stylevault_wardrobe";
const API_BASE_URL = "http://localhost:5000";

const skinToneOptions = ["fair", "light", "medium", "olive", "tan", "deep"];
const bodyTypeOptions = ["hourglass", "pear", "apple", "rectangle", "inverted-triangle"];

const selectClass =
  "block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

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

function classifyBodyType(bust, waist, hip) {
  const bustHipAvg = (bust + hip) / 2;
  const bustHipDiffPercent = (Math.abs(bust - hip) / bustHipAvg) * 100;

  const waistReductionFromBust = ((bust - waist) / bust) * 100;
  const waistReductionFromHip = ((hip - waist) / hip) * 100;

  if (bustHipDiffPercent <= 5) {
    const hasDefinedWaist = waistReductionFromBust >= 20 && waistReductionFromHip >= 20;
    return hasDefinedWaist ? "hourglass" : "rectangle";
  }

  if (hip > bust) {
    const hasDefinedWaist = waistReductionFromBust >= 15 && waistReductionFromHip >= 15;
    return hasDefinedWaist ? "pear" : "apple";
  }

  return "inverted-triangle";
}

function Analysis({ user, onboarding }) {
  const [faceFile, setFaceFile] = useState(null);
  const [facePreview, setFacePreview] = useState(null);
  const [skinToneResult, setSkinToneResult] = useState(null);
  const [selectedSkinTone, setSelectedSkinTone] = useState("");
  const [analyzingFace, setAnalyzingFace] = useState(false);

  const [shoulderCm, setShoulderCm] = useState("");
  const [waistCm, setWaistCm] = useState("");
  const [hipCm, setHipCm] = useState("");
  const [selectedBodyType, setSelectedBodyType] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  // When redoing this from Settings (not onboarding), pre-fill with the
  // user's existing saved values so they can see what's already set
  // before deciding whether to redo the camera/upload detection.
  useEffect(() => {
    if (onboarding) return;
    const fetchExisting = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/profile/${user.uid}`);
        if (res.data.skinTone) setSelectedSkinTone(res.data.skinTone);
        if (res.data.bodyType) setSelectedBodyType(res.data.bodyType);
      } catch (err) {
        console.error(err);
      }
    };
    fetchExisting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboarding, user]);

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
    if (onboarding && (!selectedSkinTone || !selectedBodyType)) {
      setMessage("Please complete both skin tone and body type detection before continuing.");
      return;
    }

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
    <div className="min-h-screen bg-background px-6 pt-8 pb-24">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center gap-3">
          {!onboarding && (
            <Link
              to="/settings"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          )}
          <h1 className="text-2xl font-bold text-foreground">Body Type & Skin Tone Analysis</h1>
        </div>

        {/* Skin tone section */}
        <div className="mt-6 rounded-lg bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Skin Tone</h2>

          {!onboarding && selectedSkinTone && (
            <p className="mt-1 text-sm text-muted-foreground">
              Current: <strong className="capitalize text-foreground">{selectedSkinTone}</strong> — use the camera or upload below to redo it.
            </p>
          )}

          <div className="mt-3">
            <SkinToneCamera onCapture={runSkinToneAnalysis} />
          </div>

          <p className="mt-3 text-xs text-muted-foreground">Or upload a photo instead:</p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="mt-1 text-sm text-foreground file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-accent-foreground"
          />

          {facePreview && (
            <div className="mt-3">
              <img src={facePreview} alt="Face preview" className="h-28 w-28 rounded-lg object-cover" />
            </div>
          )}

          {analyzingFace && <p className="mt-2 text-sm text-muted-foreground">Analyzing...</p>}

          {skinToneResult && (
            <p className="mt-2 text-sm text-foreground">
              AI suggests:{" "}
              <strong className="capitalize">{skinToneResult.predictedSkinTone}</strong>
            </p>
          )}

          <div className="mt-3 space-y-1.5">
            <Label htmlFor="skin-tone">Skin Tone</Label>
            <select
              id="skin-tone"
              value={selectedSkinTone}
              onChange={(e) => setSelectedSkinTone(e.target.value)}
              className={selectClass}
            >
              <option value="">Select manually</option>
              {skinToneOptions.map((tone) => (
                <option key={tone} value={tone} className="capitalize">{tone}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Body type section */}
        <div className="mt-6 rounded-lg bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Body Type</h2>
          {!onboarding && selectedBodyType && (
            <p className="mt-1 text-sm text-muted-foreground">
              Current: <strong className="capitalize text-foreground">{selectedBodyType}</strong> — measure again below to redo it.
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Measure around your shoulders, waist, and hips in centimeters (a soft measuring tape works best).
          </p>

          <div className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="bust">Bust/Chest </Label>
              <Input
                id="bust"
                type="number"
                value={shoulderCm}
                onChange={(e) => setShoulderCm(e.target.value)}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="waist">Waist </Label>
              <Input
                id="waist"
                type="number"
                value={waistCm}
                onChange={(e) => setWaistCm(e.target.value)}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hip">Hip </Label>
              <Input
                id="hip"
                type="number"
                value={hipCm}
                onChange={(e) => setHipCm(e.target.value)}
                className="rounded-lg"
              />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleCalculateBodyType}
            className="mt-3 rounded-full"
          >
            Calculate Body Type
          </Button>

          {selectedBodyType && (
            <p className="mt-2 text-sm text-foreground">
              Result: <strong className="capitalize">{selectedBodyType}</strong>
            </p>
          )}

          <div className="mt-3 space-y-1.5">
            <Label htmlFor="body-type">Body Type</Label>
            <select
              id="body-type"
              value={selectedBodyType}
              onChange={(e) => setSelectedBodyType(e.target.value)}
              className={selectClass}
            >
              <option value="">Select manually</option>
              {bodyTypeOptions.map((type) => (
                <option key={type} value={type} className="capitalize">{type}</option>
              ))}
            </select>
          </div>
        </div>

        {message && <p className="mt-4 text-sm text-destructive">{message}</p>}

        <Button onClick={handleSaveAndContinue} disabled={saving} className="mt-6 w-full rounded-full">
          {saving ? "Saving..." : onboarding ? "Save & Continue to Dashboard" : "Save & Back to Settings"}
        </Button>
      </div>
    </div>
  );
}

export default Analysis;