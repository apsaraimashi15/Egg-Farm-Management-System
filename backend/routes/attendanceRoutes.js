const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");
const { auth, authorize } = require("../middleware/auth");

// Mark/Update attendance for an employee (HR manager only)
router.post(
  "/mark",
  auth,
  authorize("hrmanager"),
  attendanceController.markAttendance
);

// Get attendance by user and date (HR manager or self if employee)
router.get("/:userId/:date", auth, attendanceController.getAttendanceByDate);

// Get all employees monthly summary (HR manager only)
router.get(
  "/summary",
  auth,
  authorize("hrmanager"),
  attendanceController.getEmployeesMonthlySummary
);

module.exports = router;
