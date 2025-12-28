const ApiError = require("../utils/ApiError");

exports.validate = (schema) => (req, _res, next) => {
  try {
    schema.parse({ body: req.body });
    next();
  } catch (err) {
    next(
      new ApiError(
        400,
        err.errors?.[0]?.message || "Validation failed"
      )
    );
  }
};
