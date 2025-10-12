const express = require("express");
const router = express.Router();
const stockController = require("../middleware/EggStockController");
const { auth, authorize } = require("../middleware/auth");

// Get current stock (any authorized employee/admin)
router.get(
  "/",
  auth,
  authorize("admin", "employee"),
  stockController.getCurrentStock
);

// Update stock (positive = add, negative = reduce)
router.put(
  "/",
  auth,
  authorize("admin", "employee"),
  stockController.updateStock
);

// Reset stock to zero (admin only)
router.post("/reset", auth, authorize("admin"), stockController.resetStock);

module.exports = router;
