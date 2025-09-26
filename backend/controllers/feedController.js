const mongoose = require("mongoose");
const FeedMovement = require("../models/FeedMovement");
const TotalFeedStock = require("../models/TotalFeedStock");
const { FEED_NAMES } = require("../constants/feed");

// ---------- helpers ----------
function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

async function ensureTotalRow(feedName, session) {
  const ex = await TotalFeedStock.findOne({ feedName }).session(session);
  if (ex) return ex;
  const [created] = await TotalFeedStock.create(
    [{ feedName, quantity: 0, totalCost: 0 }],
    { session }
  );
  return created;
}

// ======================================================
// CREATE
// ======================================================

// RESTOCK (increase) — requires unitPrice
exports.restock = async (req, res) => {
  const { feedName, qty, unitPrice, batchNo, expiryDate, note } = req.body;

  if (!feedName || !FEED_NAMES.includes(feedName)) {
    return res.status(400).json({ error: "Invalid or missing feedName" });
  }
  if (!(qty > 0)) return res.status(400).json({ error: "qty must be > 0" });
  if (unitPrice == null || unitPrice < 0) {
    return res
      .status(400)
      .json({ error: "unitPrice is required and must be >= 0" });
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // 1) ledger
      await FeedMovement.create(
        [
          {
            feedName,
            type: "RESTOCK",
            qty,
            unitPrice,
            batchNo,
            expiryDate,
            note,
          },
        ],
        { session }
      );

      // 2) totals
      await ensureTotalRow(feedName, session);
      await TotalFeedStock.updateOne(
        { feedName },
        { $inc: { quantity: qty, totalCost: round2(qty * unitPrice) } },
        { session }
      );
    });
    res.json({ message: "Restocked successfully" });
  } catch (e) {
    console.error("RESTOCK error:", e);
    res.status(400).json({ error: e.message || "Restock failed" });
  } finally {
    session.endSession();
  }
};

// USE (decrease) — blocks if not enough stock
exports.useFeed = async (req, res) => {
  const { feedName, qty, employeeId, note } = req.body;

  if (!feedName || !FEED_NAMES.includes(feedName)) {
    return res.status(400).json({ error: "Invalid or missing feedName" });
  }
  if (!(qty > 0)) return res.status(400).json({ error: "qty must be > 0" });
  if (!employeeId)
    return res.status(400).json({ error: "employeeId is required" });

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const total = await TotalFeedStock.findOne({ feedName }).session(session);
      if (!total || total.quantity <= 0 || qty > total.quantity) {
        throw new Error("Insufficient stock");
      }

      const avgUnitCost =
        total.quantity > 0 ? total.totalCost / total.quantity : 0;

      // 1) ledger
      await FeedMovement.create(
        [
          {
            feedName,
            type: "USE",
            qty,
            employeeId,
            note,
          },
        ],
        { session }
      );

      // 2) totals
      await TotalFeedStock.updateOne(
        { feedName },
        { $inc: { quantity: -qty, totalCost: -round2(avgUnitCost * qty) } },
        { session }
      );
    });
    res.json({ message: "Feed issued successfully" });
  } catch (e) {
    console.error("USE error:", e);
    res.status(400).json({ error: e.message || "Issue failed" });
  } finally {
    session.endSession();
  }
};

// ======================================================
// READ (lists & single)
// ======================================================

// Allowed enum feed names (for dropdowns)
exports.listFeedNames = (req, res) => {
  res.json(FEED_NAMES);
};

