const express = require("express");
const router = express.Router();
const reportController = require("../middleware/ReportController");
const { auth, authorize } = require("../middleware/auth");

router.get(
  "/",
  auth,
  authorize("admin", "employee"),
  reportController.getReports
);

// Generate report by type (admin only)
router.get("/:type", auth, authorize("admin"), reportController.generateReport);

module.exports = router;
