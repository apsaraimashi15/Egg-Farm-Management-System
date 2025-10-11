const mongoose = require('mongoose');

const EggStockSchema = new mongoose.Schema({
  eggType: {
    type: String,
    required: true,
    trim: true
  },
  currentStock: {
    type: Number,
    required: true,
    default: 0
  }
}, {
  timestamps: true // automatically adds createdAt and updatedAt
});

module.exports = mongoose.model('EggStock', EggStockSchema);
