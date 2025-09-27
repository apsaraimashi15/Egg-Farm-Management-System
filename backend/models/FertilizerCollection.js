const mongoose = require('mongoose');

const FertilizerSchema = new mongoose.Schema({
  month: {
    type: String,
    required: true,
    unique: true // Ensures one record per month
  },
  quantityCollected: {
    type: Number,
    required: true
  },
  usedQuantity: {
    type: Number,
    default: 0
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FertilizerCollection', FertilizerSchema);
