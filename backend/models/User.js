const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['employee', 'buyer', 'admin', 'hrmanager'],
    default: 'employee'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  otp: {
    type: String,
    required: false
  },
  otpExpires: {
    type: Date,
    required: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);