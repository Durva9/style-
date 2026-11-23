# Style Vault

Style Vault is an AI-powered digital wardrobe and personal styling assistant. It lets you catalog your clothes, get AI-assisted categorization and color analysis, receive personalized skin tone / body type insights, and get rule-based outfit recommendations based on weather, occasion, and your style preferences — plus a Virtual Try-On feature and shopping decision tools.

Built as a B.Tech major project, combining a full-stack web app with several hand-built computer vision and machine learning components rather than relying on a single black-box "AI" service.

---

## Features

### Wardrobe Management
- Upload clothing photos (stored via Cloudinary)
- AI-assisted category detection: a fine-tuned MobileNetV2 classifier (~92% validation accuracy) suggests a category, with an instant filename-keyword shortcut (e.g. `blue_shirt.jpg` → "Shirt" with no model call needed) and manual override always available
- Automatic dominant color extraction (OpenCV GrabCut background removal + K-Means clustering)
- Full CRUD: add, edit category, delete

### Personal Style Profile
- Name, gender, fashion style, preferred colors, occasion preferences
- **Skin tone analysis**: live in-browser camera with real-time quality checks (eyes open, head straight, good lighting) via face-api.js, or photo upload; backend uses Haar Cascade face detection + skin-region sampling
- **Body type analysis**: manual bust/waist/hip measurement input, classified using standard body-shape rules (hourglass, pear, apple, rectangle, inverted-triangle)

### Outfit Recommendation Engine
- Rule-based scoring combining current weather (city-based), occasion, venue type, crowd type, and color preference (including a custom color picker)
- Shows human-readable reasoning for every picked item
- "Regenerate" button for alternative combinations from your wardrobe
- Save favorite outfits for later

### Shopping Tools
- **"Should You Buy It?"** — upload a garment (or yourself wearing it) and get a score + specific reasons based on your skin tone and body type
- **"Rank My Shopping Picks"** — upload multiple candidate items (incrementally or in bulk) and get them ranked best-to-worst match

### Wardrobe Analytics
- Color distribution (donut chart with real color names)
- Category breakdown
- Wardrobe growth over time (by month/year)
- Saved outfits by occasion

### Virtual Try-On
- Warps a garment photo onto a body photo using MediaPipe pose landmarks + OpenCV, with an optional AI-enhanced mode that calls a remotely-hosted IDM-VTON diffusion model (via a Kaggle-notebook-hosted Gradio endpoint) for more realistic results when available

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Create React App) |
| Backend | Node.js + Express |
| Database | MongoDB Atlas |
| Authentication | Firebase Authentication (email/password + Google) |
| Image hosting | Cloudinary |
| AI/CV microservice | Python + Flask, using OpenCV, scikit-learn, TensorFlow/Keras, MediaPipe |
| Face detection (in-browser) | face-api.js (TensorFlow.js) |
| Weather data | OpenWeather API |
| Virtual Try-On model | IDM-VTON (hosted via Kaggle GPU notebook + Gradio share link) |

---

## Project Structure

```
style/
├── client/              React frontend (web)
│   └── src/
├── server/               Node.js/Express backend API
│   ├── models/            Mongoose schemas
│   ├── routes/             API route handlers
│   └── index.js
├── color-service/         Python Flask microservice for all AI/CV work
│   ├── venv/
│   ├── app.py              main Flask app
│   ├── clothing_classifier.h5   trained MobileNetV2 model
│   ├── pose_landmarker.task     MediaPipe model file
│   ├── evaluate_classifier.py   precision/recall/F1 evaluation script
│   ├── benchmark_latency.py     endpoint latency benchmarking script
│   └── requirements.txt
```

---

## Prerequisites

- Node.js (v18+) and npm
- Python 3.12 (specifically — newer versions can have TensorFlow/MediaPipe compatibility issues)
- Git
- A MongoDB Atlas account (free tier is enough)
- A Firebase project with Authentication enabled (Email/Password + Google providers)
- A Cloudinary account
- An OpenWeather API key
- For Virtual Try-On's AI-enhanced mode: a free Kaggle account (for GPU-hosted inference)

---

## Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd style
```

### 2. Backend setup (`server/`)

```bash
cd server
npm install
```

Create a `.env` file in `server/`:

```
PORT=5000
MONGO_URI=<your MongoDB Atlas connection string>
OPENWEATHER_API_KEY=<your OpenWeather API key>
IDM_VTON_GRADIO_URL=<Gradio share link — see Virtual Try-On section below; can leave blank initially>
```

**MongoDB Atlas network access:** in your Atlas dashboard, go to Network Access and allow access from `0.0.0.0/0` (or your specific IP) — otherwise the backend cannot connect.

### 3. Frontend setup (`client/`)

```bash
cd client
npm install
```

Update `client/src/firebase.js` with your own Firebase project's config values (`apiKey`, `authDomain`, `projectId`, etc. — get these from Firebase Console → Project Settings → your web app).

Update the `CLOUD_NAME` and `UPLOAD_PRESET` constants (found near the top of `AddItem.js`, `Analysis.js`, `FitAdvisor.js`, `FitRanking.js`, `VirtualTryOn.js`) with your own Cloudinary cloud name and an **unsigned** upload preset created in your Cloudinary dashboard (Settings → Upload → Add upload preset → Signing Mode: Unsigned).

### 4. AI/CV microservice setup (`color-service/`)

```bash
cd color-service
py -3.12 -m venv venv
.\venv\Scripts\Activate.ps1
python --version
```

Activate the virtual environment:
- Windows: `venv\Scripts\activate`
- macOS/Linux: `source venv/bin/activate`

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Download the MediaPipe pose model (used for body pose landmarks in Virtual Try-On):
```bash
curl -o pose_landmarker.task https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task
```

The trained classifier model (`clothing_classifier.h5`) should already be present in this folder. If it's missing, see the **Training the Classifier** section below to regenerate it.

---

## Running the App (Web)

You need **three services running simultaneously**, each in its own terminal:

```bash
# Terminal 1 — Backend API
cd server
npm run dev

