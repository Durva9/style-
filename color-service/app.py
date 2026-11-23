from flask import Flask, request, jsonify
import cv2
import numpy as np
import requests
from sklearn.cluster import KMeans # type: ignore
import tensorflow as tf # type: ignore
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input # type: ignore
from tensorflow.keras.models import load_model # type: ignore
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision
import base64
import inspect
import re
from keras.src.initializers.initializer import Initializer
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)

# Newer-Keras .h5 files store extra initializer args (e.g. input_axes) that
# this Keras version doesn't accept. Drop any config keys the class doesn't know.
def _safe_from_config(cls, config):
    params = inspect.signature(cls.__init__).parameters
    if not any(p.kind == p.VAR_KEYWORD for p in params.values()):
        config = {k: v for k, v in config.items() if k in params}
    return cls(**config)

Initializer.from_config = classmethod(_safe_from_config)

# Same idea for layers: newer Keras saves extra args (e.g. BatchNormalization
# renorm=...). If a layer rejects unknown kwargs, drop them and retry.
from keras.src.ops.operation import Operation

def _tolerant_layer_from_config(cls, config):
    config = dict(config)
    for _ in range(10):
        try:
            return cls(**config)
        except ValueError as e:
            m = re.search(r"Unrecognized keyword arguments.*?\{(.*?)\}", str(e))
            bad = re.findall(r"'(\w+)'", m.group(1)) if m else []
            if not bad:
                raise TypeError(f"Error when deserializing class '{cls.__name__}': {e}")
            for k in bad:
                config.pop(k, None)
    raise TypeError(f"Could not deserialize class '{cls.__name__}'")

Operation.from_config = classmethod(_tolerant_layer_from_config)

print("Loading fine-tuned clothing classifier...")
classifier_model = load_model("clothing_classifier.h5", compile=False)
print("Classifier loaded.")

CATEGORY_LABELS = ["shirt", "tshirt", "jeans", "dress", "shoes", "accessory"]

