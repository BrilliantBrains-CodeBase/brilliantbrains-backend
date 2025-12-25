exports.validate = (schema) => (req, _, next) => {
  schema.parse({ body: req.body });
  next();
};
