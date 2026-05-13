const path = require("path");
const fs = require("fs");
const Media = require("../models/Media.model");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

/**
 * @desc    Upload media files
 * @route   POST /api/media/upload
 * @access  Private (Admin/SuperAdmin)
 */
exports.uploadMedia = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new ApiError(400, "No files uploaded");
    }

    const mediaEntries = await Promise.all(
      req.files.map(async (file) => {
        // Construct the full URL
        // In production, you would use your domain
        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const url = `${baseUrl}/uploads/${file.filename}`;

        return await Media.create({
          originalName: file.originalname,
          filename: file.filename,
          mimeType: file.mimetype,
          size: file.size,
          url: url,
          uploadedBy: req.user._id
        });
      })
    );

    return res.status(201).json(
      new ApiResponse(201, mediaEntries, "Media uploaded successfully")
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all media with pagination
 * @route   GET /api/media
 * @access  Private (Admin/SuperAdmin)
 */
exports.getAllMedia = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;

    const query = {};
    if (search) {
      query.originalName = { $regex: search, $options: "i" };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const media = await Media.find(query)
      .sort("-createdAt")
      .skip(skip)
      .limit(parseInt(limit))
      .populate("uploadedBy", "name email");

    const total = await Media.countDocuments(query);

    return res.status(200).json(
      new ApiResponse(200, {
        media,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        }
      }, "Media fetched successfully")
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete media
 * @route   DELETE /api/media/:id
 * @access  Private (Admin/SuperAdmin)
 */
exports.deleteMedia = async (req, res, next) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) throw new ApiError(404, "Media not found");

    // Physical file path
    const filePath = path.join(process.cwd(), "public/uploads", media.filename);
    console.log("Attempting to delete file at:", filePath);

    // Delete from DB
    await Media.findByIdAndDelete(req.params.id);

    // Delete physical file if exists
    if (fs.existsSync(filePath)) {
      console.log("File exists, unlinking...");
      fs.unlinkSync(filePath);
    } else {
      console.log("File does NOT exist at path:", filePath);
    }

    return res.status(200).json(
      new ApiResponse(200, null, "Media deleted successfully")
    );
  } catch (error) {
    next(error);
  }
};
