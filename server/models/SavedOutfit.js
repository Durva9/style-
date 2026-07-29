const mongoose = require("mongoose");

const savedOutfitSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  occasion: String,
  venueType: String,
  crowdType: String,
  city: String,
  temperature: Number,
  outfit: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SavedOutfit", savedOutfitSchema);