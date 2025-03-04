import express from "express";
import Settings from "../SettingsModel.js";

const router = express.Router();

// Get settings
router.get("/", async (req, res) => {
  try {
    const settings = await Settings.findOne();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update settings
router.put("/", async (req, res) => {
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

export default router;
