const express = require('express');
const router = express.Router();
const employeeController = require('../middleware/EmployeeController');
const { auth, authorize } = require('../middleware/auth');

// Get products added by the logged-in employee
router.get('/products', auth, authorize('employee'), employeeController.getEmployeeProducts);

module.exports = router;