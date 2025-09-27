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
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true // automatically adds createdAt and updatedAt
});

module.exports = mongoose.model('EggStock', EggStockSchema);
