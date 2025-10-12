const EggProduction = require('../models/EggProduction');
const EggStock = require('../models/EggStock');
const Fertilizer = require('../models/FertilizerCollection');

// Get products added by a specific employee
exports.getEmployeeProducts = async (req, res) => {
  try {
    const employeeId = req.user._id;

    // Get egg productions added by this employee
    const productions = await EggProduction.find({ employee: employeeId })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get egg stock updates added by this employee
    const stocks = await EggStock.find({ employee: employeeId })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get fertilizer records added by this employee
    const fertilizers = await Fertilizer.find({ employee: employeeId })
      .sort({ createdAt: -1 })
      .limit(10);

    // Calculate summary statistics
    const totalProductions = await EggProduction.countDocuments({ employee: employeeId });
    const totalStocks = await EggStock.countDocuments({ employee: employeeId });
    const totalFertilizers = await Fertilizer.countDocuments({ employee: employeeId });

    // Calculate today's production
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysProduction = await EggProduction.find({
      employee: employeeId,
      createdAt: { $gte: today, $lt: tomorrow }
    });

    const todaysTotal = todaysProduction.reduce((sum, prod) => sum + prod.quantity, 0);

    res.status(200).json({
      summary: {
        totalProductions,
        totalStocks,
        totalFertilizers,
        todaysProduction: todaysTotal
      },
      recentProductions: productions,
      recentStocks: stocks,
      recentFertilizers: fertilizers
    });
  } catch (error) {
    console.error('Get employee products error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};