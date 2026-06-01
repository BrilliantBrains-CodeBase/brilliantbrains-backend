const { getDashboardMetrics } = require("../services/dashboard.service");
const { toDashboardResponse }  = require("../dto/dashboard.dto");
const ApiResponse              = require("../utils/ApiResponse");
const ApiError                 = require("../utils/ApiError");
const { logger }               = require("../utils/logger");

exports.getDashboard = async (req, res, next) => {
  try {
    const raw  = await getDashboardMetrics();
    const data = toDashboardResponse(raw);
    logger.info(`[Dashboard] Served to user ${req.user?._id} (${req.user?.role})`);
    res.json(new ApiResponse(200, data, "Dashboard metrics fetched"));
  } catch (err) {
    logger.error("[Dashboard] Failed to fetch metrics:", err.message);
    next(new ApiError(500, "Failed to load dashboard metrics: " + err.message));
  }
};
