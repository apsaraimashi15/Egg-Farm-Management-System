const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const User = require("../models/User");

// Mark or update attendance for an employee on a specific date (HR manager only)
exports.markAttendance = async (req, res) => {
  try {
    const { userId, date, status } = req.body;

    // Validation
    if (!userId || !date || !status) {
      return res
        .status(400)
        .json({ message: "User ID, date, and status are required" });
    }

    if (!["present", "absent", "leave"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Verify user exists and is an employee
    const employee = await User.findById(userId);
    if (!employee || employee.role !== "employee") {
      return res.status(400).json({ message: "Invalid employee ID" });
    }

    const parsedDate = new Date(date);
    parsedDate.setHours(0, 0, 0, 0);

    // Check if on approved leave (override if trying to set something else)
    const leave = await Leave.findOne({
      userId,
      startDate: { $lte: parsedDate },
      endDate: { $gte: parsedDate },
      status: "approved",
    });

    if (leave && status !== "leave") {
      return res
        .status(400)
        .json({ message: "Cannot change status for approved leave days" });
    }

    const attendance = await Attendance.findOneAndUpdate(
      { userId, date: parsedDate },
      { status, markedBy: req.user._id }, // Track who marked the attendance
      { new: true, upsert: true }
    );

    res.json({
      message: "Attendance marked successfully",
      attendance,
    });
  } catch (error) {
    console.error("Mark attendance error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get attendance status for a specific employee on a specific date
exports.getAttendanceByDate = async (req, res) => {
  try {
    const { userId, date } = req.params;

    // Check if requester is HR manager or the employee themselves
    if (req.user.role !== "hrmanager" && req.user._id.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to view this attendance" });
    }

    const parsedDate = new Date(date);
    parsedDate.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      userId,
      date: parsedDate,
    }).populate("markedBy", "name email");

    if (!attendance) {
      return res
        .status(404)
        .json({ message: "No attendance record found for this date" });
    }

    res.json(attendance);
  } catch (error) {
    console.error("Get attendance by date error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all employees' monthly summary: days worked, days leaved, salary
exports.getEmployeesMonthlySummary = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required" });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    endDate.setHours(23, 59, 59, 999);

    const employees = await User.find({ role: "employee" }).select(
      "name email"
    );

    const summaries = await Promise.all(
      employees.map(async (emp) => {
        const attendances = await Attendance.find({
          userId: emp._id,
          date: { $gte: startDate, $lte: endDate },
        }).populate("markedBy", "name email");

        const daysWorked = attendances.filter(
          (a) => a.status === "present"
        ).length;
        const daysLeaved = attendances.filter(
          (a) => a.status === "leave"
        ).length;
        const daysAbsent = attendances.filter(
          (a) => a.status === "absent"
        ).length;
        const salary = daysWorked * 1500;

        return {
          employee: {
            id: emp._id,
            name: emp.name,
            email: emp.email,
          },
          daysWorked,
          daysLeaved,
          daysAbsent,
          salary,
        };
      })
    );

    res.json(summaries);
  } catch (error) {
    console.error("Get employees monthly summary error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
