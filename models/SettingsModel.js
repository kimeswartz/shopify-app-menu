import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
  color: {type: String, required: true },
  logo: {type: String, required: true },
  campaignImage: {type: String, required: true},
});

module.exports = mongoose.model('Settings', SettingsSchema);