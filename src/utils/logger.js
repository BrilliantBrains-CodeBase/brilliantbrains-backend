// Supports both import patterns:
//   const { logger } = require("./utils/logger")  → logger = console
//   const logger     = require("./utils/logger")   → logger.info / logger.error work directly
exports.logger = console;
exports.info  = (...a) => console.info(...a);
exports.error = (...a) => console.error(...a);
exports.warn  = (...a) => console.warn(...a);
exports.debug = (...a) => console.debug(...a);
exports.log   = (...a) => console.log(...a);
