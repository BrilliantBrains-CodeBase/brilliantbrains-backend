/**
 * Standard API success response wrapper
 * Used across controllers for consistency
 */
class ApiResponse {
  constructor(statusCode, data = null, message = "Success") {
    this.success = true;
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
  }
}

module.exports = ApiResponse;
