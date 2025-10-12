const EggStock = require("../models/EggStock");
const Alert = require("../models/Alert");

// Check current stock against alert threshold
exports.checkStock = async (req, res) => {
  try {
    const stock = await EggStock.findOne();

    if (!stock) {
      return res.status(404).json({ message: "No egg stock record found" });
    }

    const alertConfig = await Alert.findOne({ isActive: true });
    const threshold = alertConfig ? alertConfig.threshold : 50;

    if (stock.currentStock < threshold) {
      return res.status(200).json({
        alert: true,
        message: `⚠️ Stock is below threshold. Current: ${stock.currentStock}, Threshold: ${threshold}`,
      });
    }

    res.status(200).json({
      alert: false,
      message: `✅ Stock is sufficient. Current: ${stock.currentStock}, Threshold: ${threshold}`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Set or update stock alert threshold (admin only)
exports.setThreshold = async (req, res) => {
  try {
    const { threshold } = req.body;

    if (threshold == null || threshold < 0) {
      return res.status(400).json({ message: "Valid threshold is required" });
    }

    let alertConfig = await Alert.findOne();

    if (!alertConfig) {
      alertConfig = await Alert.create({ threshold });
    } else {
      alertConfig.threshold = threshold;
      await alertConfig.save();
    }

    res.status(200).json({
      message: "Threshold updated successfully",
      alertConfig,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
