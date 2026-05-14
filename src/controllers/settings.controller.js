const Settings = require("../models/Settings.model");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

/**
 * @route   GET /api/settings
 * @desc    Get all global settings
 * @access  Public
 */
exports.getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    
    // Create default settings if none exist
    if (!settings) {
      settings = await Settings.create({});
    }

    return res.status(200).json(
      new ApiResponse(200, settings, "Settings fetched successfully")
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/settings
 * @desc    Update global settings
 * @access  Admin/SuperAdmin
 */
exports.updateSettings = async (req, res, next) => {
  try {
    const updateData = req.body;

    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings(updateData);
    } else {
      // Merge updateData into settings
      // We use Object.assign or granular updates
      Object.assign(settings, updateData);
    }

    await settings.save();

    return res.status(200).json(
      new ApiResponse(200, settings, "Settings updated successfully")
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/settings/brand
 * @desc    Update brand settings specifically
 */
exports.updateBrand = async (req, res, next) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      {},
      { $set: { brand: req.body } },
      { new: true, upsert: true }
    );
    return res.status(200).json(new ApiResponse(200, settings.brand, "Brand settings updated"));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/settings/socials
 * @desc    Update socials specifically
 */
exports.updateSocials = async (req, res, next) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      {},
      { $set: { socials: req.body } },
      { new: true, upsert: true }
    );
    return res.status(200).json(new ApiResponse(200, settings.socials, "Socials updated"));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/settings/addresses
 * @desc    Update addresses specifically
 */
exports.updateAddresses = async (req, res, next) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      {},
      { $set: { addresses: req.body } },
      { new: true, upsert: true }
    );
    return res.status(200).json(new ApiResponse(200, settings.addresses, "Addresses updated"));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/settings/contacts
 * @desc    Update contacts specifically
 */
exports.updateContacts = async (req, res, next) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      {},
      { $set: { contacts: req.body } },
      { new: true, upsert: true }
    );
    return res.status(200).json(new ApiResponse(200, settings.contacts, "Contact details updated"));
  } catch (error) {
    next(error);
  }
};
