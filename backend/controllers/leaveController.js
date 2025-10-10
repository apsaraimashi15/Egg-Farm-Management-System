const Leave = require('../models/Leave');
const User = require('../models/User');

// Create a new leave request
exports.createLeaveRequest = async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body;
    
    // Validation
    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if endDate is after startDate
    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    const leave = new Leave({
      userId: req.user._id,
      startDate,
      endDate,
      reason
    });

    await leave.save();
    
    res.status(201).json({
      message: 'Leave request created successfully',
      leave
    });
  } catch (error) {
    console.error('Create leave request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all leave requests for a user
exports.getUserLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ userId: req.user._id })
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(leaves);
  } catch (error) {
    console.error('Get user leaves error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all leave requests with optional month/year filtering (HR Manager only)
exports.getLeaveRequests = async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = {};

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      query.startDate = { $gte: startDate, $lte: endDate };
    }

    const leaveRequests = await Leave.find(query).populate('userId', 'name email');
    res.json(leaveRequests);
  } catch (err) {
    console.error('Get leave requests error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update leave status (HR Manager only)
exports.updateLeaveStatus = async (req, res) => {
  try {
    const { leaveId, status } = req.body;
    
    // Validation
    if (!leaveId || !status) {
      return res.status(400).json({ message: 'Leave ID and status are required' });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    leave.status = status;
    leave.approvedBy = req.user._id;
    await leave.save();

    res.json({
      message: 'Leave status updated successfully',
      leave
    });
  } catch (error) {
    console.error('Update leave status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update leave request (Employee only, for pending requests)
exports.updateLeaveRequest = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { startDate, endDate, reason } = req.body;

    // Validation
    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if endDate is after startDate
    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Check if user is the owner and request is pending
    if (leave.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this leave request' });
    }
    if (leave.status !== 'pending') {
      return res.status(403).json({ message: 'Cannot update approved or rejected leave requests' });
    }

    leave.startDate = startDate;
    leave.endDate = endDate;
    leave.reason = reason;
    leave.updatedAt = new Date();
    await leave.save();

    res.json({
      message: 'Leave request updated successfully',
      leave
    });
  } catch (error) {
    console.error('Update leave request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete leave request
exports.deleteLeaveRequest = async (req, res) => {
  try {
    const { leaveId } = req.params;
    
    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Check if user is the owner or HR manager and request is pending
    if (leave.userId.toString() !== req.user._id.toString() && req.user.role !== 'hrmanager') {
      return res.status(403).json({ message: 'Not authorized to delete this leave request' });
    }
    if (leave.status !== 'pending' && req.user.role !== 'hrmanager') {
      return res.status(403).json({ message: 'Cannot delete approved or rejected leave requests' });
    }

    await leave.deleteOne();
    
    res.json({ message: 'Leave request deleted successfully' });
  } catch (error) {
    console.error('Delete leave request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};