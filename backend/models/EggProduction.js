const mongoose = require("mongoose");

const EggProductionSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      // REMOVED: unique: true - this was causing issues when trying to add multiple entries per date
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      required: false, // Make it optional since your frontend shows it can be empty
      trim: true,
      default: "Mixed", // Provide a default value
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index to prevent duplicate date+type combinations
EggProductionSchema.index({ date: 1, type: 1 }, { unique: true });

module.exports = mongoose.model("EggProduction", EggProductionSchema);

/*
const mongoose = require('mongoose');

const EggProductionSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    required: true, // optional, add if every entry must have a type
    trim: true      // optional, removes leading/trailing spaces
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('EggProduction', EggProductionSchema);
*/
