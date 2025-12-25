exports.errorHandler = (err, _, res, __) => {
  res.status(500).json({ message: err.message });
};
