const express = require("express");
const router = express.Router();
const Item = require("../models/Item");
const SavedOutfit = require("../models/SavedOutfit");

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const items = await Item.find({ userId });
    const savedOutfits = await SavedOutfit.find({ userId });

    const sortedByWear = [...items].sort((a, b) => (b.wornCount || 0) - (a.wornCount || 0));
    const mostWorn = sortedByWear.slice(0, 5).filter((i) => (i.wornCount || 0) > 0);
    const neverWorn = items.filter((i) => !i.wornCount || i.wornCount === 0);

    const colorCounts = {};
    items.forEach((item) => {
      if (item.colors && item.colors.length > 0) {
        const topHex = item.colors[0].hex;
        colorCounts[topHex] = (colorCounts[topHex] || 0) + 1;
      }
    });
    const favoriteColors = Object.entries(colorCounts)
      .map(([hex, count]) => ({ hex, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const categoryCounts = {};
    items.forEach((item) => {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
    });

    const growthByMonth = {};
    items.forEach((item) => {
      const date = new Date(item.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      growthByMonth[key] = (growthByMonth[key] || 0) + 1;
    });
    const growthTimeline = Object.entries(growthByMonth)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const occasionCounts = {};
    savedOutfits.forEach((outfit) => {
      const key = outfit.occasion || "unspecified";
      occasionCounts[key] = (occasionCounts[key] || 0) + 1;
    });

    res.json({
      totalItems: items.length,
      totalWornEvents: items.reduce((sum, i) => sum + (i.wornCount || 0), 0),
      mostWorn: mostWorn.map((i) => ({
        _id: i._id,
        imageUrl: i.imageUrl,
        category: i.category,
        wornCount: i.wornCount,
      })),
      neverWornCount: neverWorn.length,
      neverWorn: neverWorn.slice(0, 8).map((i) => ({
        _id: i._id,
        imageUrl: i.imageUrl,
        category: i.category,
      })),
      favoriteColors,
      categoryCounts,
      growthTimeline,
      savedOutfitsCount: savedOutfits.length,
      occasionCounts,
    });
  } catch (err) {
    console.error("Wardrobe analytics failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;