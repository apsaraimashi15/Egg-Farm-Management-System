const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eggfarm')
.then(async () => {
  console.log('MongoDB connected');

  // Create default admin user if not exists
  const adminExists = await User.findOne({ role: 'admin' });
  if (!adminExists) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    const admin = new User({
      name: 'System Admin',
      email: 'admin@eggfarm.com',
      password: hashedPassword,
      role: 'admin'
    });
    await admin.save();
    console.log('Default admin user created: admin@eggfarm.com / admin123');
  }

  // Create default buyer user if not exists
  const buyerExists = await User.findOne({ role: 'buyer' });
  if (!buyerExists) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('buyer123', salt);
    const buyer = new User({
      name: 'Sample Buyer',
      email: 'buyer@eggfarm.com',
      password: hashedPassword,
      role: 'buyer'
    });
    await buyer.save();
    console.log('Default buyer user created: buyer@eggfarm.com / buyer123');
  }
})
.catch(err => console.log('MongoDB connection error:', err.message));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/egg-production', require('./routes/EggProductionRoutes'));
app.use('/api/egg-stock',require('./routes/EggStockRoutes'));
app.use('/api/fertilizers',require('./routes/FertilizerRoutes'));
app.use('/api/reports',require('./routes/ReportRoutes'));
app.use('/api/alert',require('./routes/AlertRoutes'));
app.use('/api/employee', require('./routes/EmployeeRoutes'));
app.use('/api/purchases', require('./routes/PurchaseRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));