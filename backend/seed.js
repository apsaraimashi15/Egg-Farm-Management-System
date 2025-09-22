const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eggfarm');
    console.log('MongoDB connected for seeding');

    // Check if admin already exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      // Update existing admin email and password
      adminExists.name = 'System Admin';
      adminExists.email = 'admin@gmail.com';
      const salt = await bcrypt.genSalt(10);
      adminExists.password = await bcrypt.hash('admin123', salt);
      await adminExists.save();
      console.log('Admin user updated successfully!');
      console.log('Email: admin@gmail.com');
      console.log('Password: admin123');
      console.log('Please change the password after first login.');
      process.exit(0);
    }

    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const admin = new User({
      name: 'System Admin',
      email: 'admin@gmail.com',
      password: hashedPassword,
      role: 'admin'
    });

    await admin.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@gmail.com');
    console.log('Password: admin123');
    console.log('Please change the password after first login.');

  } catch (error) {
    console.error('Error seeding admin:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedAdmin();