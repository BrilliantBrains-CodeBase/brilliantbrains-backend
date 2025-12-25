const jwt = require("jsonwebtoken");

exports.authenticate = (req, _, next) => {
  const token = req.cookies.accessToken;
  req.user = jwt.verify(token, process.env.JWT_SECRET);
  next();
};
