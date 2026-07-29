const express = require("express");
const router = express.Router();
const axios = require("axios");
const Item = require("../models/Item");

const COLOR_SERVICE_URL = "http://localhost:5001";

router.post("/classify", async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const classifyRes = await axios.post(`${COLOR_SERVICE_URL}/classify`, { imageUrl });
    res.json(classifyRes.data);
  } catch (err) {
    console.error("Classification failed:", err.message);
    res.status(500).json({ error: "Classification failed" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { userId, imageUrl, category, subCategory } = req.body;

    let colors = [];
    try {
      const colorRes = await axios.post(`${COLOR_SERVICE_URL}/analyze-color`, { imageUrl });
      colors = colorRes.data.colors;
    } catch (colorErr) {
      console.error("Color analysis failed:", colorErr.message);
    }

    const newItem = new Item({ userId, imageUrl, category, subCategory, colors });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:userId", async (req, res) => {
  try {
    const items = await Item.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/item/:itemId", async (req, res) => {
  try {
    const { category, subCategory } = req.body;
    const updatedItem = await Item.findByIdAndUpdate(
      req.params.itemId,
      { category, subCategory },
      { new: true }
    );
    if (!updatedItem) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/item/:itemId/wear", async (req, res) => {
  try {
    const item = await Item.findById(req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    item.wornCount = (item.wornCount || 0) + 1;
    item.lastWornAt = new Date();
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/item/:itemId", async (req, res) => {
  try {
    const deletedItem = await Item.findByIdAndDelete(req.params.itemId);
    if (!deletedItem) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;