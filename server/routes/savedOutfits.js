const express = require("express");
const router = express.Router();
const SavedOutfit = require("../models/SavedOutfit");

router.post("/", async (req, res) => {
  try {
    const { userId, occasion, venueType, crowdType, city, temperature, outfit } = req.body;
    const saved = new SavedOutfit({ userId, occasion, venueType, crowdType, city, temperature, outfit });
    await saved.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:userId", async (req, res) => {
  try {
    const outfits = await SavedOutfit.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(outfits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:outfitId", async (req, res) => {
  try {
    await SavedOutfit.findByIdAndDelete(req.params.outfitId);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;