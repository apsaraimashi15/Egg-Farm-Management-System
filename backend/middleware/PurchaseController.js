const Purchase = require('../models/Purchase');
const EggStock = require('../models/EggStock');
const User = require('../models/User');

// Get all purchases for a buyer
const getBuyerPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find({ buyer: req.user.id })
      .sort({ createdAt: -1 })
      .populate('buyer', 'name email');

    res.json({
      success: true,
      data: purchases
    });
  } catch (error) {
    console.error('Error fetching buyer purchases:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching purchases'
    });
  }
};

// Get all purchases (admin only)
const getAllPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .sort({ createdAt: -1 })
      .populate('buyer', 'name email');

    res.json({
      success: true,
      data: purchases
    });
  } catch (error) {
    console.error('Error fetching all purchases:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching purchases'
    });
  }
};

// Create a new purchase
const createPurchase = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Purchase must contain at least one item'
      });
    }

    // Validate stock availability
    for (const item of items) {
      if (item.productType === 'eggs') {
        const eggStock = await EggStock.findOne({ eggType: item.productName });
        if (!eggStock || eggStock.currentStock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${item.productName}. Available: ${eggStock?.currentStock || 0}`
          });
        }
      }
    }

    // Calculate total amount
    const totalAmount = items.reduce((total, item) => total + item.totalPrice, 0);

    // Create purchase
    const purchase = new Purchase({
      buyer: req.user.id,
      items,
      totalAmount,
      shippingAddress,
      paymentMethod: paymentMethod || 'cash',
      notes
    });

    await purchase.save();

    // Update stock levels
    for (const item of items) {
      if (item.productType === 'eggs') {
        await EggStock.findOneAndUpdate(
          { eggType: item.productName },
          { $inc: { currentStock: -item.quantity } }
        );
      }
    }

    const populatedPurchase = await Purchase.findById(purchase._id)
      .populate('buyer', 'name email');

    res.status(201).json({
      success: true,
      message: 'Purchase created successfully',
      data: populatedPurchase
    });
  } catch (error) {
    console.error('Error creating purchase:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating purchase'
    });
  }
};

// Update purchase status
const updatePurchaseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const purchase = await Purchase.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('buyer', 'name email');

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    res.json({
      success: true,
      message: 'Purchase status updated successfully',
      data: purchase
    });
  } catch (error) {
    console.error('Error updating purchase status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating purchase status'
    });
  }
};

// Get purchase by ID
const getPurchaseById = async (req, res) => {
  try {
    const { id } = req.params;
    const purchase = await Purchase.findById(id)
      .populate('buyer', 'name email');

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    // Check if user can access this purchase
    if (req.user.role !== 'admin' && purchase.buyer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: purchase
    });
  } catch (error) {
    console.error('Error fetching purchase:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching purchase'
    });
  }
};

// Get purchase statistics
const getPurchaseStats = async (req, res) => {
  try {
    const stats = await Purchase.aggregate([
      {
        $group: {
          _id: null,
          totalPurchases: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalPurchases: 0,
      totalRevenue: 0,
      pendingOrders: 0,
      completedOrders: 0
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching purchase stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching purchase statistics'
    });
  }
};

module.exports = {
  getBuyerPurchases,
  getAllPurchases,
  createPurchase,
  updatePurchaseStatus,
  getPurchaseById,
  getPurchaseStats
};