# Terminal 2 — React frontend
cd client
npm start

# Terminal 3 — Python AI/CV service
cd color-service
python patch_gradio_client.py
python app.py
```

Then open `http://localhost:3000` in your browser.

**Common gotcha:** if you get "Analysis failed" or 500 errors on any AI-related feature (classification, color detection, skin tone, body-adjacent features), it almost always means the Python service (Terminal 3) isn't running or its virtual environment wasn't activated before starting it.

---

## Training / Re-training the Clothing Classifier

The active classifier (`clothing_classifier.h5`) is a MobileNetV2 model fine-tuned on the [clothing-dataset-small](https://github.com/alexeygrigorev/clothing-dataset-small) dataset, achieving ~92% validation accuracy across 6 categories (shirt, tshirt, jeans, dress, shoes, accessory — though the current app UI only exposes shirt/tshirt/jeans/dress).

To retrain it from scratch:

```bash
cd style
git clone https://github.com/alexeygrigorev/clothing-dataset-small.git

cd color-service
venv\Scripts\activate
python train_classifier.py
```

This produces a new `clothing_classifier.h5` in `color-service/`. Training takes roughly 15-20 minutes on a modern CPU.

### Evaluating the Model

To get Precision / Recall / F1-score metrics:

```bash
cd color-service
python evaluate_classifier.py
```

This prints a full classification report and saves detailed results (including the confusion matrix) to `evaluation_results.json`.

To benchmark endpoint latency:

```bash
python benchmark_latency.py
```

(Edit the `TEST_IMAGE_URL` variable inside the script first, pointing it at any real Cloudinary image URL from your database.)

---

## Virtual Try-On Setup

Virtual Try-On has two modes:

1. **Basic mode (always available)**: pose-guided garment warping using MediaPipe + OpenCV, runs entirely within your local `color-service`. No extra setup needed beyond the standard installation above.

2. **AI-enhanced mode (optional, requires a live Kaggle session)**: calls a remotely-hosted IDM-VTON diffusion model for more realistic results.

To enable AI-enhanced mode:

1. Create a Kaggle account and a new Notebook with GPU accelerator enabled (Settings → Accelerator → GPU T4).
2. In the notebook, clone and set up IDM-VTON:
   ```python
   !git clone https://github.com/yisol/IDM-VTON.git
   %cd IDM-VTON
   !pip install accelerate==0.25.0 torchmetrics==1.2.1 tqdm==4.66.1 transformers==4.36.2 diffusers==0.25.0 einops==0.7.0 bitsandbytes==0.39.0 scipy opencv-python gradio==4.24.0 fvcore cloudpickle omegaconf pycocotools basicsr av onnxruntime
   ```
3. Download the model weights (redirect to a larger disk partition — Kaggle's default `/kaggle/working` is only 20GB, but `/opt/bin` typically has 100GB+ available):
   ```python
   from huggingface_hub import snapshot_download
   snapshot_download(repo_id="yisol/IDM-VTON", local_dir="/opt/bin/idm_ckpt")
   ```
4. Launch the Gradio demo with a public share link:
   ```python
   %cd gradio_demo
   !python app.py --share
   ```
5. Copy the printed `https://xxxxxxxxxx.gradio.live` URL into your `server/color-service/.env` file as `IDM_VTON_GRADIO_URL`, then restart `python app.py`.

**Important:** this URL is temporary — it expires whenever the Kaggle notebook session ends (or after ~72 hours regardless), and you'll need to repeat steps 4-5 to get a fresh one each time you want to use AI-enhanced mode. Basic mode requires no such setup and always works.

---

## Known Environment Quirks

- **MongoDB "IP not whitelisted" errors**: your IP can change between networks/sessions — re-add `0.0.0.0/0` in Atlas → Network Access if this happens.
- **PowerShell users**: use `Remove-Item -Recurse -Force <path>` instead of `rmdir /s /q`, and `Invoke-WebRequest` instead of `curl` for testing API endpoints directly.
- **Python dependency conflicts**: the `requirements.txt` in `color-service/` has been carefully version-pinned to avoid known conflicts between TensorFlow, OpenCV, and MediaPipe (particularly around the `numpy` version). Avoid loosely `pip install`-ing new packages into this environment without checking compatibility.
- **MediaPipe API**: this project uses MediaPipe's newer Tasks API (`mediapipe.tasks.python.vision`), not the older `mp.solutions` interface.

---

## License / Academic Note

This is an academic project. Third-party pretrained models used (MobileNetV2 via Keras Applications, MediaPipe Pose Landmarker, IDM-VTON) are used under their respective open licenses for research/educational purposes. The `clothing-dataset-small` dataset is used under its repository's license for training.