const express = require("express");
const router = express.Router();
const axios = require("axios");
const UserProfile = require("../models/UserProfile");
const { scoreGarment } = require("../utils/fitScoring");

const COLOR_SERVICE_URL = "http://localhost:5001";

router.post("/", async (req, res) => {
  try {
    const { userId, imageUrl } = req.body;

    if (!userId || !imageUrl) {
      return res.status(400).json({ error: "userId and imageUrl are required" });
    }

    const profile = (await UserProfile.findOne({ userId })) || {};
    const skinTone = profile.skinTone || "";
    const bodyType = profile.bodyType || "";

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

    let verdict;
    if (score >= 7) verdict = "Great choice!";
    else if (score >= 5) verdict = "Good, with a couple of things to consider.";
    else verdict = "Might not be your best match, but it's your call!";

    res.json({
      verdict,
      score,
      category,
      detectedColor: colors[0]?.hex || null,
      reasons,
    });
  } catch (err) {
    console.error("Fit advisor failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;