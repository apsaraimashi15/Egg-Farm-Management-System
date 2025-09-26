



const EggStock = require('../models/EggStock');

// Get current egg stock
exports.getCurrentStock = async (req, res) => {
  try {
    let stock = await EggStock.find({});
    if (!stock) {
      stock = await EggStock.create({ currentStock: 0 });
    }

    res.status(200).json({
      stock
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update stock (positive = add, negative = reduce)
exports.updateStock = async (req, res) => {
  try {
    const { change, eggType } = req.body;

    if (change == null || !eggType) {
      return res.status(400).json({ message: 'Change and eggType are required' });
    }

    let stock = await EggStock.findOne({ eggType });
    if (!stock) {
      stock = await EggStock.create({ eggType, currentStock: change });
    } else {
      stock.currentStock += change;
      stock.lastUpdated = new Date();
      await stock.save();
    }

    res.status(200).json({
      message: 'Stock updated successfully',
      currentStock: stock.currentStock,
      eggType: stock.eggType,
      lastUpdated: stock.lastUpdated
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Reset stock to zero (admin only)
exports.resetStock = async (req, res) => {
  try {
    let stock = await EggStock.findOne();
    if (!stock) {
      stock = await EggStock.create({ currentStock: 0 });
    } else {
      stock.currentStock = 0;
      stock.lastUpdated = new Date();
      await stock.save();
    }

    res.status(200).json({
      message: 'Stock reset to zero successfully',
      currentStock: stock.currentStock,
      lastUpdated: stock.lastUpdated
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
