const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const ticketRoutes = require("./routes/tickets");
const feedRoutes = require("./routes/feedRoutes");

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.get("/ping", (req, res) => res.send("pong"));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/eggfarm")
  .then(async () => {
    console.log("MongoDB connected");

    // Create default admin user if not exists
    const adminExists = await User.findOne({ role: "admin" });
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin123", salt);
      const admin = new User({
        name: "System Admin",
        email: "admin@eggfarm.com",
        password: hashedPassword,
        role: "admin",
      });
      await admin.save();
      console.log("Default admin user created: admin@eggfarm.com / admin123");
    }
  })
  .catch((err) => console.log("MongoDB connection error:", err.message));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/tickets", ticketRoutes);
app.use("/api/feed", feedRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
