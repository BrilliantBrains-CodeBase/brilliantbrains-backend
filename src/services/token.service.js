const jwt = require("jsonwebtoken");
const env = require("../config/env");

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict"
};

exports.setAuthCookies = (res, payload) => {
  res.cookie(
    "accessToken",
    jwt.sign(payload, env.JWT_SECRET, { expiresIn: "15m" }),
    { ...cookieOptions, maxAge: 15 * 60 * 1000 }
  );

  res.cookie(
    "refreshToken",
    jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: "7d" }),
    { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 }
  );
};
