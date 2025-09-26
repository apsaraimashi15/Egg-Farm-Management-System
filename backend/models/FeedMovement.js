const mongoose = require("mongoose");
const { FEED_NAMES } = require("../constants/feed");

const feedMovementSchema = new mongoose.Schema(
  {
    feedName: { type: String, enum: FEED_NAMES, required: true },

    // Movement type
    type: { type: String, enum: ["RESTOCK", "USE"], required: true },

    // Always positive (we add/subtract in totals)
    qty: { type: Number, required: true, min: 0.0001 },

    // For RESTOCK
    unitPrice: { type: Number, min: 0, default: 0 }, // price per unit
    batchNo: { type: String, trim: true },
    expiryDate: { type: Date },

    // For USE
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    note: { type: String, trim: true },
  },
  { timestamps: true }
);

feedMovementSchema.index({ feedName: 1, createdAt: -1 });
feedMovementSchema.index({ type: 1 });

module.exports = mongoose.model("FeedMovement", feedMovementSchema);