def download_image(image_url):
    response = requests.get(image_url)
    image_array = np.frombuffer(response.content, np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    return image

def classify_clothing(image):
    img = cv2.resize(image, (224, 224))
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img_array = np.expand_dims(img, axis=0).astype(np.float32)
    img_array = preprocess_input(img_array)

    predictions = classifier_model.predict(img_array, verbose=0)[0]

    results = [
        {"label": CATEGORY_LABELS[i], "confidence": round(float(predictions[i]) * 100, 2)}
        for i in range(len(CATEGORY_LABELS))
    ]
    results.sort(key=lambda x: x["confidence"], reverse=True)

    predicted_category = results[0]["label"]

    return {
        "predictedCategory": predicted_category,
        "topPredictions": results,
    }

def remove_background(image):
    resized = cv2.resize(image, (300, 300))
    mask = np.zeros(resized.shape[:2], np.uint8)
    bgd_model = np.zeros((1, 65), np.float64)
    fgd_model = np.zeros((1, 65), np.float64)

    margin_x = int(300 * 0.20)
    margin_y = int(300 * 0.20)
    rect = (margin_x, margin_y, 300 - 2 * margin_x, 300 - 2 * margin_y)

    cv2.grabCut(resized, mask, rect, bgd_model, fgd_model, 8, cv2.GC_INIT_WITH_RECT)
    mask2 = np.where((mask == 2) | (mask == 0), 0, 1).astype("uint8")
    foreground_pixels = resized[mask2 == 1]

    min_required = int(300 * 300 * 0.10)
    if len(foreground_pixels) < min_required:
        return None

    return foreground_pixels

def filter_skin_and_background(pixels_bgr):
    if len(pixels_bgr) == 0:
        return pixels_bgr

    pixels_reshaped = pixels_bgr.reshape(-1, 1, 3).astype(np.uint8)
    hsv = cv2.cvtColor(pixels_reshaped, cv2.COLOR_BGR2HSV).reshape(-1, 3)

    h, s, v = hsv[:, 0], hsv[:, 1], hsv[:, 2]

    is_skin = (h >= 0) & (h <= 25) & (s >= 30) & (s <= 170) & (v >= 60)
    is_light_background = (v >= 180) & (s <= 40)

    keep_mask = ~(is_skin | is_light_background)
    filtered = pixels_bgr[keep_mask]

    if len(filtered) < max(20, len(pixels_bgr) * 0.05):
        return pixels_bgr

    return filtered

def get_dominant_colors(pixels, k=5):
    if len(pixels) < k:
        k = max(1, len(pixels))

    pixels_rgb = pixels[:, ::-1]
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    kmeans.fit(pixels_rgb)

    colors = kmeans.cluster_centers_.astype(int)
    labels = kmeans.labels_
    counts = np.bincount(labels)
    total = len(labels)

    results = []
    for i in range(k):
        r, g, b = colors[i]
        hex_color = "#{:02x}{:02x}{:02x}".format(
            max(0, min(255, r)), max(0, min(255, g)), max(0, min(255, b))
        )
        percentage = round((counts[i] / total) * 100, 2)
        results.append({"hex": hex_color, "percentage": percentage})

    results.sort(key=lambda x: x["percentage"], reverse=True)
    return results


face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

def classify_skin_tone(avg_bgr):
    b, g, r = avg_bgr
    brightness = (int(r) + int(g) + int(b)) / 3

    if brightness >= 200:
        return "fair"
    elif brightness >= 170:
        return "light"
    elif brightness >= 140:
        return "medium"
    elif brightness >= 110:
        return "olive"
    elif brightness >= 80:
        return "tan"
    else:
        return "deep"

def analyze_skin_tone(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80))

    if len(faces) == 0:
        return {"error": "No face detected. Please upload a clear photo of your face."}

    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])

    left_cheek = image[y + int(h * 0.5):y + int(h * 0.65), x + int(w * 0.15):x + int(w * 0.35)]
    right_cheek = image[y + int(h * 0.5):y + int(h * 0.65), x + int(w * 0.65):x + int(w * 0.85)]
    forehead = image[y + int(h * 0.15):y + int(h * 0.25), x + int(w * 0.35):x + int(w * 0.65)]

    samples = []
    for region in [left_cheek, right_cheek, forehead]:
        if region.size > 0:
            samples.append(region.reshape(-1, 3))

    if not samples:
        return {"error": "Could not sample skin region from the detected face."}

    all_pixels = np.vstack(samples)
    avg_bgr = all_pixels.mean(axis=0)

    predicted_tone = classify_skin_tone(avg_bgr)
    hex_color = "#{:02x}{:02x}{:02x}".format(
        int(avg_bgr[2]), int(avg_bgr[1]), int(avg_bgr[0])
    )

    return {
        "predictedSkinTone": predicted_tone,
        "sampledColor": hex_color,
    }


print("Loading pose landmarker model...")
pose_base_options = mp_python.BaseOptions(model_asset_path="pose_landmarker.task")
pose_options = mp_vision.PoseLandmarkerOptions(
    base_options=pose_base_options,
    output_segmentation_masks=False,
)
pose_landmarker = mp_vision.PoseLandmarker.create_from_options(pose_options)
print("Pose landmarker loaded.")

LEFT_SHOULDER = 11
RIGHT_SHOULDER = 12
LEFT_HIP = 23
RIGHT_HIP = 24

def classify_body_type(shoulder_width, hip_width):
    ratio = shoulder_width / hip_width
    if ratio > 1.15:
        return "inverted-triangle"
    elif ratio < 0.87:
        return "pear"
    elif 0.95 <= ratio <= 1.05:
        return "hourglass"
    else:
        return "rectangle"

def analyze_body_type(image):
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)

    result = pose_landmarker.detect(mp_image)

    if not result.pose_landmarks:
        return {"error": "Could not detect a body pose. Please upload a clear, full-body photo."}

    landmarks = result.pose_landmarks[0]
    h, w = image.shape[:2]

    def get_point(landmark_id):
        lm = landmarks[landmark_id]
        return np.array([lm.x * w, lm.y * h])

    left_shoulder = get_point(LEFT_SHOULDER)
    right_shoulder = get_point(RIGHT_SHOULDER)
    left_hip = get_point(LEFT_HIP)
    right_hip = get_point(RIGHT_HIP)

    shoulder_width = np.linalg.norm(left_shoulder - right_shoulder)
    hip_width = np.linalg.norm(left_hip - right_hip)

    if shoulder_width == 0 or hip_width == 0:
        return {"error": "Could not measure body proportions clearly. Please try a different photo."}

    predicted_type = classify_body_type(shoulder_width, hip_width)

    return {
        "predictedBodyType": predicted_type,
        "measurements": {
            "shoulderWidth": round(float(shoulder_width), 1),
            "hipWidth": round(float(hip_width), 1),
        },
    }


