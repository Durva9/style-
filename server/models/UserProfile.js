const mongoose = require("mongoose");

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  gender: {
    type: String,
    enum: ["male", "female", "non-binary", "prefer-not-to-say", ""],
    default: "",
  },
  bodyType: {
    type: String,
    enum: ["hourglass", "pear", "apple", "rectangle", "inverted-triangle", ""],
    default: "",
  },
  skinTone: {
    type: String,
    enum: ["fair", "light", "medium", "olive", "tan", "deep", ""],
    default: "",
  },
  preferredColors: {
    type: [String],
    default: [],
  },
  fashionStyle: {
    type: String,
    enum: ["casual", "formal", "streetwear", "ethnic", "minimalist", "bohemian", ""],
    default: "",
  },
  occasionPreferences: {
    type: [String],
    default: [],
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("UserProfile", userProfileSchema);