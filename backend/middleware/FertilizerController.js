const Fertilizer = require('../models/FertilizerCollection');

// Record monthly fertilizer collection
exports.recordFertilizer = async (req, res) => {
  try {
    const { month, quantityCollected } = req.body;

    const existing = await Fertilizer.findOne({ month });
    if (existing) {
      return res.status(400).json({ message: 'Fertilizer for this month already recorded' });
    }

    const fertilizer = await Fertilizer.create({ month, quantityCollected, employee: req.user._id });

    res.status(201).json({
      message: 'Fertilizer recorded successfully',
      fertilizer
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update used quantity
exports.updateUsedQuantity = async (req, res) => {
  try {
    const { month, usedQuantity } = req.body;

    if (usedQuantity == null) {
      return res.status(400).json({ message: 'Used quantity is required' });
    }

    const fertilizer = await Fertilizer.findOne({ month });

    if (!fertilizer) {
      return res.status(404).json({ message: 'No fertilizer record found for this month' });
    }

    fertilizer.usedQuantity += usedQuantity;
    await fertilizer.save();

    res.status(200).json({
      message: 'Used quantity updated successfully',
      fertilizer
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all fertilizer records
exports.getAllFertilizers = async (req, res) => {
  try {
    const fertilizers = await Fertilizer.find().sort({ month: 1 });

    res.status(200).json({
      message: 'Fertilizer records fetched successfully',
      fertilizers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