# ---------- Virtual Try-On (IDM-VTON via remote Gradio inference) ----------

from idm_vton_client import run_idm_vton

def basic_tryon(body_image_url, garment_image_url, garment_desc):
    """Delegates to the IDM-VTON model running on a remote Gradio endpoint
    (see idm_vton_client.py). Takes URLs directly since the remote client
    downloads/handles the files itself."""
    try:
        result_path = run_idm_vton(body_image_url, garment_image_url, garment_desc)
        return result_path, None
    except Exception as e:
        return None, f"Try-on generation failed: {e}"


@app.route("/analyze-color", methods=["POST"])
def analyze_color():
    data = request.get_json()
    image_url = data.get("imageUrl")

    if not image_url:
        return jsonify({"error": "imageUrl is required"}), 400

    try:
        image = download_image(image_url)
        if image is None:
            return jsonify({"error": "Could not decode image"}), 400

        foreground_pixels = remove_background(image)

        if foreground_pixels is None:
            h, w = image.shape[:2]
            crop_margin_h = int(h * 0.15)
            crop_margin_w = int(w * 0.15)
            cropped = image[crop_margin_h:h - crop_margin_h, crop_margin_w:w - crop_margin_w]
            resized = cv2.resize(cropped, (150, 150))
            foreground_pixels = resized.reshape(-1, 3)
            foreground_pixels = filter_skin_and_background(foreground_pixels)

        dominant_colors = get_dominant_colors(foreground_pixels, k=5)
        return jsonify({"colors": dominant_colors})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/classify", methods=["POST"])
def classify():
    data = request.get_json()
    image_url = data.get("imageUrl")

    if not image_url:
        return jsonify({"error": "imageUrl is required"}), 400

    try:
        image = download_image(image_url)
        if image is None:
            return jsonify({"error": "Could not decode image"}), 400

        result = classify_clothing(image)
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/analyze-skin-tone", methods=["POST"])
def skin_tone_route():
    data = request.get_json()
    image_url = data.get("imageUrl")

    if not image_url:
        return jsonify({"error": "imageUrl is required"}), 400

    try:
        image = download_image(image_url)
        if image is None:
            return jsonify({"error": "Could not decode image"}), 400

        result = analyze_skin_tone(image)
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/analyze-body-type", methods=["POST"])
def body_type_route():
    data = request.get_json()
    image_url = data.get("imageUrl")

    if not image_url:
        return jsonify({"error": "imageUrl is required"}), 400

    try:
        image = download_image(image_url)
        if image is None:
            return jsonify({"error": "Could not decode image"}), 400

        result = analyze_body_type(image)
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/basic-tryon", methods=["POST"])
def basic_tryon_route():
    data = request.get_json()
    body_url = data.get("bodyImageUrl")
    garment_url = data.get("garmentImageUrl")
    garment_desc = data.get("garmentDescription", "a garment")

    if not body_url or not garment_url:
        return jsonify({"error": "bodyImageUrl and garmentImageUrl are required"}), 400

    try:
        result_path, error = basic_tryon(body_url, garment_url, garment_desc)
        if error:
            return jsonify({"error": error}), 400

        # run_idm_vton returns a local filepath from the Gradio client;
        # read + re-encode as base64 so the response shape matches what
        # the client already expects.
        with open(result_path, "rb") as f:
            result_b64 = base64.b64encode(f.read()).decode("utf-8")

        return jsonify({"resultImageBase64": f"data:image/jpeg;base64,{result_b64}"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/", methods=["GET"])
def home():
    return "Color Analysis & Classification Service is running"

if __name__ == "__main__":
    app.run(port=5001, debug=True)