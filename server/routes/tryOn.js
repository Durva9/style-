const express = require("express");
const router = express.Router();
const axios = require("axios");

const COLOR_SERVICE_URL = "http://localhost:5001";

router.post("/basic", async (req, res) => {
  try {
    const { bodyImageUrl, garmentImageUrl } = req.body;
    const response = await axios.post(`${COLOR_SERVICE_URL}/basic-tryon`, {
      bodyImageUrl,
      garmentImageUrl,
    });
    res.json(response.data);
  } catch (err) {
    console.error("Basic try-on failed:", err.message);
    res.status(500).json({ error: "Try-on failed" });
  }
});

module.exports = router;