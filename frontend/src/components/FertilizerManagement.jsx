// src/components/FertilizerManagement.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Sidebar from "./Sidebar";

// =============== config ===============
const API_BASE = "http://localhost:5000";
const ENDPOINT = `${API_BASE}/api/fertilizers`;

// Add token automatically
const api = axios.create();
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  cfg.headers["Content-Type"] = "application/json";
  return cfg;
});

// =============== validation ===============
const fertilizerSchema = yup.object({
  month: yup.string().required("Month is required"),
  quantityCollected: yup
    .number()
    .typeError("Enter a number")
    .min(0, "Must be >= 0")
    .required("Collected quantity is required"),
  usedQuantity: yup
    .number()
    .typeError("Enter a number")
    .min(0, "Must be >= 0")
    .default(0),
});

const FertilizerManagement = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fertilizers, setFertilizers] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fertilizerToDelete, setFertilizerToDelete] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(fertilizerSchema),
  });

  // =============== api ===============
  const fetchFertilizers = async () => {
    try {
      setLoading(true);
      const res = await api.get(ENDPOINT);
      setFertilizers(res.data.fertilizers || []);
      setError("");
    } catch (e) {
      setError(e.response?.data?.message || "Failed to fetch fertilizers");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setModalLoading(true);
      if (editing) {
        await api.put(`${ENDPOINT}/${editing._id}`, data);
      } else {
        await api.post(ENDPOINT, data);
      }
      await fetchFertilizers();
      setShowModal(false);
      setEditing(null);
      reset({});
    } catch (e) {
      setError(e.response?.data?.message || "Operation failed");
    } finally {
      setModalLoading(false);
    }
  };

  const handleEdit = (f) => {
    setEditing(f);
    reset({
      month: f.month,
      quantityCollected: f.quantityCollected,
      usedQuantity: f.usedQuantity,
    });
    setShowModal(true);
  };

  const askDelete = (f) => {
    setFertilizerToDelete(f);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!fertilizerToDelete) return;
    try {
      setModalLoading(true);
      await api.delete(`${ENDPOINT}/${fertilizerToDelete._id}`);
      await fetchFertilizers();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to delete record");
    } finally {
      setModalLoading(false);
      setShowDeleteModal(false);
      setFertilizerToDelete(null);
    }
  };

  useEffect(() => {
    fetchFertilizers();
  }, []);

  // =============== stats ===============
  const totals = useMemo(() => {
    const collected = fertilizers.reduce((a, b) => a + (Number(b.quantityCollected) || 0), 0);
    const used = fertilizers.reduce((a, b) => a + (Number(b.usedQuantity) || 0), 0);
    return { collected, used, remaining: collected - used, rows: fertilizers.length };
  }, [fertilizers]);

  // =============== UI ===============
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 md:pl-72 lg:pl-72">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="ml-0 md:ml-72 lg:ml-72 flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-green-600 border-t-transparent mb-4"></div>
            <p className="text-slate-600 font-medium">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1">
        <div className="lg:hidden">
          <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm px-4 py-3 shadow-sm border-b border-white/20">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-600 hover:text-slate-800 p-2 rounded-lg hover:bg-white/50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-slate-800">Fertilizer Collection</h1>
            <div className="w-9"></div>
          </div>
        </div>
        <main className="p-6 mb-100">
          <div className="max-w-screen-2xl mx-auto">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-green-900 via-emerald-900 to-green-800 rounded-2xl p-8 mb-8 text-white">
              <h1 className="text-3xl font-bold tracking-tight mb-2">Fertilizer Collection</h1>
              <p className="text-emerald-100 text-lg">Track collected and used fertilizer by month</p>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                  <p className="text-sm">Rows</p>
                  <p className="text-2xl font-bold">{totals.rows}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                  <p className="text-sm">Total Collected</p>
                  <p className="text-2xl font-bold">{totals.collected}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                  <p className="text-sm">Remaining</p>
                  <p className="text-2xl font-bold">{totals.remaining}</p>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold">Fertilizer Records</h3>
                <button
                  onClick={() => { setEditing(null); reset({ month: "", quantityCollected: "", usedQuantity: 0 }); setShowModal(true); }}
                  className="px-4 py-2 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700"
                >
                  Add Record
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">#</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Month</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Collected</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Used</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Remaining</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {fertilizers.map((f, idx) => (
                      <tr key={f._id}>
                        <td className="px-6 py-4 text-sm text-slate-500">{idx + 1}</td>
                        <td className="px-6 py-4 text-sm">{f.month}</td>
                        <td className="px-6 py-4 text-sm">{f.quantityCollected}</td>
                        <td className="px-6 py-4 text-sm">{f.usedQuantity}</td>
                        <td className="px-6 py-4 text-sm">{f.quantityCollected - f.usedQuantity}</td>
                        <td className="px-6 py-4 text-right text-sm">
                          <button onClick={() => handleEdit(f)} className="mr-2 text-blue-600">✏️</button>
                          <button onClick={() => askDelete(f)} className="text-red-600">🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {fertilizers.length === 0 && (
                  <div className="text-center py-6 text-slate-500">No records yet</div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 m-4 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <h3 className="text-lg font-semibold mb-4">{editing ? "Edit Record" : "Add Record"}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm">Month</label>
                  <input {...register("month")} className="w-full border p-2 rounded" />
                  {errors.month && <p className="text-sm text-red-600">{errors.month.message}</p>}
                </div>
                <div>
                  <label className="block text-sm">Collected Quantity</label>
                  <input type="number" {...register("quantityCollected")} className="w-full border p-2 rounded" />
                  {errors.quantityCollected && <p className="text-sm text-red-600">{errors.quantityCollected.message}</p>}
                </div>
                <div>
                  <label className="block text-sm">Used Quantity</label>
                  <input type="number" {...register("usedQuantity")} className="w-full border p-2 rounded" />
                  {errors.usedQuantity && <p className="text-sm text-red-600">{errors.usedQuantity.message}</p>}
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" disabled={modalLoading} className="px-4 py-2 bg-green-600 text-white rounded">
                  {modalLoading ? "Saving..." : editing ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && fertilizerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-2xl p-6 m-4 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Delete Record</h3>
            <p className="mb-6">Delete record for <strong>{fertilizerToDelete.month}</strong>?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={confirmDelete} disabled={modalLoading} className="px-4 py-2 bg-red-600 text-white rounded">
                {modalLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FertilizerManagement;
