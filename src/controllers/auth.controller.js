const jwt = require("jsonwebtoken");
const { setAuthCookies, clearAuthCookies } = require("../services/token.service");

exports.login = async (req, res) => {
  const user = req.user;
  setAuthCookies(res, { id: user._id, role: user.role });
  res.json({ success: true });
};

exports.refresh = (req, res) => {
  const token = req.cookies.refreshToken;
  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  setAuthCookies(res, decoded);
  res.json({ success: true });
};

exports.logout = (_, res) => {
  clearAuthCookies(res);
  res.json({ success: true });
};
