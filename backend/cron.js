// This file sets up automated daily attendance marking
// Run this in your main app file: require('./cron');

const cron = require('node-cron');
const User = require('./models/User');
const Leave = require('./models/Leave');
const Attendance = require('./models/Attendance');

async function markDailyAttendance() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const employees = await User.find({ role: 'employee' });

    for (let emp of employees) {
      // Skip if already marked
      const existing = await Attendance.findOne({ userId: emp._id, date: today });
      if (existing) continue;

      // Check for approved leave
      const leave = await Leave.findOne({
        userId: emp._id,
        startDate: { $lte: today },
        endDate: { $gte: today },
        status: 'approved'
      });

      const status = leave ? 'leave' : 'present';

      await new Attendance({ userId: emp._id, date: today, status }).save();
    }

    console.log('Daily attendance marked successfully');
  } catch (error) {
    console.error('Daily attendance marking error:', error);
  }
}

// Schedule to run every day at midnight
cron.schedule('0 0 * * *', markDailyAttendance);

console.log('Attendance cron job scheduled');