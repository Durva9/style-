const express = require("express");
const router = express.Router();
const axios = require("axios");

const COLOR_SERVICE_URL = "http://localhost:5001";

router.post("/skin-tone", async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const response = await axios.post(`${COLOR_SERVICE_URL}/analyze-skin-tone`, { imageUrl });
    res.json(response.data);
  } catch (err) {
    console.error("Skin tone analysis failed:", err.message);
    res.status(500).json({ error: "Skin tone analysis failed" });
  }
});

router.post("/body-type", async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const response = await axios.post(`${COLOR_SERVICE_URL}/analyze-body-type`, { imageUrl });
    res.json(response.data);
  } catch (err) {
    console.error("Body type analysis failed:", err.message);
    res.status(500).json({ error: "Body type analysis failed" });
  }
});

module.exports = router;