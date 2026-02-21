const express = require("express");
const { body } = require("express-validator");
const authMiddleware = require("../middleware/auth.middleware");
const { getProfileController, updateProfileController } = require("../controllers/profile.controller");

const router = express.Router();

// All profile routes require authentication
router.use(authMiddleware.authMiddleware);

/**
 * GET /api/profile
 * Returns the authenticated user's non-sensitive profile fields.
 */
router.get("/", getProfileController);

/**
 * PATCH /api/profile
 * Updates allowed profile fields with input validation.
 */
router.patch(
  "/",
  [
    body("name")
      .optional()
      .isString()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters."),

    body("phoneNumber")
      .optional()
      .isString()
      .trim()
      .matches(/^\+?[\d\s\-()]{7,20}$/)
      .withMessage("Please provide a valid phone number."),

    body("address")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 300 })
      .withMessage("Address must be at most 300 characters."),

    body("dateOfBirth")
      .optional()
      .isISO8601()
      .withMessage("dateOfBirth must be a valid ISO 8601 date (e.g. 1990-06-15).")
      .custom((value) => {
        // Ensure the user is not born in the future.
        if (new Date(value) >= new Date()) {
          throw new Error("dateOfBirth cannot be in the future.");
        }
        return true;
      }),
  ],
  updateProfileController
);

module.exports = router;
