// routes/tickets.js
const express = require("express");
const router = express.Router();
const Ticket = require("../models/Ticket");
const { auth, authorize } = require("../middleware/auth");

/**
 * CREATE (Buyer only)
 * POST /api/tickets
 */
router.post("/", auth, authorize("buyer"), async (req, res) => {
  try {
    const { subject, message, category, priority } = req.body;

    const ticket = await Ticket.create({
      buyerId: req.user._id, // logged-in buyer
      subject,
      message,
      category, // 'product' | 'billing' | 'technical' | 'general'
      priority, // 'low' | 'medium' | 'high'
      // status default = 'open'
    });

    res.status(201).json(ticket);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * LIST + SEARCH
 * GET /api/tickets
 * - Buyer: shows own tickets
 * - Admin/HR: shows all; can filter by buyerId
 * Query: search, status, category, priority, buyerId(admin only),
 *        from, to, sort, page, limit, ticketNo
 */
router.get("/", auth, async (req, res) => {
  try {
    const {
      search,
      status,
      category,
      priority,
      buyerId,
      from,
      to,
      sort = "-createdAt",
      page = 1,
      limit = 10,
      ticketNo,
    } = req.query;

    const q = {};

    // Ownership
    if (req.user.role === "buyer") q.buyerId = req.user._id;
    else if (buyerId) q.buyerId = buyerId; // admin/hr filter

    if (ticketNo) q.ticketNo = ticketNo.toUpperCase();
    if (status) q.status = status;
    if (category) q.category = category;
    if (priority) q.priority = priority;

    if (from || to) {
      q.createdAt = {};
      if (from) q.createdAt.$gte = new Date(from);
      if (to) q.createdAt.$lte = new Date(to);
    }

    if (search) q.$text = { $search: search }; // need text index on model

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Ticket.find(q)
        .populate("buyerId", "name email role")
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Ticket.countDocuments(q),
    ]);

    res.json({ page: Number(page), limit: Number(limit), total, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * READ single
 * GET /api/tickets/:id
 */
router.get("/:id", auth, async (req, res) => {
  try {
    const t = await Ticket.findById(req.params.id).populate(
      "buyerId",
      "name email role"
    );
    if (!t) return res.status(404).json({ error: "Ticket not found" });

    // Buyer can see only own ticket
    if (
      req.user.role === "buyer" &&
      String(t.buyerId?._id) !== String(req.user._id)
    ) {
      return res.status(403).json({ error: "Not authorized" });
    }

    res.json(t);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * UPDATE (General fields)
 * PATCH /api/tickets/:id
 * - Buyer: can edit ONLY if status === 'open'
 *          and only fields: subject, message, category, priority
 * - Admin/HR: can edit those fields anytime (not the status here)
 */
router.patch("/:id", auth, async (req, res) => {
  try {
    const t = await Ticket.findById(req.params.id);
    if (!t) return res.status(404).json({ error: "Ticket not found" });

    const allowFields = ["subject", "message", "category", "priority"];

    if (req.user.role === "buyer") {
      // ownership
      if (String(t.buyerId) !== String(req.user._id)) {
        return res.status(403).json({ error: "Not authorized" });
      }
      // edit lock
      if (t.status !== "open") {
        return res
          .status(400)
          .json({ error: "Ticket is locked (in_progress/resolved/closed)" });
      }
      // block status change
      if (req.body.status && req.body.status !== t.status) {
        return res.status(403).json({ error: "Buyers cannot change status" });
      }
      // apply allowed fields
      allowFields.forEach((f) => {
        if (req.body[f] !== undefined) t[f] = req.body[f];
      });
    } else {
      // admin/hr (no status change here)
      allowFields.forEach((f) => {
        if (req.body[f] !== undefined) t[f] = req.body[f];
      });
    }

    await t.save();
    res.json(t);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * UPDATE STATUS (Admin/HR only)
 * PATCH /api/tickets/:id/status
 * Body: { status: 'open'|'in_progress'|'resolved'|'closed' }
 */
router.patch(
  "/:id/status",
  auth,
  authorize("admin", "hrmanager"),
  async (req, res) => {
    try {
      const { status } = req.body;
      if (!["open", "in_progress", "resolved", "closed"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const t = await Ticket.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );
      if (!t) return res.status(404).json({ error: "Ticket not found" });

      res.json(t);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

/**
 * DELETE (Admin only) — optional
 * DELETE /api/tickets/:id
 */
router.delete("/:id", auth, authorize("admin"), async (req, res) => {
  try {
    await Ticket.findByIdAndDelete(req.params.id);
    res.json({ message: "Ticket deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
