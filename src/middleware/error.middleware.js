exports.errorHandler = (err, req, res, next) => {
  // Log the error
  console.error('❌ Error:', err);

  // Default to 500 if no status code is set
  const statusCode = err.statusCode || err.status || 500;
  
  res.status(statusCode).json({ 
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};