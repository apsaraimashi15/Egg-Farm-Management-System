// src/components/ReportManagement.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Sidebar from "./Sidebar";

// =============== config ===============
const API_BASE = "http://localhost:5000";
const ENDPOINT = `${API_BASE}/api/reports`;

const api = axios.create();
api.interceptors.request.use((cfg) => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  cfg.headers["Content-Type"] = "application/json";
  return cfg;
});

// =============== helpers ===============
const toInputDate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const normalizeDay = (val) => {
  const dt = new Date(val);
  dt.setHours(0, 0, 0, 0);
  return dt.toISOString();
};

// =============== validation ===============
const schema = yup.object({
  reportType: yup
    .string()
    .oneOf(["daily", "weekly", "monthly"])
    .required("Report type is required"),
  start: yup.string().required("Start date is required"),
  end: yup.string().required("End date is required"),
  eggProduced: yup
    .number()
    .typeError("Enter a number")
    .min(0, "Must be >= 0")
    .required("Egg produced is required"),
  fertilizerUsed: yup
    .number()
    .typeError("Enter a number")
    .min(0, "Must be >= 0")
    .required("Fertilizer used is required"),
});

const ReportManagement = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [reports, setReports] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchDate, setSearchDate] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  // =============== effects ===============
  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (!searchDate) return setFiltered(reports);
    setFiltered(
      reports.filter((r) => toInputDate(r.dateRange.start) === searchDate)
    );
  }, [reports, searchDate]);

  // =============== api ===============
  const fetchAll = async () => {
    try {
      setLoading(true);
      const res = await api.get(ENDPOINT);
      setReports(res.data.reports || []);
      setError("");
    } catch (e) {
      setError(e.response?.data?.message || "Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setModalLoading(true);
      const payload = {
        reportType: data.reportType,
        dateRange: {
          start: normalizeDay(data.start),
          end: normalizeDay(data.end),
        },
        eggProduced: Number(data.eggProduced),
        fertilizerUsed: Number(data.fertilizerUsed),
      };
      if (editing) {
        await api.put(`${ENDPOINT}/${editing._id}`, payload);
      } else {
        await api.post(ENDPOINT, payload);
      }
      await fetchAll();
      setShowModal(false);
      setEditing(null);
      reset({});
    } catch (e) {
      setError(e.response?.data?.message || "Operation failed");
    } finally {
      setModalLoading(false);
    }
  };

  const openAddModal = () => {
    setEditing(null);
    reset({
      reportType: "daily",
      start: "",
      end: "",
      eggProduced: "",
      fertilizerUsed: "",
    });
    setShowModal(true);
  };

  const handleEdit = (rec) => {
    setEditing(rec);
    reset({
      reportType: rec.reportType,
      start: toInputDate(rec.dateRange.start),
      end: toInputDate(rec.dateRange.end),
      eggProduced: rec.eggProduced,
      fertilizerUsed: rec.fertilizerUsed,
    });
    setShowModal(true);
  };

  const askDelete = (rec) => {
    setRecordToDelete(rec);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    try {
      await api.delete(`${ENDPOINT}/${recordToDelete._id}`);
      await fetchAll();
    } catch (e) {
      setError("Failed to delete record");
    } finally {
      setShowDeleteModal(false);
      setRecordToDelete(null);
    }
  };

  // =============== stats ===============
  const totals = useMemo(() => {
    const totalEggs = filtered.reduce(
      (sum, r) => sum + (Number(r.eggProduced) || 0),
      0
    );
    const totalFertilizer = filtered.reduce(
      (sum, r) => sum + (Number(r.fertilizerUsed) || 0),
      0
    );
    const uniqueDays = new Set(
      filtered.map((r) => toInputDate(r.dateRange.start))
    ).size;
    return { totalEggs, totalFertilizer, uniqueDays, rows: filtered.length };
  }, [filtered]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:ml-64">
        <div className="lg:hidden">
          <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm px-4 py-3 shadow-sm border-b border-white/20">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-600 hover:text-slate-800 p-2 rounded-lg hover:bg-white/50 transition-colors"
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
              Reports Management
            </h1>
            <div className="w-9"></div>
          </div>
        </div>
        <main className="p-6 max-w-screen-2xl mx-auto overflow-y-auto">
          {/* Header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-800 rounded-2xl p-8 mb-8 text-white">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-1">
                  Report Management
                </h1>
                <p className="text-emerald-100 text-lg">
                  Track egg production and fertilizer usage
                </p>
              </div>
              <div>
                <button
                  onClick={openAddModal}
                  className="inline-flex items-center px-6 py-3 bg-white text-slate-900 font-semibold rounded-xl hover:bg-emerald-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Add Report
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <p className="text-emerald-100 text-sm font-medium">Rows</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {totals.rows}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <p className="text-green-100 text-sm font-medium">Total Eggs</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {totals.totalEggs}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <p className="text-orange-100 text-sm font-medium">
                  Fertilizer Used
                </p>
                <p className="text-2xl font-bold text-white mt-1">
                  {totals.totalFertilizer}
                </p>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-xl">
              {error}
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Reports</h3>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <button
                  onClick={() => setSearchDate("")}
                  className="px-3 py-2 bg-slate-100 rounded-lg text-sm font-medium hover:bg-slate-200"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      End Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Eggs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Fertilizer
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filtered.map((r, idx) => (
                    <tr
                      key={r._id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900">
                        {r.reportType}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900">
                        {toInputDate(r.dateRange.start)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900">
                        {toInputDate(r.dateRange.end)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900">
                        {r.eggProduced}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900">
                        {r.fertilizerUsed}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(r)}
                          className="text-blue-500 hover:text-blue-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => askDelete(r)}
                          className="text-red-500 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-12 text-slate-500"
                      >
                        No reports found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 m-4 max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSubmit(onSubmit)}>
              <h3 className="text-lg font-semibold mb-4 text-slate-900">
                {editing ? "Edit Report" : "Add Report"}
              </h3>
              <div className="space-y-4">
                <select
                  {...register("reportType")}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                {errors.reportType && (
                  <p className="text-red-600 text-sm">
                    {errors.reportType.message}
                  </p>
                )}

                <input
                  type="date"
                  {...register("start")}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
                {errors.start && (
                  <p className="text-red-600 text-sm">{errors.start.message}</p>
                )}

                <input
                  type="date"
                  {...register("end")}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
                {errors.end && (
                  <p className="text-red-600 text-sm">{errors.end.message}</p>
                )}

                <input
                  type="number"
                  {...register("eggProduced")}
                  placeholder="Eggs Produced"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
                {errors.eggProduced && (
                  <p className="text-red-600 text-sm">
                    {errors.eggProduced.message}
                  </p>
                )}

                <input
                  type="number"
                  {...register("fertilizerUsed")}
                  placeholder="Fertilizer Used"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
                {errors.fertilizerUsed && (
                  <p className="text-red-600 text-sm">
                    {errors.fertilizerUsed.message}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg"
                >
                  {modalLoading ? "Saving..." : editing ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && recordToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 m-4 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Delete Report
            </h3>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {recordToDelete.reportType} report
              </span>
              ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-slate-100 rounded-xl text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 rounded-xl text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportManagement;
