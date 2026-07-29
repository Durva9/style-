const express = require("express");
const router = express.Router();
const axios = require("axios");

const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

router.get("/", async (req, res) => {
  try {
    const { city, lat, lon } = req.query;

    let params = {
      appid: process.env.OPENWEATHER_API_KEY,
      units: "metric",
    };

    if (lat && lon) {
      params.lat = lat;
      params.lon = lon;
    } else if (city) {
      params.q = city;
    } else {
      return res.status(400).json({ error: "Provide either city or lat/lon" });
    }

    const response = await axios.get(OPENWEATHER_BASE_URL, { params });
    const data = response.data;

    res.json({
      city: data.name,
      temperature: data.main.temp,
      feelsLike: data.main.feels_like,
      condition: data.weather[0].main,
      description: data.weather[0].description,
      humidity: data.main.humidity,
      icon: data.weather[0].icon,
    });
  } catch (err) {
    console.error("Weather fetch failed:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

module.exports = router;