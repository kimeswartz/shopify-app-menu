import express from "express";
const connectDB = require("./config/db");
const Settings = require("./models/SettingsModel");
const app = express();
const PORT = process.env.PORT || 300;

connectDB();

app.use(express.json());

// Hämta inställningar
app.get("/api/settings", async (req, res) => {
  try {
    const settings = await Settings.findOne();
    req.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Uppdatera inställningar
app.put("/api/settings", async (req, res) => {
  const { color, logo, campaignImage } = req.body;
  try {
    const settings = await Settings.findOneAndUpdate(
      {},
      { color, logo, campaignImage },
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});