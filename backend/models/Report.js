const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  reportType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true
  },
  dateRange: {
    start: { type: Date, required: true },
    end: { type: Date, required: true }
  },
  eggProduced: {
    type: Number,
    required: true
  },
  fertilizerUsed: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Report', ReportSchema);
