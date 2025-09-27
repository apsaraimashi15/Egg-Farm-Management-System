const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { auth, authorize } = require('../middleware/auth');

// Create leave request (employees only)
router.post('/', auth, authorize('employee'), leaveController.createLeaveRequest);

// Get user's own leave requests (employees only)
router.get('/my-leaves', auth, authorize('employee'), leaveController.getUserLeaves);

// Get all leave requests (HR manager only)
router.get('/', auth, authorize('hrmanager'), leaveController.getAllLeaves);

// Update leave status (HR manager only)
router.put('/status', auth, authorize('hrmanager'), leaveController.updateLeaveStatus);

// Delete leave request (owner or HR manager)
router.delete('/:leaveId', auth, leaveController.deleteLeaveRequest);

module.exports = router;