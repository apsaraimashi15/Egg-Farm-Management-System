const express = require('express');
const router = express.Router();
const {
  getBuyerPurchases,
  getAllPurchases,
  createPurchase,
  updatePurchaseStatus,
  getPurchaseById,
  getPurchaseStats
} = require('../middleware/PurchaseController');
const { auth, authorize } = require('../middleware/auth');

// Buyer routes
router.get('/my-purchases', auth, authorize('buyer'), getBuyerPurchases);
router.post('/', auth, authorize('buyer'), createPurchase);

// Admin routes
router.get('/', auth, authorize('admin'), getAllPurchases);
router.get('/stats', auth, authorize('admin'), getPurchaseStats);
router.put('/:id/status', auth, authorize('admin'), updatePurchaseStatus);

// Shared routes
router.get('/:id', auth, getPurchaseById);

module.exports = router;