const COLOR_PALETTE = {
  black: [0, 0, 0], white: [255, 255, 255], red: [200, 30, 30], blue: [40, 70, 180],
  green: [40, 120, 60], yellow: [220, 200, 40], pink: [230, 140, 170], beige: [220, 200, 170],
  brown: [110, 70, 40], purple: [120, 60, 150], navy: [20, 30, 80],
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

// Colors tiered by how well they classically complement each skin tone
const SKIN_TONE_TIERS = {
  fair: { best: ["navy", "blue", "purple"], good: ["green", "pink", "brown"], neutral: ["black", "white", "beige"], avoid: ["yellow"] },
  light: { best: ["blue", "purple", "pink"], good: ["beige", "green", "navy"], neutral: ["black", "white"], avoid: ["yellow"] },
  medium: { best: ["brown", "green", "red"], good: ["purple", "navy", "blue"], neutral: ["black", "white", "beige"], avoid: [] },
  olive: { best: ["green", "brown", "yellow"], good: ["beige", "navy"], neutral: ["black", "white"], avoid: ["pink"] },
  tan: { best: ["brown", "red", "white"], good: ["beige", "yellow"], neutral: ["black", "navy"], avoid: ["purple"] },
  deep: { best: ["white", "red", "yellow"], good: ["blue", "pink"], neutral: ["black", "beige"], avoid: ["brown"] },
};

const TIER_POINTS = { best: 3, good: 1.5, neutral: 0.3, avoid: -1.5 };

function colorTierFor(skinTone, colorName) {
  const tiers = SKIN_TONE_TIERS[skinTone];
  if (!tiers) return null;
  for (const tier of ["best", "good", "neutral", "avoid"]) {
    if (tiers[tier].includes(colorName)) return tier;
  }
  return null;
}

// How well each clothing category classically flatters each body type (0-2 scale)
const CATEGORY_BODY_FIT = {
  hourglass: { dress: 2.0, shirt: 1.5, tshirt: 1.0, jeans: 1.2 },
  pear: { dress: 1.5, shirt: 1.8, tshirt: 1.3, jeans: 1.0 },
  apple: { dress: 1.8, shirt: 1.0, tshirt: 0.8, jeans: 1.0 },
  rectangle: { dress: 1.3, shirt: 1.5, tshirt: 1.0, jeans: 1.2 },
  "inverted-triangle": { dress: 1.2, shirt: 0.8, tshirt: 0.8, jeans: 1.6 },
};

const BODY_TYPE_TIPS = {
  hourglass: "Fitted styles that follow your natural waistline tend to work especially well for your body type.",
  pear: "Tops with a bit more detail or brightness, paired with simpler bottoms, can help balance your proportions.",
  apple: "Looser, flowier fits around the middle are often flattering for your body type.",
  rectangle: "Styles with waist definition (like a belt or fitted cut) can help create shape.",
  "inverted-triangle": "Simpler tops paired with fuller or more detailed bottoms can help balance your silhouette.",
};

function scoreGarment(colors, category, skinTone, bodyType) {
  const reasons = [];
  let score = 5; // neutral baseline

  if (colors && colors.length > 0) {
    const top = colors[0];
    const topColorName = nearestColorName(top.hex);
    const topWeight = (top.percentage || 50) / 100;

    if (skinTone && SKIN_TONE_TIERS[skinTone]) {
      const tier = colorTierFor(skinTone, topColorName);
      if (tier) {
        const points = TIER_POINTS[tier] * (0.6 + topWeight * 0.8); // scale by how dominant this color is
        score += points;

        if (tier === "best") reasons.push(`This ${topColorName} tone is a classic flattering match for ${skinTone} skin tones.`);
        else if (tier === "good") reasons.push(`This ${topColorName} tone works reasonably well with ${skinTone} skin tones.`);
        else if (tier === "neutral") reasons.push(`This ${topColorName} tone is a safe, neutral choice for most skin tones.`);
        else reasons.push(`This ${topColorName} tone isn't among the classic best matches for ${skinTone} skin tones.`);
      }

      // Secondary color, smaller influence
      if (colors[1]) {
        const secondColorName = nearestColorName(colors[1].hex);
        const secondTier = colorTierFor(skinTone, secondColorName);
        if (secondTier) {
          score += TIER_POINTS[secondTier] * 0.3;
        }
      }
    } else {
      reasons.push("Set your skin tone in your Style Profile for a more personalized color assessment.");
    }
  } else {
    reasons.push("Couldn't clearly detect the garment's color from this photo.");
  }

  if (bodyType && CATEGORY_BODY_FIT[bodyType]) {
    const fitScore = CATEGORY_BODY_FIT[bodyType][category];
    if (fitScore !== undefined) {
      score += fitScore;
      reasons.push(BODY_TYPE_TIPS[bodyType]);
    }
  } else if (bodyType) {
    reasons.push(BODY_TYPE_TIPS[bodyType] || "");
  } else {
    reasons.push("Set your body type in your Style Profile for a more personalized fit tip.");
  }

  score = Math.max(1, Math.min(10, score));
  score = Math.round(score * 10) / 10; // one decimal place

  return { score, reasons: reasons.filter(Boolean) };
}

module.exports = { nearestColorName, scoreGarment };