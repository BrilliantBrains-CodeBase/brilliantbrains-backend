exports.healthCheck = (_, res) => {
  res.json({ status: "OK", timestamp: new Date() });
};
