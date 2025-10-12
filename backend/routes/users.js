const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { auth, authorize } = require("../middleware/auth");

const router = express.Router();

// Get all users (admin and hrmanager only)
router.get("/", auth, authorize("admin", "hrmanager"), async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get user by ID (admin and hrmanager only)
router.get("/:id", auth, authorize("admin", "hrmanager"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Create user (admin and hrmanager only)
router.post("/", auth, authorize("admin", "hrmanager"), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!["employee", "buyer", "admin", "hrmanager"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });

    await user.save();

    const userResponse = await User.findById(user._id).select("-password");
    res.status(201).json(userResponse);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update user (admin and hrmanager only)
router.put("/:id", auth, authorize("admin", "hrmanager"), async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body;

    // Validation
    if (!name || !email || !role) {
      return res
        .status(400)
        .json({ message: "Name, email, and role are required" });
    }

    if (!["employee", "buyer", "admin", "hrmanager"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Check if email is taken by another user
    const existingUser = await User.findOne({
      email,
      _id: { $ne: req.params.id },
    });
    if (existingUser) {
      return res.status(400).json({ message: "Email already taken" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, isActive },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete user (admin and hrmanager only)
router.delete(
  "/:id",
  auth,
  authorize("admin", "hrmanager"),
  async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Change password (authenticated user can change their own password)
router.put("/:id/password", auth, async (req, res) => {
  try {
    // Users can only change their own password, admins can change anyone's
    if (
      req.user.role !== "admin" &&
      req.user._id.toString() !== req.params.id
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If not admin, verify current password
    if (req.user.role !== "admin") {
      if (!currentPassword) {
        return res
          .status(400)
          .json({ message: "Current password is required" });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
