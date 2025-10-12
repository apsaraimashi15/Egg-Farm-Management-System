const express = require("express");
const router = express.Router();
const leaveController = require("../controllers/leaveController");
const { auth, authorize } = require("../middleware/auth");

// Create leave request (employees only)
router.post(
  "/",
  auth,
  authorize("employee"),
  leaveController.createLeaveRequest
);

// Get user's own leave requests (employees only)
router.get(
  "/my-leaves",
  auth,
  authorize("employee"),
  leaveController.getUserLeaves
);

// Get all leave requests with optional month/year filtering (HR manager only)
router.get("/", auth, authorize("hrmanager"), leaveController.getLeaveRequests);

// Update leave status (HR manager only)
router.put(
  "/status",
  auth,
  authorize("hrmanager"),
  leaveController.updateLeaveStatus
);

// Delete leave request (owner or HR manager)
router.delete("/:leaveId", auth, leaveController.deleteLeaveRequest);

// Update leave request (employees only, for pending requests)
router.put(
  "/:leaveId",
  auth,
  authorize("employee"),
  leaveController.updateLeaveRequest
);

module.exports = router;