// Totals table (all feeds; fills zero rows for missing)
exports.listTotals = async (req, res) => {
  try {
    const rows = await TotalFeedStock.find({}).lean();
    const map = new Map(rows.map((r) => [r.feedName, r]));

    const result = FEED_NAMES.map((name) => {
      const r = map.get(name);
      const quantity = r?.quantity || 0;
      const totalCost = round2(r?.totalCost || 0);
      return {
        _id: r?._id,
        feedName: name,
        quantity,
        totalCost,
        avgUnitPrice: quantity > 0 ? round2(totalCost / quantity) : 0,
        createdAt: r?.createdAt,
        updatedAt: r?.updatedAt,
      };
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Get single total by feed name
exports.getTotalByFeed = async (req, res) => {
  try {
    const { feedName } = req.params;
    if (!FEED_NAMES.includes(feedName)) {
      return res.status(400).json({ error: "Invalid feedName" });
    }
    const t = await TotalFeedStock.findOne({ feedName }).lean();
    const quantity = t?.quantity || 0;
    const totalCost = round2(t?.totalCost || 0);
    const avgUnitPrice = quantity > 0 ? round2(totalCost / quantity) : 0;
    res.json({ feedName, quantity, totalCost, avgUnitPrice, _id: t?._id });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Movements (audit list)
exports.listMovements = async (req, res) => {
  try {
    const { feedName, type, from, to } = req.query;
    const q = {};
    if (feedName) q.feedName = feedName;
    if (type) q.type = type; // RESTOCK / USE
    if (from || to) {
      q.createdAt = {};
      if (from) q.createdAt.$gte = new Date(from);
      if (to) q.createdAt.$lte = new Date(to);
    }

    const docs = await FeedMovement.find(q)
      .populate("employeeId", "name email role")
      .sort({ createdAt: -1 });

    res.json(docs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Get single movement
exports.getMovement = async (req, res) => {
  try {
    const m = await FeedMovement.findById(req.params.id).populate(
      "employeeId",
      "name email role"
    );
    if (!m) return res.status(404).json({ error: "Movement not found" });
    res.json(m);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// ======================================================
// UPDATE movement (recalculate totals safely)
// ======================================================
exports.updateMovement = async (req, res) => {
  const { id } = req.params;
  const {
    feedName: newFeedName,
    type: newType,
    qty: newQty,
    unitPrice: newUnitPrice,
    employeeId: newEmployeeId,
    note: newNote,
    batchNo: newBatchNo,
    expiryDate: newExpiryDate,
  } = req.body;

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const old = await FeedMovement.findById(id).session(session);
      if (!old) throw new Error("Movement not found");

      // ---------- revert OLD effect ----------
      await ensureTotalRow(old.feedName, session);
      const oldTotal = await TotalFeedStock.findOne({
        feedName: old.feedName,
      }).session(session);
      if (!oldTotal) throw new Error("Totals row missing");

      if (old.type === "RESTOCK") {
        const deductQty = old.qty;
        const deductVal = round2((old.unitPrice || 0) * old.qty);
        if (oldTotal.quantity - deductQty < 0) {
          throw new Error("Reverting this RESTOCK would make totals negative");
        }
        await TotalFeedStock.updateOne(
          { feedName: old.feedName },
          { $inc: { quantity: -deductQty, totalCost: -deductVal } },
          { session }
        );
      } else if (old.type === "USE") {
        // Re-add using current avg (approx); for exactness, store appliedUnitCost on USE rows.
        const avg =
          oldTotal.quantity > 0 ? oldTotal.totalCost / oldTotal.quantity : 0;
        await TotalFeedStock.updateOne(
          { feedName: old.feedName },
          { $inc: { quantity: old.qty, totalCost: round2(avg * old.qty) } },
          { session }
        );
      }

      // ---------- apply NEW effect ----------
      const nFeed = newFeedName ?? old.feedName;
      const nType = newType ?? old.type;
      const nQty = newQty ?? old.qty;
      const nUnitPrice =
        nType === "RESTOCK" ? newUnitPrice ?? old.unitPrice ?? 0 : undefined;

      if (!FEED_NAMES.includes(nFeed)) throw new Error("Invalid feedName");
      if (!(nQty > 0)) throw new Error("qty must be > 0");
      if (nType === "RESTOCK" && (nUnitPrice == null || nUnitPrice < 0)) {
        throw new Error("unitPrice is required and must be >= 0 for RESTOCK");
      }

      await ensureTotalRow(nFeed, session);
      const tNow = await TotalFeedStock.findOne({ feedName: nFeed }).session(
        session
      );

      if (nType === "RESTOCK") {
        await TotalFeedStock.updateOne(
          { feedName: nFeed },
          { $inc: { quantity: nQty, totalCost: round2(nQty * nUnitPrice) } },
          { session }
        );
      } else {
        // USE
        const mustEmployee =
          newEmployeeId !== undefined ? newEmployeeId : old.employeeId;
        if (!mustEmployee) throw new Error("employeeId is required for USE");
        if (!tNow || tNow.quantity < nQty)
          throw new Error("Insufficient stock for updated USE");
        const avg = tNow.quantity > 0 ? tNow.totalCost / tNow.quantity : 0;
        await TotalFeedStock.updateOne(
          { feedName: nFeed },
          { $inc: { quantity: -nQty, totalCost: -round2(avg * nQty) } },
          { session }
        );
      }

      // ---------- update movement doc ----------
      old.feedName = nFeed;
      old.type = nType;
      old.qty = nQty;
      old.unitPrice = nType === "RESTOCK" ? nUnitPrice : undefined;
      if (newEmployeeId !== undefined) old.employeeId = newEmployeeId;
      if (newNote !== undefined) old.note = newNote;
      if (newBatchNo !== undefined) old.batchNo = newBatchNo;
      if (newExpiryDate !== undefined) old.expiryDate = newExpiryDate;

      await old.save({ session });

      const updatedTotal = await TotalFeedStock.findOne({
        feedName: nFeed,
      }).session(session);
      res.json({
        message: "Movement updated",
        movement: old,
        total: {
          feedName: updatedTotal.feedName,
          quantity: updatedTotal.quantity,
          totalCost: round2(updatedTotal.totalCost),
          avgUnitPrice:
            updatedTotal.quantity > 0
              ? round2(updatedTotal.totalCost / updatedTotal.quantity)
              : 0,
        },
      });
    });
  } catch (e) {
    console.error("UPDATE movement error:", e);
    res.status(400).json({ error: e.message });
  } finally {
    session.endSession();
  }
};

// ======================================================
// DELETE movement (revert then remove)
// ======================================================
exports.deleteMovement = async (req, res) => {
  const { id } = req.params;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const m = await FeedMovement.findById(id).session(session);
      if (!m) throw new Error("Movement not found");

      const total = await TotalFeedStock.findOne({
        feedName: m.feedName,
      }).session(session);
      if (!total) throw new Error("Totals row missing");

      if (m.type === "RESTOCK") {
        const deductQty = m.qty;
        const deductVal = round2((m.unitPrice || 0) * m.qty);
        if (total.quantity - deductQty < 0) {
          throw new Error("Deleting this RESTOCK would make totals negative");
        }
        await TotalFeedStock.updateOne(
          { feedName: m.feedName },
          { $inc: { quantity: -deductQty, totalCost: -deductVal } },
          { session }
        );
      } else {
        // USE
        const avg = total.quantity > 0 ? total.totalCost / total.quantity : 0;
        await TotalFeedStock.updateOne(
          { feedName: m.feedName },
          { $inc: { quantity: m.qty, totalCost: round2(avg * m.qty) } },
          { session }
        );
      }

      await FeedMovement.deleteOne({ _id: id }).session(session);
      const after = await TotalFeedStock.findOne({
        feedName: m.feedName,
      }).session(session);

      res.json({
        message: "Movement deleted",
        total: {
          feedName: after.feedName,
          quantity: after.quantity,
          totalCost: round2(after.totalCost),
          avgUnitPrice:
            after.quantity > 0 ? round2(after.totalCost / after.quantity) : 0,
        },
      });
    });
  } catch (e) {
    console.error("DELETE movement error:", e);
    res.status(400).json({ error: e.message });
  } finally {
    session.endSession();
  }
};
