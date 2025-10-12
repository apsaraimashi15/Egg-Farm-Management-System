// routes/tickets.js
const express = require("express");
const router = express.Router();
const Ticket = require("../models/Ticket");
const { auth, authorize } = require("../middleware/auth");

// --- Email (Nodemailer) ---
const nodemailer = require("nodemailer");

const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 587),
  secure: false, // 465ならtrue
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// Pretty-print helper for status labels
const pretty = (s = "") =>
  s.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

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
      category,
      priority,
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

    if (ticketNo) q.ticketNo = String(ticketNo).toUpperCase();
    if (status) q.status = status;
    if (category) q.category = category;
    if (priority) q.priority = priority;

    if (from || to) {
      q.createdAt = {};
      if (from) q.createdAt.$gte = new Date(from);
      if (to) q.createdAt.$lte = new Date(to);
    }

    if (search) q.$text = { $search: search }; // ensure text index on model

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
 * -> Sends an email to the buyer when status actually changes
 */
router.patch(
  "/:id/status",
  auth,
  authorize("admin", "hrmanager"),
  async (req, res) => {
    try {
      const { status: newStatus } = req.body;
      if (!["open", "in_progress", "resolved", "closed"].includes(newStatus)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      // 1) Find with buyer populated (to get buyer email)
      const t = await Ticket.findById(req.params.id).populate(
        "buyerId",
        "name email"
      );
      if (!t) return res.status(404).json({ error: "Ticket not found" });

      // 2) If same status — no email, no extra write
      if (t.status === newStatus) {
        return res.json({ ok: true, message: "No change" });
      }

      const oldStatus = t.status;

      // 3) Save new status
      t.status = newStatus;
      await t.save();

      // 4) Send email (non-blocking for API response)
      (async () => {
        try {
          const to = t.buyerId?.email;
          if (!to) {
            console.warn("[email] buyer has no email; skipping");
            return;
          }

          const subject = `Ticket ${t.ticketNo || t._id} status: ${pretty(
            newStatus
          )}`;
          const html = `
            <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#0f172a">
              <h2 style="margin:0 0 8px">Ticket Status Updated</h2>
              <p>Hello ${t.buyerId?.name || "Customer"},</p>
              <p>Your ticket <b>${t.ticketNo || t._id}</b> (“${
            t.subject
          }”) changed from
                 <b>${pretty(oldStatus)}</b> to <b>${pretty(newStatus)}</b>.</p>
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin:12px 0">
                <div><strong>Category:</strong> ${t.category}</div>
                <div><strong>Priority:</strong> ${(
                  t.priority || ""
                ).toUpperCase()}</div>
                <div><strong>Created:</strong> ${new Date(
                  t.createdAt
                ).toLocaleString()}</div>
              </div>
              <p>Thanks,<br/>${process.env.APP_NAME || "Egg Farm"}</p>
              <p style="font-size:12px;color:#64748b;margin-top:12px">${
                process.env.APP_URL || ""
              }</p>
            </div>`;
          const text =
            `Ticket ${t.ticketNo || t._id}\n` +
            `Subject: ${t.subject}\n` +
            `Status: ${pretty(oldStatus)} -> ${pretty(newStatus)}`;

          const info = await mailer.sendMail({
            from: `${process.env.APP_NAME || "Egg Farm"} <${
              process.env.EMAIL_USER
            }>`,
            to,
            subject,
            html,
            text,
          });
          console.log("[email] sent:", info?.messageId);
        } catch (e) {
          console.error("[email] failed:", e?.message || e);
        }
      })();

      // 5) Respond with the updated ticket
      res.json(t);
    } catch (err) {
      console.error(err);
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
