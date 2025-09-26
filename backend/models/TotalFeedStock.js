const mongoose = require("mongoose");
const { FEED_NAMES } = require("../constants/feed");

const totalFeedStockSchema = new mongoose.Schema(
  {
    feedName: { type: String, enum: FEED_NAMES, unique: true, required: true },

    // Live quantity in your base unit (e.g. kg)
    quantity: { type: Number, required: true, default: 0, min: 0 },

    // Total inventory value (WAC)
    totalCost: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true }
);

totalFeedStockSchema.index({ feedName: 1 }, { unique: true });

module.exports = mongoose.model("TotalFeedStock", totalFeedStockSchema);
