const express = require("express");
const router = express.Router();
const axios = require("axios");
const UserProfile = require("../models/UserProfile");
const { scoreGarment } = require("../utils/fitScoring");

const COLOR_SERVICE_URL = "http://localhost:5001";

async function scoreOneImage(imageUrl, skinTone, bodyType) {
  let colors = [];
  let category = "";

  try {
    const colorRes = await axios.post(`${COLOR_SERVICE_URL}/analyze-color`, { imageUrl });
    colors = colorRes.data.colors || [];
  } catch (e) {
    console.error("Color analysis failed:", e.message);
  }

  try {
    const classifyRes = await axios.post(`${COLOR_SERVICE_URL}/classify`, { imageUrl });
    category = classifyRes.data.predictedCategory || "";
  } catch (e) {
    console.error("Classification failed:", e.message);
  }

  const { score, reasons } = scoreGarment(colors, category, skinTone, bodyType);

  return {
    imageUrl,
    category,
    detectedColor: colors[0]?.hex || null,
    score,
    reasons,
  };
}

router.post("/", async (req, res) => {
  try {
    const { userId, imageUrls } = req.body;

    if (!userId || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res.status(400).json({ error: "userId and a non-empty imageUrls array are required" });
    }

    if (imageUrls.length > 10) {
      return res.status(400).json({ error: "Please limit to 10 images at a time" });
    }

    const profile = (await UserProfile.findOne({ userId })) || {};
    const skinTone = profile.skinTone || "";
    const bodyType = profile.bodyType || "";

    const results = [];
    for (const url of imageUrls) {
      const result = await scoreOneImage(url, skinTone, bodyType);
      results.push(result);
    }

    results.sort((a, b) => b.score - a.score);
    results.forEach((r, i) => (r.rank = i + 1));

    res.json({ ranked: results });
  } catch (err) {
    console.error("Ranking failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;