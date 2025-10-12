import React, { useState, useEffect } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";

const schema = yup.object({
  startDate: yup
    .date()
    .required("Start date is required")
    .min(
      new Date(new Date().setHours(0, 0, 0, 0)),
      "Start date cannot be in the past"
    ),
  endDate: yup
    .date()
    .required("End date is required")
    .min(yup.ref("startDate"), "End date must be after start date"),
  reason: yup
    .string()
    .required("Reason is required")
    .min(5, "Reason must be at least 5 characters"),
});

const LeaveForm = () => {
  const { user } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const today = new Date().toISOString().split("T")[0]; // 2025-10-10

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/leaves/my-leaves",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setLeaveRequests(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch leave requests");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setFormLoading(true);
      setError("");
      setSuccess("");
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/leaves",
        {
          startDate: data.startDate,
          endDate: data.endDate,
          reason: data.reason,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess("Leave request submitted successfully");
      reset();
      fetchLeaveRequests();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit leave request");
    } finally {
      setFormLoading(false);
    }
  };

  const onEditSubmit = async (data) => {
    try {
      setFormLoading(true);
      setError("");
      setSuccess("");
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/leaves/${selectedRequest._id}`,
        {
          startDate: data.startDate,
          endDate: data.endDate,
          reason: data.reason,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess("Leave request updated successfully");
      setShowEditModal(false);
      reset();
      fetchLeaveRequests();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update leave request");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (leaveId) => {
    if (!window.confirm("Are you sure you want to delete this leave request?"))
      return;
    try {
      setError("");
      setSuccess("");
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/leaves/${leaveId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess("Leave request deleted successfully");
      fetchLeaveRequests();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete leave request");
    }
  };

  const viewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const editRequest = (request) => {
    setSelectedRequest(request);
    setValue(
      "startDate",
      new Date(request.startDate).toISOString().split("T")[0]
    );
    setValue("endDate", new Date(request.endDate).toISOString().split("T")[0]);
    setValue("reason", request.reason);
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent mb-4"></div>
            <p className="text-slate-600 font-medium">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1">
        {/* Mobile menu button */}
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
            <h1 className="text-lg font-semibold text-slate-800">Leave Form</h1>
            <div className="w-9"></div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-screen-2xl mx-auto">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-800 rounded-2xl p-8 mb-8 text-white">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 -translate-y-12"></div>
                <div className="absolute bottom-0 left-1/4 w-20 h-20 bg-white rounded-full translate-y-10"></div>
                <div className="absolute bottom-0 right-1/3 w-16 h-16 bg-white rounded-full translate-y-8"></div>
              </div>

              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4">
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                          Leave Form
                        </h1>
                        <p className="text-emerald-100 text-lg">
                          Submit and manage your leave requests
                        </p>
                      </div>
                    </div>
                    <p className="text-slate-300 max-w-2xl">
                      Request time off, edit pending requests, or delete them
                      before approval. Ensure all details are accurate before
                      submission.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Success message */}
            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-green-400 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {success}
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-red-400 mr-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            {/* Leave Request Form */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Submit a Leave Request
              </h3>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Start Date
                  </label>
                  <input
                    {...register("startDate")}
                    type="date"
                    min={today}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  {errors.startDate && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.startDate.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    End Date
                  </label>
                  <input
                    {...register("endDate")}
                    type="date"
                    min={today}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  {errors.endDate && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.endDate.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Reason
                  </label>
                  <textarea
                    {...register("reason")}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    rows="4"
                    placeholder="Enter the reason for your leave"
                  />
                  {errors.reason && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.reason.message}
                    </p>
                  )}
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
                  >
                    {formLoading ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </form>
            </div>

            {/* My Leave Requests */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">
                  My Leave Requests
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  View, edit, or delete your pending leave requests
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Date Range
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {leaveRequests.map((request, index) => (
                      <tr
                        key={request._id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {new Date(request.startDate).toLocaleDateString()} -{" "}
                          {new Date(request.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {request.reason}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              request.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : request.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {request.status.charAt(0).toUpperCase() +
                              request.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => viewDetails(request)}
                            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
                            title="View details"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>
                          {request.status === "pending" && (
                            <>
                              <button
                                onClick={() => editRequest(request)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors ml-2"
                                title="Edit request"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(request._id)}
                                className="text-slate-400 hover:text-red-600 p-1 rounded-md hover:bg-slate-100 transition-colors ml-2"
                                title="Delete request"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {leaveRequests.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    No leave requests yet
                  </h3>
                  <p className="text-slate-500 mb-6">
                    Submit a new leave request using the form above.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 m-4 max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold text-lg mr-4">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    {user?.name || "Unknown"}
                  </h3>
                  <p className="text-sm text-slate-600">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    Start Date
                  </label>
                  <p className="text-sm text-slate-900">
                    {new Date(selectedRequest.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    End Date
                  </label>
                  <p className="text-sm text-slate-900">
                    {new Date(selectedRequest.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">
                  Reason
                </label>
                <p className="text-sm text-slate-900">
                  {selectedRequest.reason}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">
                  Status
                </label>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${
                    selectedRequest.status === "approved"
                      ? "bg-green-100 text-green-800"
                      : selectedRequest.status === "rejected"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {selectedRequest.status.charAt(0).toUpperCase() +
                    selectedRequest.status.slice(1)}
                </span>
              </div>
              {selectedRequest.status === "approved" &&
                selectedRequest.approvedBy && (
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">
                      Approved By
                    </label>
                    <p className="text-sm text-slate-900">
                      {selectedRequest.approvedBy.name} (
                      {selectedRequest.approvedBy.email})
                    </p>
                  </div>
                )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    Submitted
                  </label>
                  <p className="text-sm text-slate-900">
                    {new Date(selectedRequest.createdAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    Last Updated
                  </label>
                  <p className="text-sm text-slate-900">
                    {new Date(selectedRequest.updatedAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 m-4 max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-900">
                Edit Leave Request
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Start Date
                </label>
                <input
                  {...register("startDate")}
                  type="date"
                  min={today}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.startDate.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  End Date
                </label>
                <input
                  {...register("endDate")}
                  type="date"
                  min={today}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.endDate.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Reason
                </label>
                <textarea
                  {...register("reason")}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  rows="4"
                  placeholder="Enter the reason for your leave"
                />
                {errors.reason && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.reason.message}
                  </p>
                )}
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  {formLoading ? "Updating..." : "Update Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveForm;
