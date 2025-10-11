const express = require('express');
const router = express.Router();
const fertilizerController = require('../middleware/FertilizerController');
const { auth, authorize } = require('../middleware/auth');

// Record monthly fertilizer collection (admin only)
router.post('/', auth, authorize('admin','employee'), fertilizerController.recordFertilizer);

// Update used quantity (admin or employee)
router.patch('/', auth, authorize('admin', 'employee'), fertilizerController.updateUsedQuantity);

// Get all fertilizer records (admin or employee)
router.get('/', auth, authorize('admin', 'employee'), fertilizerController.getAllFertilizers);

module.exports = router;
