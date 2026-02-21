const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/auth.controller");
const { authRateLimiter } = require("../middleware/rateLimiter.middleware");

const router = express.Router();

// Apply rate limiting to all auth routes
router.use(authRateLimiter);

// ── Validation rules ─────────────────────────────────────────

const registerValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address.")
    .normalizeEmail(),

  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters."),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters."),
];

const loginValidation = [
  body("email").trim().isEmail().withMessage("Please provide a valid email address.").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required."),
];

// ── Routes ───────────────────────────────────────────────────

// POST /api/auth/register
router.post("/register", registerValidation, authController.userRegisterController);

// POST /api/auth/login
router.post("/login", loginValidation, authController.userLoginController);

// POST /api/auth/logout
router.post("/logout", authController.userLogoutController);

module.exports = router;
