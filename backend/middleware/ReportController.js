const EggProduction = require("../models/EggProduction");
const Fertilizer = require("../models/FertilizerCollection");
const Report = require("../models/Report");

// Helper function to get date range based on report type
function getDateRange(type) {
  const now = new Date();
  let start, end;

  if (type === "daily") {
    start = new Date(now.setHours(0, 0, 0, 0));
    end = new Date(now.setHours(23, 59, 59, 999));
  } else if (type === "weekly") {
    const day = now.getDay();
    const diffToSunday = now.getDate() - day;
    start = new Date(now.setDate(diffToSunday));
    start.setHours(0, 0, 0, 0);
    end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (type === "monthly") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
}

exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find({});

    res.status(200).json({
      message: `Reports fetched successfully`,
      reports,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Generate report
exports.generateReport = async (req, res) => {
  try {
    const { type } = req.params;

    if (!["daily", "weekly", "monthly"].includes(type)) {
      return res.status(400).json({ message: "Invalid report type" });
    }

    const { start, end } = getDateRange(type);

    // Get egg production in date range
    const productions = await EggProduction.find({
      date: { $gte: start, $lte: end },
    });

    const eggProduced = productions.reduce((sum, p) => sum + p.quantity, 0);

    // Get total fertilizer used (across all months)
    const fertilizers = await Fertilizer.find();
    const fertilizerUsed = fertilizers.reduce(
      (sum, f) => sum + f.usedQuantity,
      0
    );

    const report = await Report.create({
      reportType: type,
      dateRange: { start, end },
      eggProduced,
      fertilizerUsed,
    });

    res.status(200).json({
      message: `${type} report generated successfully`,
      report,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
