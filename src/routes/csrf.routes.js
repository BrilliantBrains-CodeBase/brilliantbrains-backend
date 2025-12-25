const router = require("express").Router();

/**
 * Returns CSRF token to the client
 * This endpoint MUST be called before any POST/PUT/DELETE request
 */
router.get("/token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

module.exports = router;
