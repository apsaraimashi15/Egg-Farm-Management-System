const express = require('express');
const router = express.Router();
const alertController = require('../middleware/AlertController');
const { auth, authorize } = require('../middleware/auth');

// Check current stock against threshold (admin or employee)
router.get('/alert/check', auth, authorize('admin', 'employee'), alertController.checkStock);

// Set alert threshold (admin only)
router.post('/alert/threshold', auth, authorize('admin'), alertController.setThreshold);

module.exports = router;
