// src/components/ReportManagement.jsx
import React, { useState } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";

// =============== config ===============
const API_BASE = "http://localhost:5000";
const EGG_ENDPOINT = `${API_BASE}/api/egg-production`;
const FERTILIZER_ENDPOINT = `${API_BASE}/api/fertilizers`;

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

const ReportManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfDateRange, setPdfDateRange] = useState({ start: "", end: "" });

  // =============== PDF Generation Functions ===============
  const generateCombinedPDF = async () => {
    try {
      setPdfLoading(true);

      // Fetch data from both APIs
      const [eggRes, fertilizerRes] = await Promise.all([
        api.get(EGG_ENDPOINT),
        api.get(FERTILIZER_ENDPOINT),
      ]);

      const eggData = eggRes.data || [];
      const fertilizerData = fertilizerRes.data.fertilizers || [];

      // Filter by date range if specified
      let filteredEggs = eggData;
      let filteredFertilizers = fertilizerData;

      if (pdfDateRange.start && pdfDateRange.end) {
        const startDate = new Date(pdfDateRange.start);
        const endDate = new Date(pdfDateRange.end);

        filteredEggs = eggData.filter((egg) => {
          const eggDate = new Date(egg.date);
          return eggDate >= startDate && eggDate <= endDate;
        });
      }

      // Import jsPDF
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF("p", "mm", "a4");
      const margin = 14;
      const pageWidth = doc.internal.pageSize.width;
      let y = 20;

      // ========== TITLE PAGE ==========
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("Farm Management Report", pageWidth / 2, y, { align: "center" });
      y += 10;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, y, {
        align: "center",
      });
      y += 8;

      if (pdfDateRange.start && pdfDateRange.end) {
        doc.text(
          `Period: ${pdfDateRange.start} to ${pdfDateRange.end}`,
          pageWidth / 2,
          y,
          { align: "center" }
        );
        y += 8;
      }

      // ========== SUMMARY SECTION ==========
      y += 5;
      doc.setFillColor(34, 197, 94);
      doc.rect(margin, y, pageWidth - 2 * margin, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Summary", margin + 3, y + 5.5);
      y += 12;

      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      const totalEggs = filteredEggs.reduce(
        (sum, e) => sum + (Number(e.quantity) || 0),
        0
      );
      const totalFertilizerCollected = filteredFertilizers.reduce(
        (sum, f) => sum + (Number(f.quantityCollected) || 0),
        0
      );
      const totalFertilizerUsed = filteredFertilizers.reduce(
        (sum, f) => sum + (Number(f.usedQuantity) || 0),
        0
      );
      const totalFertilizerRemaining =
        totalFertilizerCollected - totalFertilizerUsed;

      doc.text(
        `Total Egg Production Records: ${filteredEggs.length}`,
        margin,
        y
      );
      y += 6;
      doc.text(`Total Eggs Collected: ${totalEggs}`, margin, y);
      y += 6;
      doc.text(
        `Total Fertilizer Collected: ${totalFertilizerCollected}`,
        margin,
        y
      );
      y += 6;
      doc.text(`Total Fertilizer Used: ${totalFertilizerUsed}`, margin, y);
      y += 6;
      doc.text(
        `Total Fertilizer Remaining: ${totalFertilizerRemaining}`,
        margin,
        y
      );
      y += 10;

      // ========== EGG PRODUCTION SECTION ==========
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFillColor(16, 185, 129);
      doc.rect(margin, y, pageWidth - 2 * margin, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Egg Production Details", margin + 3, y + 5.5);
      y += 12;

      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("No", margin, y);
      doc.text("Date", margin + 12, y);
      doc.text("Type", margin + 50, y);
      doc.text("Quantity", margin + 80, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      filteredEggs.forEach((egg, idx) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(String(idx + 1), margin, y);
        doc.text(toInputDate(egg.date), margin + 12, y);
        doc.text(egg.type || "Mixed", margin + 50, y);
        doc.text(String(egg.quantity), margin + 80, y);
        y += 6;
      });

      if (filteredEggs.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.text("No egg production records found for this period", margin, y);
        y += 6;
      }

      y += 10;

      // ========== FERTILIZER SECTION ==========
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFillColor(251, 146, 60);
      doc.rect(margin, y, pageWidth - 2 * margin, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Fertilizer Details", margin + 3, y + 5.5);
      y += 12;

      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("No", margin, y);
      doc.text("Month", margin + 12, y);
      doc.text("Collected", margin + 50, y);
      doc.text("Used", margin + 80, y);
      doc.text("Remaining", margin + 110, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      filteredFertilizers.forEach((fert, idx) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        const remaining =
          (fert.quantityCollected || 0) - (fert.usedQuantity || 0);
        doc.text(String(idx + 1), margin, y);
        doc.text(fert.month || "-", margin + 12, y);
        doc.text(String(fert.quantityCollected || 0), margin + 50, y);
        doc.text(String(fert.usedQuantity || 0), margin + 80, y);
        doc.text(String(remaining), margin + 110, y);
        y += 6;
      });

      if (filteredFertilizers.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.text("No fertilizer records found", margin, y);
        y += 6;
      }

      // ========== FOOTER ==========
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        );
      }

      // Save the PDF
      const fileName =
        pdfDateRange.start && pdfDateRange.end
          ? `farm-report-${pdfDateRange.start}-to-${pdfDateRange.end}.pdf`
          : `farm-report-${new Date().toISOString().slice(0, 10)}.pdf`;

      doc.save(fileName);
      setShowPdfModal(false);
      setPdfDateRange({ start: "", end: "" });
    } catch (e) {
      console.error("PDF Generation Error:", e);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  };

  const generateEggPDF = async () => {
    try {
      setPdfLoading(true);
      const res = await api.get(EGG_ENDPOINT);
      const eggData = res.data || [];

      let filteredEggs = eggData;
      if (pdfDateRange.start && pdfDateRange.end) {
        const startDate = new Date(pdfDateRange.start);
        const endDate = new Date(pdfDateRange.end);
        filteredEggs = eggData.filter((egg) => {
          const eggDate = new Date(egg.date);
          return eggDate >= startDate && eggDate <= endDate;
        });
      }

      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF("p", "mm", "a4");
      const margin = 14;
      let y = 16;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Egg Production Report", margin, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
      y += 6;

      if (pdfDateRange.start && pdfDateRange.end) {
        doc.text(
          `Period: ${pdfDateRange.start} to ${pdfDateRange.end}`,
          margin,
          y
        );
        y += 6;
      }

      const totalQty = filteredEggs.reduce(
        (a, b) => a + (Number(b.quantity) || 0),
        0
      );
      doc.text(
        `Total Records: ${filteredEggs.length}   |   Total Quantity: ${totalQty}`,
        margin,
        y
      );
      y += 8;

      doc.setFont("helvetica", "bold");
      doc.text("No", margin, y);
      doc.text("Date", margin + 14, y);
      doc.text("Type", margin + 50, y);
      doc.text("Quantity", margin + 80, y);
      y += 6;
      doc.setFont("helvetica", "normal");

      filteredEggs.forEach((r, idx) => {
        if (y > 280) {
          doc.addPage();
          y = 16;
        }
        doc.text(String(idx + 1), margin, y);
        doc.text(toInputDate(r.date), margin + 14, y);
        doc.text(r.type || "-", margin + 50, y);
        doc.text(String(r.quantity), margin + 80, y);
        y += 6;
      });

      const fileName =
        pdfDateRange.start && pdfDateRange.end
          ? `egg-production-${pdfDateRange.start}-to-${pdfDateRange.end}.pdf`
          : `egg-production-${new Date().toISOString().slice(0, 10)}.pdf`;

      doc.save(fileName);
      setShowPdfModal(false);
      setPdfDateRange({ start: "", end: "" });
    } catch (e) {
      console.error(e);
      alert("Failed to generate Egg Production PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  const generateFertilizerPDF = async () => {
    try {
      setPdfLoading(true);
      const res = await api.get(FERTILIZER_ENDPOINT);
      const fertilizerData = res.data.fertilizers || [];

      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF("p", "mm", "a4");
      const margin = 14;
      let y = 16;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Fertilizer Collection Report", margin, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
      y += 6;

      const totalCollected = fertilizerData.reduce(
        (a, b) => a + (Number(b.quantityCollected) || 0),
        0
      );
      const totalUsed = fertilizerData.reduce(
        (a, b) => a + (Number(b.usedQuantity) || 0),
        0
      );
      const totalRemaining = totalCollected - totalUsed;

      doc.text(
        `Records: ${fertilizerData.length}   |   Collected: ${totalCollected}   |   Used: ${totalUsed}   |   Remaining: ${totalRemaining}`,
        margin,
        y
      );
      y += 8;

      doc.setFont("helvetica", "bold");
      doc.text("No", margin, y);
      doc.text("Month", margin + 14, y);
      doc.text("Collected", margin + 50, y);
      doc.text("Used", margin + 80, y);
      doc.text("Remaining", margin + 110, y);
      y += 6;
      doc.setFont("helvetica", "normal");

      fertilizerData.forEach((f, idx) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        const remaining = (f.quantityCollected || 0) - (f.usedQuantity || 0);
        doc.text(String(idx + 1), margin, y);
        doc.text(f.month || "-", margin + 14, y);
        doc.text(String(f.quantityCollected || 0), margin + 50, y);
        doc.text(String(f.usedQuantity || 0), margin + 80, y);
        doc.text(String(remaining), margin + 110, y);
        y += 6;
      });

      doc.save(
        `fertilizer-report-${new Date().toISOString().slice(0, 10)}.pdf`
      );
      setShowPdfModal(false);
    } catch (e) {
      console.error(e);
      alert("Failed to generate Fertilizer PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1">
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

        <main className="p-6">
          <div className="max-w-screen-2xl mx-auto">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-800 rounded-2xl p-8 mb-8 text-white">
              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1">
                      Report Management
                    </h1>
                    <p className="text-emerald-100 text-lg">
                      Generate comprehensive PDF reports for egg production and
                      fertilizer tracking
                    </p>
                  </div>
                  <div>
                    <button
                      onClick={() => setShowPdfModal(true)}
                      className="inline-flex items-center px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Generate PDF Report
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mr-4">
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 font-medium">
                      Combined Report
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      Eggs + Fertilizer
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
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
                        d="M12 8c1.5 0 3 .5 4 1.5M8 16a6 6 0 118 0"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 font-medium">
                      Egg Production
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      Daily Records
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mr-4">
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
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 font-medium">
                      Fertilizer
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      Collection Data
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* PDF Generation Modal */}
      {showPdfModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
          onClick={() => !pdfLoading && setShowPdfModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 m-4 max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mr-4">
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Generate PDF Report
                </h3>
                <p className="text-sm text-slate-600">
                  Choose report type and date range
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Date Range (Optional)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={pdfDateRange.start}
                      onChange={(e) =>
                        setPdfDateRange({
                          ...pdfDateRange,
                          start: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={pdfDateRange.end}
                      onChange={(e) =>
                        setPdfDateRange({
                          ...pdfDateRange,
                          end: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Leave empty to include all records
                </p>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Select Report Type
                </label>
                <div className="space-y-2">
                  <button
                    onClick={generateCombinedPDF}
                    disabled={pdfLoading}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                  >
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <div className="text-left">
                        <p className="font-semibold">Combined Report</p>
                        <p className="text-xs text-emerald-100">
                          Eggs + Fertilizer
                        </p>
                      </div>
                    </div>
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={generateEggPDF}
                    disabled={pdfLoading}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                  >
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c1.5 0 3 .5 4 1.5M8 16a6 6 0 118 0"
                        />
                      </svg>
                      <div className="text-left">
                        <p className="font-semibold">Egg Production Only</p>
                        <p className="text-xs text-blue-100">
                          Daily egg records
                        </p>
                      </div>
                    </div>
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={generateFertilizerPDF}
                    disabled={pdfLoading}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                  >
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                      <div className="text-left">
                        <p className="font-semibold">Fertilizer Only</p>
                        <p className="text-xs text-amber-100">
                          Collection records
                        </p>
                      </div>
                    </div>
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {pdfLoading && (
              <div className="flex items-center justify-center py-4 bg-slate-50 rounded-xl mb-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-emerald-600 border-t-transparent mr-3"></div>
                <p className="text-slate-700 font-medium">Generating PDF...</p>
              </div>
            )}

            <button
              onClick={() => setShowPdfModal(false)}
              disabled={pdfLoading}
              className="w-full px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportManagement;
