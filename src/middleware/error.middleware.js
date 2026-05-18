exports.errorHandler = (err, req, res, next) => {
  // Log the error
  console.error('❌ Error:', err);

  // Mongoose: invalid ObjectId → treat as 404 instead of leaking a 500
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(404).json({ message: 'Resource not found' });
  }

  // Mongoose: duplicate unique key (e.g. slug collision) → 400 with a readable message
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(400).json({ message: `${field} already exists` });
  }

  // Default to 500 if no status code is set
  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};