import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";

const API_BASE = "http://localhost:5000";

const FeedManagement = () => {
  const { user } = useAuth() || {};
  const token = useMemo(
    () => (typeof window !== "undefined" ? localStorage.getItem("token") : ""),
    []
  );

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // enums (feed names)
  const [feedNames, setFeedNames] = useState([]);

  // totals
  const [totals, setTotals] = useState([]);
  const [loadingTotals, setLoadingTotals] = useState(true);

  // movements
  const [movements, setMovements] = useState([]);
  const [loadingMoves, setLoadingMoves] = useState(true);

  // toolbar filters
  const [fFeed, setFFeed] = useState("");
  const [fType, setFType] = useState(""); // RESTOCK | USE
  const [fText, setFText] = useState("");
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");

  // modals: create (restock/use)
  const [showRestock, setShowRestock] = useState(false);
  const [showUse, setShowUse] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [restockForm, setRestockForm] = useState({
    feedName: "",
    qty: "",
    unitPrice: "",
    batchNo: "",
    expiryDate: "",
    note: "",
  });

  const [useForm, setUseForm] = useState({
    feedName: "",
    qty: "",
    employeeId: "",
    note: "",
  });

  // modals: view / edit
  const [viewMv, setViewMv] = useState(null);
  const [editMv, setEditMv] = useState(null);
  const [editForm, setEditForm] = useState({
    feedName: "",
    qty: "",
    unitPrice: "",
    batchNo: "",
    expiryDate: "",
    employeeId: "",
    note: "",
  });

  const canAdmin = user?.role === "admin";

  const axiosClient = useMemo(() => {
    return axios.create({
      baseURL: API_BASE,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }, [token]);

  // ---------- loaders ----------
  const loadFeedNames = async () => {
    try {
      const r = await axiosClient.get("/api/feed/feeds");
      setFeedNames(r.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadTotals = async () => {
    try {
      setLoadingTotals(true);
      const r = await axiosClient.get("/api/feed/totals");
      setTotals(r.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTotals(false);
    }
  };

  const loadMovements = async () => {
    try {
      setLoadingMoves(true);
      const params = {};
      if (fFeed) params.feedName = fFeed;
      if (fType) params.type = fType;
      if (fText) params.search = fText;
      if (fFrom) params.from = fFrom;
      if (fTo) params.to = fTo;

      const r = await axiosClient.get("/api/feed/movements", { params });
      setMovements(r.data?.items || r.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMoves(false);
    }
  };

  useEffect(() => {
    loadFeedNames();
    loadTotals();
    loadMovements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- open create modals ----------
  const openRestock = () => {
    setRestockForm({
      feedName: feedNames[0] || "",
      qty: "",
      unitPrice: "",
      batchNo: "",
      expiryDate: "",
      note: "",
    });
    setShowRestock(true);
  };

  const openUse = () => {
    setUseForm({
      feedName: feedNames[0] || "",
      qty: "",
      employeeId: "",
      note: "",
    });
    setShowUse(true);
  };

  // ---------- submit create ----------
  const submitRestock = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const body = {
        feedName: restockForm.feedName,
        qty: Number(restockForm.qty),
        unitPrice: Number(restockForm.unitPrice),
        batchNo: restockForm.batchNo || undefined,
        expiryDate: restockForm.expiryDate || undefined,
        note: restockForm.note || undefined,
      };
      await axiosClient.post("/api/feed/restock", body);
      setShowRestock(false);
      await Promise.all([loadTotals(), loadMovements()]);
    } catch (err) {
      alert(err?.response?.data?.error || "Restock failed");
    } finally {
      setSubmitting(false);
    }
  };

  const submitUse = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const body = {
        feedName: useForm.feedName,
        qty: Number(useForm.qty),
        employeeId: useForm.employeeId,
        note: useForm.note || undefined,
      };
      await axiosClient.post("/api/feed/use", body);
      setShowUse(false);
      await Promise.all([loadTotals(), loadMovements()]);
    } catch (err) {
      alert(err?.response?.data?.error || "Issue failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- view / edit / delete ----------
  const openView = async (id) => {
    try {
      const r = await axiosClient.get(`/api/feed/movements/${id}`);
      setViewMv(r.data);
    } catch {
      alert("Failed to load movement");
    }
  };

  const openEdit = async (id) => {
    try {
      const r = await axiosClient.get(`/api/feed/movements/${id}`);
      const m = r.data;
      setEditMv(m);
      setEditForm({
        feedName: m.feedName || "",
        qty: m.qty || "",
        unitPrice: m.unitPrice || "",
        batchNo: m.batchNo || "",
        expiryDate: m.expiryDate ? m.expiryDate.slice(0, 10) : "",
        employeeId: m.employeeId?._id || "",
        note: m.note || "",
      });
    } catch {
      alert("Failed to load movement");
    }
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const body = {
        feedName: editForm.feedName,
        qty: Number(editForm.qty),
        note: editForm.note || undefined,
      };
      if (editMv.type === "RESTOCK") {
        body.unitPrice = Number(editForm.unitPrice);
        body.batchNo = editForm.batchNo || undefined;
        body.expiryDate = editForm.expiryDate || undefined;
      } else {
        body.employeeId = editForm.employeeId || undefined;
      }
      await axiosClient.patch(`/api/feed/movements/${editMv._id}`, body);
      setEditMv(null);
      await Promise.all([loadTotals(), loadMovements()]);
    } catch (err) {
      alert(err?.response?.data?.error || "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  const removeMovement = async (id) => {
    if (!window.confirm("Delete this movement? Stock will be rolled back."))
      return;
    try {
      await axiosClient.delete(`/api/feed/movements/${id}`);
      await Promise.all([loadTotals(), loadMovements()]);
    } catch (e) {
      alert(e?.response?.data?.error || "Delete failed");
    }
  };

  // ---------- stats ----------
  const totalItems = totals.length;
  const totalQty = totals.reduce((a, b) => a + (b.quantity || 0), 0);
  const totalValue = totals.reduce((a, b) => a + (b.totalCost || 0), 0);

  if (!canAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md bg-white border rounded-xl p-6 text-center">
            <div className="text-4xl mb-2">🔒</div>
            <h2 className="font-semibold text-slate-900 mb-1">Access denied</h2>
            <p className="text-slate-600">Feed Management is for Admin only.</p>
          </div>
        </div>
      </div>
    );
  }

  // ---------- UI ----------
  if (loadingTotals && loadingMoves) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex items-center justify-center">
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1">
        {/* Mobile topbar */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm px-4 py-3 shadow-sm border-b border-white/20">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-600 hover:text-slate-800 p-2 rounded-lg hover:bg-white/50"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-slate-800">
              Feed Management
            </h1>
            <div className="w-9" />
          </div>
        </div>

        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-screen-2xl mx-auto">
            {/* Hero */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-800 rounded-2xl p-8 mb-8 text-white">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16" />
                <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 -translate-y-12" />
                <div className="absolute bottom-0 left-1/4 w-20 h-20 bg-white rounded-full translate-y-10" />
                <div className="absolute bottom-0 right-1/3 w-16 h-16 bg-white rounded-full translate-y-8" />
              </div>

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                      🌾
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight">
                        Feed Management
                      </h1>
                      <p className="text-emerald-100 text-lg">
                        Restock, issue to employees, and track live stock.
                      </p>
                    </div>
                  </div>
                  <p className="text-slate-300 max-w-2xl">
                    Weighted-average cost is maintained automatically. All
                    changes are recorded in the movement log.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={openRestock}
                    className="inline-flex items-center px-5 py-3 bg-white text-slate-900 font-semibold rounded-xl hover:bg-emerald-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <span className="mr-2">➕</span> New Restock
                  </button>
                  <button
                    onClick={openUse}
                    className="inline-flex items-center px-5 py-3 bg-white text-slate-900 font-semibold rounded-xl hover:bg-emerald-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <span className="mr-2">📦</span> Issue to Employee
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <Stat label="Feed Items" value={totalItems} />
                <Stat label="Total Quantity" value={totalQty} />
                <Stat label="Total Value" value={formatMoney(totalValue)} />
              </div>
            </div>

            {/* STOCK TOTALS */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">
                  Stock Totals
                </h3>
                <p className="text-sm text-slate-600">
                  Current on-hand quantities and value by feed.
                </p>
              </div>

              {loadingTotals ? (
                <Loader />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <Th>Feed</Th>
                        <Th right>Quantity</Th>
                        <Th right>Avg Unit Price</Th>
                        <Th right>Total Value</Th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {totals.map((t) => (
                        <tr key={t.feedName} className="hover:bg-slate-50">
                          <Td>{t.feedName}</Td>
                          <Td right>{t.quantity}</Td>
                          <Td right>{formatMoney(t.avgUnitPrice)}</Td>
                          <Td right>{formatMoney(t.totalCost)}</Td>
                        </tr>
                      ))}
                      {totals.length === 0 && (
                        <tr>
                          <td
                            className="px-6 py-10 text-center text-slate-400"
                            colSpan={4}
                          >
                            No stock yet. Add a restock to get started.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* MOVEMENT LOG */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <div>
                  <p className="text-sm text-slate-600">
                    All RESTOCK and USE transactions.
                  </p>
                </div>
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                  <div>
                    <h3 className="text-xm mb-3 text-center font-semibold text-slate-900">
                      Movement Log
                    </h3>
                  </div>
                  <div className="flex flex-col mt-3 sm:flex-row gap-3">
                    <select
                      className="block w-full sm:w-40 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      value={fFeed}
                      onChange={(e) => setFFeed(e.target.value)}
                    >
                      <option value="">All Feeds</option>
                      {feedNames.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                    <select
                      className="block w-full sm:w-36 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      value={fType}
                      onChange={(e) => setFType(e.target.value)}
                    >
                      <option value="">All Types</option>
                      <option value="RESTOCK">RESTOCK</option>
                      <option value="USE">USE</option>
                    </select>
                    <input
                      type="date"
                      className="block w-full sm:w-40 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      value={fFrom}
                      onChange={(e) => setFFrom(e.target.value)}
                    />
                    <input
                      type="date"
                      className="block w-full sm:w-40 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      value={fTo}
                      onChange={(e) => setFTo(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Search note/batch…"
                      className="block w-full sm:w-56 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      value={fText}
                      onChange={(e) => setFText(e.target.value)}
                    />
                    <button
                      onClick={loadMovements}
                      className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>

              {loadingMoves ? (
                <Loader />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <Th>Date</Th>
                        <Th>Type</Th>
                        <Th>Feed</Th>
                        <Th right>Qty</Th>
                        <Th>Batch</Th>
                        <Th>Employee</Th>
                        <Th>Note</Th>
                        <Th right>Actions</Th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {movements.map((m) => (
                        <tr key={m._id} className="hover:bg-slate-50">
                          <Td>
                            {new Date(m.createdAt || m.date).toLocaleString()}
                          </Td>
                          <Td>
                            <Badge
                              text={m.type}
                              tone={m.type === "RESTOCK" ? "emerald" : "blue"}
                            />
                          </Td>
                          <Td>{m.feedName}</Td>
                          <Td right>{m.qty}</Td>
                          <Td>{m.batchNo || "-"}</Td>
                          <Td>
                            {m.employeeId
                              ? m.employeeId.name ||
                                m.employeeId.email ||
                                m.employeeId
                              : "-"}
                          </Td>
                          <Td
                            className="max-w-[260px] truncate"
                            title={m.note || ""}
                          >
                            {m.note || "-"}
                          </Td>
                          <Td right>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded"
                                title="View"
                                onClick={() => openView(m._id)}
                              >
                                👁️
                              </button>
                              <button
                                className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded"
                                title="Edit"
                                onClick={() => openEdit(m._id)}
                              >
                                ✏️
                              </button>
                              <button
                                className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Delete"
                                onClick={() => removeMovement(m._id)}
                              >
                                🗑️
                              </button>
                            </div>
                          </Td>
                        </tr>
                      ))}
                      {movements.length === 0 && (
                        <tr>
                          <td
                            className="px-6 py-10 text-center text-slate-400"
                            colSpan={8}
                          >
                            No movements match your filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* MODALS */}
      {showRestock && (
        <Modal
          onClose={() => setShowRestock(false)}
          title="New Restock"
          icon="➕"
        >
          <form onSubmit={submitRestock} className="space-y-4">
            <Select
              label="Feed"
              value={restockForm.feedName}
              onChange={(e) =>
                setRestockForm({ ...restockForm, feedName: e.target.value })
              }
              options={feedNames}
            />
            <NumberInput
              type="number"
              required
              label="Quantity"
              min="0"
              step="1"
              value={restockForm.qty}
              onChange={(e) =>
                setRestockForm({ ...restockForm, qty: e.target.value })
              }
            />
            <NumberInput
              type="number"
              required
              label="Unit Price"
              min="0"
              step="0.01"
              value={restockForm.unitPrice}
              onChange={(e) =>
                setRestockForm({ ...restockForm, unitPrice: e.target.value })
              }
            />
            <TextInput
              label="Batch No"
              value={restockForm.batchNo}
              onChange={(e) =>
                setRestockForm({ ...restockForm, batchNo: e.target.value })
              }
            />
            <DateInput
              redquired
              label="Expiry Date"
              value={restockForm.expiryDate}
              onChange={(e) =>
                setRestockForm({ ...restockForm, expiryDate: e.target.value })
              }
            />
            <TextArea
              type="text"
              label="Note"
              rows={3}
              value={restockForm.note}
              onChange={(e) =>
                setRestockForm({ ...restockForm, note: e.target.value })
              }
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button light onClick={() => setShowRestock(false)} type="button">
                Cancel
              </Button>
              <Button loading={submitting} type="submit">
                Save
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {showUse && (
        <Modal
          onClose={() => setShowUse(false)}
          title="Issue to Employee"
          icon="📦"
        >
          <form onSubmit={submitUse} className="space-y-4">
            <Select
              label="Feed"
              value={useForm.feedName}
              onChange={(e) =>
                setUseForm({ ...useForm, feedName: e.target.value })
              }
              options={feedNames}
            />
            <NumberInput
              label="Quantity"
              min="0"
              step="1"
              value={useForm.qty}
              onChange={(e) => setUseForm({ ...useForm, qty: e.target.value })}
            />
            <TextInput
              label="Employee ID"
              placeholder="Paste employee _id"
              value={useForm.employeeId}
              onChange={(e) =>
                setUseForm({ ...useForm, employeeId: e.target.value })
              }
            />
            <TextArea
              label="Note"
              rows={3}
              value={useForm.note}
              onChange={(e) => setUseForm({ ...useForm, note: e.target.value })}
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button light onClick={() => setShowUse(false)} type="button">
                Cancel
              </Button>
              <Button loading={submitting} type="submit">
                Issue
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {viewMv && (
        <Modal
          onClose={() => setViewMv(null)}
          title="Movement Details"
          icon="🔎"
        >
          <div className="space-y-3 text-sm">
            <Row label="Type" value={viewMv.type} />
            <Row label="Feed" value={viewMv.feedName} />
            <Row label="Quantity" value={viewMv.qty} />
            {viewMv.type === "RESTOCK" && (
              <>
                <Row label="Unit Price" value={formatMoney(viewMv.unitPrice)} />
                <Row label="Batch" value={viewMv.batchNo || "-"} />
                <Row
                  label="Expiry"
                  value={
                    viewMv.expiryDate ? viewMv.expiryDate.slice(0, 10) : "-"
                  }
                />
              </>
            )}
            {viewMv.type === "USE" && (
              <Row
                label="Employee"
                value={
                  viewMv.employeeId
                    ? viewMv.employeeId.name || viewMv.employeeId.email
                    : "-"
                }
              />
            )}
            <Row label="Note" value={viewMv.note || "-"} />
            <Row
              label="Date"
              value={new Date(viewMv.createdAt).toLocaleString()}
            />
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={() => setViewMv(null)}>Close</Button>
          </div>
        </Modal>
      )}

      {editMv && (
        <Modal
          onClose={() => setEditMv(null)}
          title={`Edit ${editMv.type}`}
          icon="✏️"
        >
          <form onSubmit={submitEdit} className="space-y-4">
            <Select
              label="Feed"
              value={editForm.feedName}
              onChange={(e) =>
                setEditForm({ ...editForm, feedName: e.target.value })
              }
              options={feedNames}
            />
            <NumberInput
              label="Quantity"
              min="0"
              step="1"
              value={editForm.qty}
              onChange={(e) =>
                setEditForm({ ...editForm, qty: e.target.value })
              }
            />
            {editMv.type === "RESTOCK" ? (
              <>
                <NumberInput
                  label="Unit Price"
                  min="0"
                  step="0.01"
                  value={editForm.unitPrice}
                  onChange={(e) =>
                    setEditForm({ ...editForm, unitPrice: e.target.value })
                  }
                />
                <TextInput
                  label="Batch No"
                  value={editForm.batchNo}
                  onChange={(e) =>
                    setEditForm({ ...editForm, batchNo: e.target.value })
                  }
                />
                <DateInput
                  label="Expiry Date"
                  value={editForm.expiryDate}
                  onChange={(e) =>
                    setEditForm({ ...editForm, expiryDate: e.target.value })
                  }
                />
              </>
            ) : (
              <TextInput
                label="Employee ID"
                value={editForm.employeeId}
                onChange={(e) =>
                  setEditForm({ ...editForm, employeeId: e.target.value })
                }
              />
            )}
            <TextArea
              label="Note"
              rows={3}
              value={editForm.note}
              onChange={(e) =>
                setEditForm({ ...editForm, note: e.target.value })
              }
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button light type="button" onClick={() => setEditMv(null)}>
                Cancel
              </Button>
              <Button loading={submitting} type="submit">
                Save
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default FeedManagement;

/* ---------- small UI helpers ---------- */
function Stat({ label, value }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-emerald-100 text-sm font-medium">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className="p-3 bg-emerald-500/20 rounded-lg">📊</div>
      </div>
    </div>
  );
}
function Loader() {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent" />
      <span className="ml-3 text-slate-600">Loading…</span>
    </div>
  );
}
function Th({ children, right }) {
  return (
    <th
      className={`px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider ${
        right ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}
function Td({ children, right, className = "" }) {
  return (
    <td
      className={`px-6 py-3 whitespace-nowrap text-sm ${
        right ? "text-right" : "text-left"
      } ${className}`}
    >
      {children}
    </td>
  );
}
function Badge({ text, tone }) {
  const map = {
    emerald: "bg-emerald-100 text-emerald-700",
    blue: "bg-blue-100 text-blue-700",
    red: "bg-red-100 text-red-700",
    slate: "bg-slate-200 text-slate-700",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs ${map[tone] || map.slate}`}
    >
      {text}
    </span>
  );
}
function Modal({ children, onClose, title, icon }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 m-4 max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mr-3">
            <span className="text-white text-lg">{icon || "•"}</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500">Fill the form and submit.</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
function TextInput({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <input
        {...props}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
      />
    </div>
  );
}
function NumberInput({ label, ...props }) {
  return <TextInput label={label} type="number" {...props} />;
}
function DateInput({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <input
        type="date"
        {...props}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
      />
    </div>
  );
}
function TextArea({ label, rows = 3, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <textarea
        rows={rows}
        {...props}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
      />
    </div>
  );
}
function Select({ label, value, onChange, options = [] }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
      >
        {options.length === 0 && <option value="">No items</option>}
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
function Button({ children, light, loading, ...props }) {
  return (
    <button
      {...props}
      disabled={loading}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        light
          ? "text-slate-700 bg-white border border-slate-300 hover:bg-slate-50"
          : "text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50"
      }`}
    >
      {loading ? "Saving..." : children}
    </button>
  );
}
function Row({ label, value }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="text-slate-500">{label}</div>
      <div className="col-span-2 text-slate-900">{value}</div>
    </div>
  );
}
function formatMoney(n) {
  if (!n && n !== 0) return "-";
  const num = Number(n);
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
