const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    productType: {
      type: String,
      required: true,
      enum: ['eggs', 'fertilizer', 'feed']
    },
    productName: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank_transfer'],
    default: 'cash'
  },
  notes: String
}, {
  timestamps: true
});

// Index for efficient queries
purchaseSchema.index({ buyer: 1, createdAt: -1 });
purchaseSchema.index({ status: 1 });

module.exports = mongoose.model('Purchase', purchaseSchema);