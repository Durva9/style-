const express = require("express");
const router = express.Router();
const UserProfile = require("../models/UserProfile");

// Get a user's profile
router.get("/:userId", async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ userId: req.params.userId });
    res.json(profile || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create or update a user's profile (upsert)
router.put("/:userId", async (req, res) => {
  try {
    const { name, gender, bodyType, skinTone, preferredColors, fashionStyle, occasionPreferences } = req.body;

    const updatedProfile = await UserProfile.findOneAndUpdate(
      { userId: req.params.userId },
      {
        userId: req.params.userId,
        name,
        gender,
        bodyType,
        skinTone,
        preferredColors,
        fashionStyle,
        occasionPreferences,
        updatedAt: Date.now(),
      },
      { new: true, upsert: true }
    );

    res.json(updatedProfile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;