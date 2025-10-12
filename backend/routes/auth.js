const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Add debug options
  debug: true,
  logger: true,
});

// Verify transporter
transporter.verify((error, success) => {
  if (error) {
    console.log("Email transporter error:", error);
  } else {
    console.log("Email transporter is ready");
  }
});

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTPEmail = async (email, otp) => {
  // Always log OTP for development/testing
  console.log(`\n=== OTP for ${email} ===\n${otp}\n=======================\n`);

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP for Egg Farm Registration",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Welcome to Egg Farm!</h2>
          <p>Your OTP for account verification is:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; color: #059669; letter-spacing: 4px;">${otp}</span>
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <br>
          <p>Best regards,<br>Egg Farm Team</p>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending email:", error);
    // Continue execution even if email fails - OTP is logged above
  }
};

// Register - Send OTP
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Check if user already exists and is verified
    const existingUser = await User.findOne({ email });
    if (existingUser && !existingUser.otp) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (existingUser) {
      // Update existing user with new OTP
      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.role = role || "employee";
      existingUser.otp = otp;
      existingUser.otpExpires = otpExpires;
      await existingUser.save();
    } else {
      // Create new user with OTP
      const user = new User({
        name,
        email,
        password: hashedPassword,
        role: role || "employee",
        otp,
        otpExpires,
      });
      await user.save();
    }

    // Send OTP email
    await sendOTPEmail(email, otp);

    res.status(200).json({
      message:
        "OTP sent to your email. Please verify to complete registration.",
      email,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Verify OTP and complete registration
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validation
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    // Find user with matching email and OTP
    const user = await User.findOne({
      email,
      otp,
      otpExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Clear OTP and mark as verified
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({ message: "Account is deactivated" });
    }

    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get current user
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
