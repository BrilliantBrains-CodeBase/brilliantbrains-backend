const CareerSettings = require("../models/CareerSettings.model");
const ApiResponse = require("../utils/ApiResponse");

exports.getSettings = async (req, res) => {
  let settings = await CareerSettings.findOne({ singleton: "career_settings" });
  if (!settings) {
    // Bootstrap defaults on first access
    settings = await CareerSettings.create({});
  }
  return res.status(200).json(new ApiResponse(200, settings, "Career settings fetched"));
};

exports.updateSettings = async (req, res) => {
  // Prevent overwriting the singleton key
  const { singleton, ...updates } = req.body;

  const settings = await CareerSettings.findOneAndUpdate(
    { singleton: "career_settings" },
    { $set: updates },
    { new: true, upsert: true, runValidators: true }
  );
  return res.status(200).json(new ApiResponse(200, settings, "Career settings updated"));
};
