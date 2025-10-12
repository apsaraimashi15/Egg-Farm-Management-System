const mongoose = require("mongoose");

const FertilizerSchema = new mongoose.Schema(
  {
    month: {
      type: String,
      required: true,
      unique: true, // Ensures one record per month
    },
    quantityCollected: {
      type: Number,
      required: true,
    },
    usedQuantity: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("FertilizerCollection", FertilizerSchema);
