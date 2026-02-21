const userModel = require("../models/user.model");
const { validationResult } = require("express-validator");

/**
 * Get the authenticated user's profile.
 * GET /api/profile
 * Returns only non-sensitive fields.
 */
async function getProfileController(req, res) {
  try {
    const user = await userModel.findById(req.user._id).select(
      "name email phoneNumber address dateOfBirth createdAt"
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error("[Profile] getProfile error:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
}

/**
 * Update the authenticated user's profile.
 * PATCH /api/profile
 * Allowed fields: name, phoneNumber, address, dateOfBirth.
 * Password and email changes are intentionally excluded from this endpoint.
 */
async function updateProfileController(req, res) {
  // Check express-validator results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  try {
    const allowedUpdates = ["name", "phoneNumber", "address", "dateOfBirth"];
    const updates = {};

    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update.",
      });
    }

    const updatedUser = await userModel
      .findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
      .select("name email phoneNumber address dateOfBirth updatedAt");

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: updatedUser,
    });
  } catch (err) {
    console.error("[Profile] updateProfile error:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
}

module.exports = { getProfileController, updateProfileController };
