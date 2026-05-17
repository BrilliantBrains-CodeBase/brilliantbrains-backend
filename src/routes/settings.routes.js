const router = require("express").Router();
const controller = require("../controllers/settings.controller");
const { authenticate, requirePermission } = require("../middleware/auth.middleware");
const { csrfProtection } = require("../middleware/csrf.middleware");

// PUBLIC ROUTES
router.get("/", controller.getSettings);

// ADMIN ROUTES
router.use(authenticate);
router.use(requirePermission("settings"));

router.patch("/", csrfProtection, controller.updateSettings);
router.patch("/brand", csrfProtection, controller.updateBrand);
router.patch("/socials", csrfProtection, controller.updateSocials);
router.patch("/addresses", csrfProtection, controller.updateAddresses);
router.patch("/contacts", csrfProtection, controller.updateContacts);

module.exports = router;
