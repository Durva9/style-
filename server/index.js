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

// ---------- MongoDB: connect with automatic retry (never gives up) ----------
const RETRY_MS = 5000;

async function connectWithRetry() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      family: 4, // force IPv4 - avoids a common Windows/Atlas connection failure
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error(`MongoDB connection failed: ${err.message.split('\n')[0]}`);
    console.error(
      'Checklist: (1) Atlas > Network Access has your IP or 0.0.0.0/0 and is ACTIVE, ' +
      '(2) cluster is not paused, (3) MONGO_URI user/password correct, ' +
      '(4) network allows port 27017 (try phone hotspot).'
    );
    console.error(`Retrying in ${RETRY_MS / 1000}s...`);
    setTimeout(connectWithRetry, RETRY_MS);
  }
}

mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected (driver will auto-reconnect)'));
mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected'));

connectWithRetry();

app.get('/', (req, res) => {
  res.send('Style Vault API is running');
});

app.get('/health', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({ server: 'ok', mongo: states[mongoose.connection.readyState] });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));