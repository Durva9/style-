import React, { useEffect, useRef, useState, useCallback } from "react";
import * as faceapi from "face-api.js";

const MODEL_URL = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights";

function eyeAspectRatio(eyePoints) {
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const p = eyePoints;
  const vertical1 = dist(p[1], p[5]);
  const vertical2 = dist(p[2], p[4]);
  const horizontal = dist(p[0], p[3]);
  return (vertical1 + vertical2) / (2 * horizontal);
}

function SkinToneCamera({ onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [guidance, setGuidance] = useState(["Starting camera..."]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
      } catch (err) {
        console.error(err);
        setError("Could not load face detection models. Check your internet connection.");
      }
    };
    loadModels();
  }, []);

  const startCamera = useCallback(async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: 480, height: 360 },
    });
    streamRef.current = stream;
    setCameraActive(true);
    setError("");
  } catch (err) {
    console.error(err);
    setError("Could not access camera. Please allow camera permission, or use the upload option below.");
  }
}, []);

useEffect(() => {
  if (cameraActive && streamRef.current && videoRef.current) {
    videoRef.current.srcObject = streamRef.current;
    videoRef.current.play().catch((err) => console.error("Video play failed:", err));
  }
}, [cameraActive]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!modelsLoaded || !cameraActive) return;

    intervalRef.current = setInterval(async () => {
  console.log("Detection tick, video readyState:", videoRef.current?.readyState);
  if (!videoRef.current || videoRef.current.readyState !== 4) return;

      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks(true);

      if (!detection) {
        setGuidance(["No face detected. Please position your face in the frame."]);
        setReady(false);
        return;
      }

      const issues = [];
      const landmarks = detection.landmarks;

      // Eye openness check
      const leftEAR = eyeAspectRatio(landmarks.getLeftEye());
const rightEAR = eyeAspectRatio(landmarks.getRightEye());
console.log("EAR values - left:", leftEAR.toFixed(3), "right:", rightEAR.toFixed(3));
if (leftEAR < 0.22 && rightEAR < 0.22) {
  issues.push("Your eyes appear closed. Please open your eyes.");
}

      // Head tilt (roll) check, using the angle between the two eyes
      const leftEyeCenter = averagePoint(landmarks.getLeftEye());
      const rightEyeCenter = averagePoint(landmarks.getRightEye());
      const dx = rightEyeCenter.x - leftEyeCenter.x;
      const dy = rightEyeCenter.y - leftEyeCenter.y;
      const tiltDegrees = Math.abs((Math.atan2(dy, dx) * 180) / Math.PI);
      if (tiltDegrees > 8) {
        issues.push("Your head looks tilted. Please straighten your face.");
      }

      // Rough left-right facing check using nose position relative to eye midpoint
      const nose = averagePoint(landmarks.getNose());
      const eyeMidX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
      const eyeSpan = Math.abs(rightEyeCenter.x - leftEyeCenter.x) || 1;
      const noseOffsetRatio = (nose.x - eyeMidX) / eyeSpan;
      if (Math.abs(noseOffsetRatio) > 0.28) {
        issues.push("Please face the camera directly.");
      }

      // Lighting check - sample brightness within the detected face box
      const box = detection.detection.box;
      const brightness = sampleBrightness(videoRef.current, box);
      if (brightness !== null && brightness < 80) {
        issues.push("Lighting looks too dim. Please move to a well-lit area or face a light source.");
      }

      if (issues.length === 0) {
        setGuidance(["Looking good! You can capture now."]);
        setReady(true);
      } else {
        setGuidance(issues);
        setReady(false);
      }
    }, 400);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [modelsLoaded, cameraActive]);

  const averagePoint = (points) => {
    const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    return { x: sum.x / points.length, y: sum.y / points.length };
  };

  const sampleBrightness = (video, box) => {
    if (!canvasRef.current) return null;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const x = Math.max(0, Math.floor(box.x));
    const y = Math.max(0, Math.floor(box.y));
    const w = Math.min(canvas.width - x, Math.floor(box.width));
    const h = Math.min(canvas.height - y, Math.floor(box.height));
    if (w <= 0 || h <= 0) return null;

    const imageData = ctx.getImageData(x, y, w, h).data;
    let total = 0;
    let count = 0;
    for (let i = 0; i < imageData.length; i += 4) {
      total += (imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3;
      count++;
    }
    return count > 0 ? total / count : null;
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      const file = new File([blob], "skin_capture.jpg", { type: "image/jpeg" });
      onCapture(file);
      stopCamera();
    }, "image/jpeg", 0.9);
  };

  return (
    <div>
      {error && <p style={{ color: "red", fontSize: "13px" }}>{error}</p>}

      {!cameraActive && (
        <button
          type="button"
          onClick={startCamera}
          disabled={!modelsLoaded}
          style={{ padding: "8px 14px" }}
        >
          {modelsLoaded ? "Start Camera" : "Loading face detection..."}
        </button>
      )}

      {cameraActive && (
        <div>
          <video
            ref={videoRef}
            style={{ width: "100%", maxWidth: "320px", borderRadius: "6px", transform: "scaleX(-1)" }}
            muted
            playsInline
          />
          <div
            style={{
              margin: "8px 0",
              padding: "8px",
              borderRadius: "6px",
              fontSize: "13px",
              backgroundColor: ready ? "#e6f7e6" : "#fff4e5",
              color: ready ? "#2d7a2d" : "#8a5300",
            }}
          >
            {guidance.map((g, i) => (
              <div key={i}>{g}</div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" onClick={handleCapture} disabled={!ready} style={{ padding: "8px 14px" }}>
              Capture Photo
            </button>
            <button type="button" onClick={handleCapture} style={{ padding: "8px 14px", fontSize: "12px" }}>
              Capture anyway
            </button>
            <button type="button" onClick={stopCamera} style={{ padding: "8px 14px" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />

      <p style={{ fontSize: "12px", color: "#777", marginTop: "8px" }}>
        Tips: use natural daylight or a bright room, face the camera directly, and keep your eyes open.
      </p>
    </div>
  );
}

export default SkinToneCamera;