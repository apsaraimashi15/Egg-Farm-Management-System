const mongoose = require("mongoose");

const AlertSchema = new mongoose.Schema(
  {
    threshold: {
      type: Number,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Alert", AlertSchema);
