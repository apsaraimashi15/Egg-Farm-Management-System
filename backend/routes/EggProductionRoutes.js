const express = require("express");
const router = express.Router();
const eggProduction = require("../middleware/EggProductionController");
const { auth, authorize } = require("../middleware/auth");

// ✅ remove the '/egg-production' prefix from inside
router.post(
  "/",
  auth,
  authorize("admin", "employee"),
  eggProduction.recordEggProduction
);
router.get(
  "/",
  auth,
  authorize("admin", "employee"),
  eggProduction.getAllProductions
);
router.get(
  "/date/:date",
  auth,
  authorize("admin", "employee"),
  eggProduction.getProductionByDate
);
router.put(
  "/:id",
  auth,
  authorize("admin", "employee"),
  eggProduction.updateProduction
);
router.delete(
  "/:id",
  auth,
  authorize("admin", "employee"),
  eggProduction.deleteProduction
);

module.exports = router;
