const express = require("express");
const router = express.Router();
const { auth, authorize } = require("../middleware/auth");
const ctrl = require("../controllers/feedController");

// Admin only (add 'hrmanager' if desired)
const guard = [auth, authorize("admin")];

// Enum list
router.get("/feeds", ...guard, ctrl.listFeedNames);

// Totals
router.get("/totals", ...guard, ctrl.listTotals);
router.get("/totals/:feedName", ...guard, ctrl.getTotalByFeed);

// Movements (audit / CRUD)
router.get("/movements", ...guard, ctrl.listMovements);
router.get("/movements/:id", ...guard, ctrl.getMovement);
router.patch("/movements/:id", ...guard, ctrl.updateMovement);
router.delete("/movements/:id", ...guard, ctrl.deleteMovement);

// Create movements
router.post("/restock", ...guard, ctrl.restock);
router.post("/use", ...guard, ctrl.useFeed);

module.exports = router;
