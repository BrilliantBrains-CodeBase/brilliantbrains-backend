exports.ApiResponse = (data, message = "success") => ({
  success: true,
  message,
  data
});
