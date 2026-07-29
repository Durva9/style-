const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const itemsRouter = require("./routes/items");
const profileRouter = require("./routes/profile");
const weatherRouter = require("./routes/weather");
const analysisRouter = require("./routes/analysis");
const recommendRouter = require("./routes/recommend");
const savedOutfitsRouter = require("./routes/savedOutfits");
const fitAdvisorRouter = require("./routes/fitAdvisor");
const rankFitRouter = require("./routes/rankFit");
const wardrobeAnalyticsRouter = require("./routes/wardrobeAnalytics");
const tryOnRouter = require("./routes/tryOn");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/items", itemsRouter);
app.use("/api/profile", profileRouter);
app.use("/api/weather", weatherRouter);
app.use("/api/analysis", analysisRouter);
app.use("/api/recommend", recommendRouter);
app.use("/api/saved-outfits", savedOutfitsRouter);
app.use("/api/fit-advisor", fitAdvisorRouter);
app.use("/api/rank-fit", rankFitRouter);
app.use("/api/wardrobe-analytics", wardrobeAnalyticsRouter);
app.use("/api/tryon", tryOnRouter);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.get('/', (req, res) => {
  res.send('Style Vault API is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));