const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  colors: {
    type: [
      {
        hex: String,
        percentage: Number,
      },
    ],
    default: [],
  },
  wornCount: {
    type: Number,
    default: 0,
  },
  lastWornAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Item", itemSchema);