const express = require("express");
const router = express.Router();
const Item = require("../models/Item");
const UserProfile = require("../models/UserProfile");

const COLOR_PALETTE = {
  black: [0, 0, 0],
  white: [255, 255, 255],
  red: [200, 30, 30],
  blue: [40, 70, 180],
  green: [40, 120, 60],
  yellow: [220, 200, 40],
  pink: [230, 140, 170],
  beige: [220, 200, 170],
  brown: [110, 70, 40],
  purple: [120, 60, 150],
};

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.substring(0, 2), 16),
    parseInt(clean.substring(2, 4), 16),
    parseInt(clean.substring(4, 6), 16),
  ];
}

function nearestColorName(hex) {
  const [r, g, b] = hexToRgb(hex);
  let closest = null;
  let closestDist = Infinity;
  for (const [name, [pr, pg, pb]] of Object.entries(COLOR_PALETTE)) {
    const dist = Math.sqrt((r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2);
    if (dist < closestDist) {
      closestDist = dist;
      closest = name;
    }
  }
  return closest;
}

function getWeatherCategories(temperature) {
  if (temperature >= 30) return ["tshirt", "dress"];
  if (temperature >= 20) return ["tshirt", "shirt", "jeans", "dress"];
  if (temperature >= 10) return ["shirt", "jeans", "dress"];
  return ["shirt", "jeans"];
}

const OCCASION_CATEGORIES = {
  casual: ["tshirt", "jeans"],
  work: ["shirt", "jeans"],
  party: ["dress", "shirt", "jeans"],
  wedding: ["dress", "shirt"],
  festive: ["dress", "shirt"],
  sports: ["tshirt", "jeans"],
  travel: ["tshirt", "jeans"],
};

const CROWD_EXCLUSIONS = {
  professional: ["tshirt"],
  intimate: [],
  social: [],
  festive: [],
  family: [],
  friends: [],
};

function scoreItem(item, allowedCategories, sessionColors, profileColors) {
  let score = 0;
  const reasons = [];

  if (allowedCategories.includes(item.category)) {
    score += 1;
    reasons.push("fits today's weather and occasion");
  }

  if (item.colors && item.colors.length > 0) {
    const topColorName = nearestColorName(item.colors[0].hex);
    if (sessionColors.includes(topColorName)) {
      score += 3;
      reasons.push(`matches your chosen color for this outfit (${topColorName})`);
    } else if (profileColors.includes(topColorName)) {
      score += 1.5;
      reasons.push(`matches your preferred color (${topColorName})`);
    }
  }

  return { score, reasons };
}

function pickBest(items, category, allowedCategories, sessionColors, profileColors) {
  const candidates = items.filter((i) => i.category === category);
  if (candidates.length === 0) return null;

  let best = null;
  let bestScore = -1;
  let bestReasons = [];

  for (const item of candidates) {
    const { score, reasons } = scoreItem(item, allowedCategories, sessionColors, profileColors);
    if (score > bestScore) {
      bestScore = score;
      best = item;
      bestReasons = reasons;
    }
  }

  return { item: best, reasons: bestReasons };
}

router.post("/", async (req, res) => {
  try {
    const {
      userId,
      temperature,
      occasion,
      venueType,
      crowdType,
      colorPreference,
      customColorHex,
    } = req.body;

    if (!userId || temperature === undefined || !occasion) {
      return res.status(400).json({ error: "userId, temperature, and occasion are required" });
    }

    const profile = (await UserProfile.findOne({ userId })) || {};
    const profileColors = profile.preferredColors || [];

    let sessionColors = Array.isArray(colorPreference) ? [...colorPreference] : [];
    if (customColorHex) {
      sessionColors.push(nearestColorName(customColorHex));
    }

    const items = await Item.find({ userId });

    if (items.length === 0) {
      return res.json({ outfit: {}, reasoning: {}, message: "Your wardrobe is empty. Add some items first!" });
    }

    let weatherCategories = getWeatherCategories(temperature);

    if (venueType === "indoor") {
      weatherCategories = Array.from(new Set([...weatherCategories, "shirt", "jeans", "tshirt"]));
    }

    const occasionCategories = OCCASION_CATEGORIES[occasion] || Object.values(OCCASION_CATEGORIES).flat();
    let allowedCategories = weatherCategories.filter((c) => occasionCategories.includes(c));

    const exclusions = CROWD_EXCLUSIONS[crowdType] || [];
    allowedCategories = allowedCategories.filter((c) => !exclusions.includes(c));

    const finalAllowed = allowedCategories.length > 0 ? allowedCategories : weatherCategories;

    const dressPick = pickBest(items, "dress", finalAllowed, sessionColors, profileColors);
    const useDress = finalAllowed.includes("dress") && dressPick && dressPick.item;

    const outfit = {};
    const reasoning = {};

    if (useDress) {
      outfit.dress = dressPick.item;
      reasoning.dress = dressPick.reasons;
    } else {
      const topPick =
        pickBest(items, "tshirt", finalAllowed, sessionColors, profileColors) ||
        pickBest(items, "shirt", finalAllowed, sessionColors, profileColors);
      if (topPick && topPick.item) {
        outfit.top = topPick.item;
        reasoning.top = topPick.reasons;
      }

      const bottomPick = pickBest(items, "jeans", finalAllowed, sessionColors, profileColors);
      if (bottomPick && bottomPick.item) {
        outfit.bottom = bottomPick.item;
        reasoning.bottom = bottomPick.reasons;
      }
    }

    if (Object.keys(outfit).length === 0) {
      return res.json({ outfit: {}, reasoning: {}, message: "Couldn't find a matching outfit. Try adding more variety to your wardrobe!" });
    }

    res.json({ outfit, reasoning });
  } catch (err) {
    console.error("Recommendation failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;