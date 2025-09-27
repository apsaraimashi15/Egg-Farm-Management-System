const mongoose = require("mongoose");
const Counter = require("./Counter");

const ticketSchema = new mongoose.Schema(
  {
    ticketNo: {
      type: String,
      unique: true,
      index: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    category: {
      type: String,
      enum: ["product", "billing", "technical", "general"],
      default: "general",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      index: true,
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate sequential ticketNo like TKT-000001
ticketSchema.pre("save", async function (next) {
  if (this.isNew && !this.ticketNo) {
    const counter = await Counter.findByIdAndUpdate(
      "ticketNo",
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const seq = String(counter.seq).padStart(6, "0");
    this.ticketNo = `TKT-${seq}`;
  }
  next();
});

// Full-text search on subject + message
ticketSchema.index({ subject: "text", message: "text" });

// Helpful compound index for common queries (buyer + status + priority)
ticketSchema.index({ buyerId: 1, status: 1, priority: 1, createdAt: -1 });

module.exports = mongoose.model("Ticket", ticketSchema);
