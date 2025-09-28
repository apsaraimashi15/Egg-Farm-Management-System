import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";

const API_BASE = "http://localhost:5000";
const CATEGORIES = ["general", "product", "billing", "technical"];
const PRIORITIES = ["low", "medium", "high"];
const STATUSES = ["open", "in_progress", "resolved", "closed"];

/** pass mode="buyer" to use Buyer view; default is admin/hr view */
const TicketManagement = ({ mode = "admin" }) => {
  const { user } = useAuth() || {};
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : "";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [ticketNo, setTicketNo] = useState("");

  // modal (create/edit)
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    subject: "",
    message: "",
    category: "general",
    priority: "medium",
  });

  // details modal
  const [showDetails, setShowDetails] = useState(false);
  const [selected, setSelected] = useState(null);

  const axiosClient = useMemo(
    () =>
      axios.create({
        baseURL: API_BASE,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    [token]
  );

  const canAdmin = user?.role === "admin" || user?.role === "hrmanager";
  const buyerView = mode === "buyer" || user?.role === "buyer";

  const load = async () => {
    try {
      setLoading(true);
      setErr("");

      const params = {};
      if (search) params.search = search;
      if (status) params.status = status;
      if (priority) params.priority = priority;
      if (category) params.category = category;
      if (ticketNo) params.ticketNo = ticketNo;
      if (buyerView) params.mine = "true";

      const res = await axiosClient.get("/api/tickets", { params });
      const list = res.data.items || res.data || [];
      setTickets(
        buyerView
          ? list.filter(
              (t) => String(t.buyerId?._id || t.buyerId) === String(user?._id)
            )
          : list
      );
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      subject: "",
      message: "",
      category: "general",
      priority: "medium",
    });
    setShowModal(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({
      subject: t.subject || "",
      message: t.message || "",
      category: t.category || "general",
      priority: t.priority || "medium",
    });
    setShowModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      if (editing) {
        if (buyerView && editing.status !== "open") {
          alert("You can edit only when status is OPEN.");
          return;
        }
        await axiosClient.patch(`/api/tickets/${editing._id}`, form);
      } else {
        await axiosClient.post("/api/tickets", form);
      }
      setShowModal(false);
      setEditing(null);
      load();
    } catch (e) {
      alert(e?.response?.data?.error || e.message || "Operation failed");
    } finally {
      setModalLoading(false);
    }
  };

  const changeStatus = async (id, newStatus) => {
    try {
      await axiosClient.patch(`/api/tickets/${id}/status`, {
        status: newStatus,
      });
      load();
    } catch (e) {
      alert(e?.response?.data?.error || "Failed to update status");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this ticket?")) return;
    try {
      await axiosClient.delete(`/api/tickets/${id}`);
      load();
    } catch (e) {
      alert(e?.response?.data?.error || "Failed to delete");
    }
  };

  const generateTicketPDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth(); // 210
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297
      const margin = 14;
      const usableWidth = pageWidth - margin * 2; // 182
      const HEADER_BAND = 37;
      const FOOTER_SPACE = 14;
      const CELL_PAD_X = 2;
      const LINE_H = 4.2; // row line height in mm

      const _COMPANY = {
        name: COMPANY?.name || "Company",
        email: COMPANY?.email || "",
        phone: COMPANY?.phone || "",
        website: COMPANY?.website || "",
        address: COMPANY?.address || "",
      };
      const _buyerView = !!buyerView;
      const _tickets = Array.isArray(tickets) ? tickets : [];

      let y = margin;

      const line = (x1, y1, x2, y2, color = [226, 232, 240]) => {
        pdf.setDrawColor(...color);
        pdf.line(x1, y1, x2, y2);
      };

      const toDataURL = (url) =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
          };
          img.onerror = reject;
          img.src = url;
        });

      const bottomLimit = () => pageHeight - FOOTER_SPACE;

      const drawFooter = () => {
        const footerY = pageHeight - 10;
        line(
          margin,
          footerY - 4,
          pageWidth - margin,
          footerY - 4,
          [203, 213, 225]
        );
        pdf.setTextColor(100, 116, 139);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.text(
          "Egg Farm Management System — Tickets Report",
          margin,
          footerY
        );
        const currentPage = pdf.internal.getNumberOfPages();
        pdf.text(`Page ${currentPage}`, pageWidth - margin, footerY, {
          align: "right",
        });
      };

      const addPage = () => {
        drawFooter();
        pdf.addPage();
        y = margin;
        drawHeader();
        y = HEADER_BAND + 6;
      };

      const addPageIfNeeded = (needed = 8) => {
        if (y + needed > bottomLimit()) addPage();
      };

      let logoDataURL = null;
      try {
        logoDataURL = await toDataURL(logo);
      } catch (e) {
        console.warn("Logo load failed:", e);
      }

      const drawHeader = () => {
        pdf.setFillColor(40, 87, 74);
        pdf.rect(0, 0, pageWidth, HEADER_BAND, "F");

        if (logoDataURL) {
          pdf.addImage(logoDataURL, "PNG", margin, 6, 18, 18);
        }

        const xShift = logoDataURL ? 22 : 0;

        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(15);
        pdf.text(_COMPANY.name, margin + xShift, 13);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);

        let hy = 20;
        const leftLines = [
          _COMPANY.email && `Email: ${_COMPANY.email}`,
          _COMPANY.phone && `Phone: ${_COMPANY.phone}`,
          _COMPANY.website && `Website: ${_COMPANY.website}`,
          _COMPANY.address && `Address: ${_COMPANY.address}`,
        ].filter(Boolean);

        leftLines.forEach((s) => {
          pdf.text(s, margin + xShift, hy);
          hy += 4;
        });

        const title = _buyerView
          ? "My Tickets Report"
          : "Ticket Management Report";
        const when = new Date().toLocaleString();
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.text(title, pageWidth - margin, 12, { align: "right" });
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.text(`Generated: ${when}`, pageWidth - margin, 18, {
          align: "right",
        });
      };

      const section = (label) => {
        addPageIfNeeded(12);
        pdf.setFillColor(16, 185, 129);
        pdf.roundedRect(margin, y, 4, 6, 1, 1, "F");
        pdf.setTextColor(15, 23, 42);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.text(label, margin + 8, y + 5);
        y += 10;
      };

      const muted = (cb) => {
        pdf.setTextColor(71, 85, 105);
        cb();
        pdf.setTextColor(15, 23, 42);
      };

      const split = (text, maxW) => {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        return pdf.splitTextToSize(
          String(text ?? ""),
          Math.max(2, maxW - CELL_PAD_X * 2)
        );
      };

      const drawTableHeader = (headers, widths) => {
        addPageIfNeeded(12);
        const tableWidth = widths.reduce((a, b) => a + b, 0);
        pdf.setFillColor(40, 87, 74);
        pdf.rect(margin - 1, y - 5, tableWidth + 2, 9, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        let x = margin;
        headers.forEach((h, i) => {
          pdf.text(h, x + CELL_PAD_X, y);
          x += widths[i];
        });
        y += 6;
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(15, 23, 42);
        pdf.setFontSize(9);
      };

      const drawBarChart = ({
        title,
        data,
        labelWidth = 40,
        barHeight = 6,
        gap = 4,
      }) => {
        const chartW = Math.min(90, usableWidth - labelWidth - 8);
        const needed = (barHeight + gap) * data.length + 18;
        addPageIfNeeded(needed);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.text(title, margin, y);
        y += 4;

        const maxVal = Math.max(1, ...data.map((d) => d.value));
        data.forEach((d) => {
          muted(() => pdf.text(String(d.label), margin, y + barHeight - 1));
          const w = Math.round((d.value / maxVal) * chartW);
          pdf.setFillColor(40, 87, 74);
          pdf.rect(margin + labelWidth, y, w, barHeight, "F");
          pdf.text(
            String(d.value),
            margin + labelWidth + w + 2,
            y + barHeight - 1
          );
          y += barHeight + gap;
        });
        y += 2;
      };

      const safeDate = (v) => (v ? new Date(v).toLocaleString() : "-");

      // ---------- HEADER ----------
      drawHeader();
      y = HEADER_BAND + 6;

      // ---------- ticket totals ----------
      const total = _tickets.length;
      const openCount = _tickets.filter((t) => t.status === "open").length;
      const inprog = _tickets.filter((t) => t.status === "in_progress").length;
      const resolved = _tickets.filter((t) => t.status === "resolved").length;
      const closed = _tickets.filter((t) => t.status === "closed").length;

      section("Ticket Summary");
      pdf.text("", margin, y);
      y += 4;

      const statLine = `Total: ${total}   |   Open: ${openCount}   |   In Progress: ${inprog}   |   Resolved: ${resolved}   |   Closed: ${closed}`;
      addPageIfNeeded(LINE_H + 6);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      const statWrapped = pdf.splitTextToSize(statLine, usableWidth);
      statWrapped.forEach((ln) => {
        pdf.text(ln, margin, y);
        y += LINE_H;
      });

      line(margin, y + 2, pageWidth - margin, y + 2);
      y += 6;

      // ---------- Table ----------
      section("Tickets");
      pdf.text("", margin, y);
      y += 4;

      const isAdmin = !_buyerView;
      const headers = isAdmin
        ? ["#", "Ticket", "Buyer", "Category", "Priority", "Status", "Created"]
        : ["#", "Ticket", "Category", "Priority", "Status", "Created"];

      const widths = isAdmin
        ? [8, 35, 34, 20, 16, 26, 43] // = 182
        : [8, 65, 20, 20, 26, 43]; // = 182

      const drawTableHeaderRepeatable = () => drawTableHeader(headers, widths);
      drawTableHeaderRepeatable();
      pdf.text("", margin, y);
      y += 4;

      const drawRow = (rowCells, ticketNoText = "", isAdminRow = false) => {
        let colLines = [];
        rowCells.forEach((text, i) => {
          if (i === 1) {
            const w = widths[i];
            const subjectLines = split(text, w);
            const ticketNoLines = ticketNoText ? split(ticketNoText, w) : [];
            const totalLines =
              subjectLines.length + (ticketNoLines.length ? 1 : 0);
            colLines.push({
              subjectLines,
              ticketNoLines,
              isTicket: true,
              totalLines,
            });
          } else {
            const w = widths[i];
            const lines = split(text, w);
            colLines.push({ lines, isTicket: false, totalLines: lines.length });
          }
        });

        const maxLines = Math.max(...colLines.map((c) => c.totalLines));
        const rowHeight = Math.max(8, maxLines * LINE_H + 3);

        if (y + rowHeight > bottomLimit()) {
          addPage();
          drawTableHeaderRepeatable();
        }

        let x = margin;
        colLines.forEach((c, i) => {
          const w = widths[i];

          if (c.isTicket) {
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(9);
            let ty = y;
            c.subjectLines.forEach((ln) => {
              pdf.text(ln, x + CELL_PAD_X, ty);
              ty += LINE_H;
            });
            if (c.ticketNoLines.length) {
              pdf.setFontSize(8);
              muted(() => {
                pdf.text(c.ticketNoLines[0], x + CELL_PAD_X, ty);
              });
            }
          } else {
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(9);
            let ty = y;
            c.lines.forEach((ln) => {
              pdf.text(ln, x + CELL_PAD_X, ty);
              ty += LINE_H;
            });
          }

          x += w;
        });

        y += rowHeight;
        line(
          margin - 1,
          y - 3.6,
          margin - 1 + widths.reduce((a, b) => a + b, 0) + 2,
          y - 3.6,
          [241, 245, 249]
        );
      };

      if (_tickets.length === 0) {
        addPageIfNeeded(LINE_H);
        pdf.setTextColor(100, 116, 139);
        pdf.text("No tickets to display for current filters.", margin, y);
        pdf.setTextColor(15, 23, 42);
      } else {
        _tickets.forEach((t, idx) => {
          const buyerCell = isAdmin
            ? `${t.buyerId?.name || "-"}${
                t.buyerId?.email ? ` (${t.buyerId.email})` : ""
              }`
            : null;

          const common = [String(idx + 1), t.subject || "-"];

          const restAdmin = [
            buyerCell || "-",
            t.category || "-",
            (t.priority || "-").toUpperCase(),
            (t.status || "-").replaceAll("_", " "),
            t.createdAt ? new Date(t.createdAt).toLocaleString() : "-",
          ];

          const restBuyer = [
            t.category || "-",
            (t.priority || "-").toUpperCase(),
            (t.status || "-").replaceAll("_", " "),
            t.createdAt ? new Date(t.createdAt).toLocaleString() : "-",
          ];

          const cells = isAdmin
            ? [...common, ...restAdmin]
            : [...common, ...restBuyer];
          const ticketNoText = t.ticketNo ? String(t.ticketNo) : "";
          drawRow(cells, ticketNoText, isAdmin);
        });
      }

      section("Inquiry Categories & Charts");

      const catList = ["general", "product", "billing", "technical"];
      const catCounts = catList.map((c) => ({
        label: c.charAt(0).toUpperCase() + c.slice(1),
        value: _tickets.filter((t) => t.category === c).length,
      }));

      pdf.text("", margin, y);
      y += 4;

      const tw = [Math.min(100, usableWidth - 30), 30];
      pdf.setFillColor(233, 247, 237);
      pdf.rect(margin - 1, y - 5, tw[0] + tw[1] + 2, 9, "F");
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(15, 23, 42);
      pdf.text("Category", margin + CELL_PAD_X, y);
      pdf.text("Count", margin + tw[0] + CELL_PAD_X, y);
      y += 8;

      pdf.setFont("helvetica", "normal");
      catCounts.forEach((row) => {
        addPageIfNeeded(LINE_H);
        pdf.setFontSize(9);
        pdf.text(row.label, margin + CELL_PAD_X, y);
        pdf.text(String(row.value), margin + tw[0] + CELL_PAD_X, y);
        y += 3 + LINE_H;
        line(
          margin - 1,
          y - 3.6,
          margin - 1 + tw[0] + tw[1] + 2,
          y - 3.6,
          [241, 245, 249]
        );
      });
      y += 2;

      section("Status Distribution");

      drawBarChart({
        title: "",
        data: [
          { label: "Open", value: openCount },
          { label: "In Progress", value: inprog },
          { label: "Resolved", value: resolved },
          { label: "Closed", value: closed },
        ],
      });

      drawFooter();

      const fileName = `tickets-${_buyerView ? "mine-" : ""}${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`;
      pdf.save(fileName);
    } catch (e) {
      console.error(e);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const COMPANY = {
    name: "Egg Farm Management",
    email: "info@egg-farm.lk",
    phone: "+94 77 123 4567",
    website: "https://egg-farm.lk",
    address: "No. 12, Farm Road, Gampaha",
  };

  const total = tickets.length;
  const openCount = tickets.filter((t) => t.status === "open").length;
  const inprog = tickets.filter((t) => t.status === "in_progress").length;
  const done = tickets.filter((t) =>
    ["resolved", "closed"].includes(t.status)
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent mb-3" />
            <p className="text-slate-600">Loading…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1">
        {/* top bar mobile */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm px-4 py-3 shadow-sm border-b border-white/20">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-600 p-2 rounded-lg hover:bg-white/50"
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
              {buyerView ? "My Tickets" : "Tickets"}
            </h1>
            <div className="w-9" />
          </div>
        </div>

        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-screen-2xl mx-auto">
            {/* hero */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-800 rounded-2xl p-8 mb-8 text-white">
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                      🎟️
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight">
                        {buyerView
                          ? "My Ticket Management"
                          : "Ticket Management"}
                      </h1>
                      <p className="text-emerald-100 text-lg">
                        {buyerView
                          ? "Create and track your inquiries. You can edit while status is OPEN."
                          : "Create, track and resolve buyer inquiries"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  {buyerView && (
                    <button
                      onClick={openCreate}
                      className="inline-flex items-center px-6 py-3 bg-white text-slate-900 font-semibold rounded-xl hover:bg-emerald-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      New Ticket
                    </button>
                  )}
                </div>
              </div>

              {/* stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
                <Stat label="Total Tickets" value={total} />
                <Stat label="Open" value={openCount} />
                <Stat label="In Progress" value={inprog} />
                <Stat label="Resolved / Closed" value={done} />
              </div>
            </div>

            {err && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl">
                {err}
              </div>
            )}

            {/* table card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* toolbar */}
              <div className="px-6 py-4 border-b border-slate-200">
                <div className="flex flex-col sm:flex-row justify-end items-end gap-3">
                  <button
                    onClick={generateTicketPDF}
                    className="inline-flex px-4 py-2 bg-emerald-600 text-white text-sm font-medium 
               rounded-lg hover:bg-emerald-700 
               border border-slate-300 shadow-sm  mb-6"
                    title="Download PDF report"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
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
                    Download PDF
                  </button>
                </div>

                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {buyerView ? "My Tickets" : "Tickets"}
                    </h3>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="Search text…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="block w-full sm:w-56 px-3 py-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Ticket No (e.g., TKT-000123)"
                      value={ticketNo}
                      onChange={(e) => setTicketNo(e.target.value)}
                      className="block w-full sm:w-52 px-3 py-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    />
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="block w-full sm:w-40 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="">All Status</option>
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="block w-full sm:w-36 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="">All Priority</option>
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="block w-full sm:w-36 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="">All Category</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={load}
                      className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>

              {/* table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <Th>#</Th>
                      <Th>Ticket</Th>
                      <Th>Category</Th>
                      <Th>Priority</Th>
                      <Th>Status</Th>
                      <Th>Created</Th>
                      <Th right>Actions</Th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {tickets.map((t, i) => {
                      const disableBuyerEdit = buyerView && t.status !== "open";
                      const disableAdminDelete =
                        canAdmin && t.status !== "open";
                      return (
                        <tr key={t._id} className="hover:bg-slate-50">
                          <Td>{i + 1}</Td>
                          <Td>
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs">
                                  {t.ticketNo?.split("-")[1] || "TKT"}
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-semibold text-slate-900">
                                  {t.subject}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {t.ticketNo}
                                </div>
                              </div>
                            </div>
                          </Td>
                          <Td className="capitalize">{t.category}</Td>
                          <Td>
                            <Badge
                              text={t.priority}
                              tone={
                                t.priority === "high"
                                  ? "red"
                                  : t.priority === "medium"
                                  ? "amber"
                                  : "emerald"
                              }
                            />
                          </Td>

                          {/* ✅ Status cell: admin/hr can change with a select, others see a badge */}
                          <Td>
                            {canAdmin ? (
                              <select
                                className="text-xs border-slate-300 rounded-md px-2 py-1"
                                value={t.status}
                                onChange={(e) =>
                                  changeStatus(t._id, e.target.value)
                                }
                                title="Change status"
                              >
                                {STATUSES.map((s) => (
                                  <option key={s} value={s}>
                                    {s.replace("_", " ")}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <Badge
                                text={t.status?.replace("_", " ")}
                                tone={
                                  t.status === "open"
                                    ? "emerald"
                                    : t.status === "in_progress"
                                    ? "blue"
                                    : t.status === "resolved"
                                    ? "violet"
                                    : "slate"
                                }
                              />
                            )}
                          </Td>

                          <Td>{new Date(t.createdAt).toLocaleString()}</Td>
                          <Td right>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100"
                                title="View"
                                onClick={() => {
                                  setSelected(t);
                                  setShowDetails(true);
                                }}
                              >
                                👁️
                              </button>

                              {buyerView && (
                                <button
                                  disabled={disableBuyerEdit}
                                  className={`p-1 rounded-md ${
                                    disableBuyerEdit
                                      ? "text-slate-300"
                                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                  }`}
                                  title={
                                    disableBuyerEdit
                                      ? "You can edit only when status is OPEN"
                                      : "Edit"
                                  }
                                  onClick={() => openEdit(t)}
                                >
                                  ✏️
                                </button>
                              )}

                              {canAdmin && (
                                <button
                                  disabled={disableAdminDelete}
                                  className={`p-1 rounded-md ${
                                    disableAdminDelete
                                      ? "text-slate-300"
                                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                  }`}
                                  title={
                                    disableAdminDelete
                                      ? "You can delete only when status is OPEN"
                                      : "Delete"
                                  }
                                  onClick={() => remove(t._id)}
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </Td>
                        </tr>
                      );
                    })}
                    {tickets.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-10 text-center text-slate-400"
                        >
                          No tickets found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* create/edit modal */}
            {showModal && (
              <Modal onClose={() => setShowModal(false)}>
                <form onSubmit={submit}>
                  <ModalHeader title={editing ? "Edit Ticket" : "New Ticket"} />
                  <div className="space-y-4">
                    <Labeled label="Subject">
                      <input
                        type="text"
                        minLength={10}
                        maxLength={100}
                        value={form.subject}
                        onChange={(e) =>
                          setForm({ ...form, subject: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Short title"
                        required
                      />
                    </Labeled>
                    <Labeled label="Message">
                      <textarea
                        minLength={10}
                        maxLength={5000}
                        rows={5}
                        value={form.message}
                        onChange={(e) =>
                          setForm({ ...form, message: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Describe your issue"
                        required
                      />
                    </Labeled>
                    <div className="grid grid-cols-2 gap-4">
                      <Labeled label="Category">
                        <select
                          required
                          value={form.category}
                          onChange={(e) =>
                            setForm({ ...form, category: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </Labeled>
                      <Labeled label="Priority">
                        <select
                          required
                          value={form.priority}
                          onChange={(e) =>
                            setForm({ ...form, priority: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        >
                          {PRIORITIES.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </Labeled>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={modalLoading}
                      className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50"
                    >
                      {modalLoading
                        ? "Saving..."
                        : editing
                        ? "Update"
                        : "Create"}
                    </button>
                  </div>
                </form>
              </Modal>
            )}

            {/* details modal */}
            {showDetails && selected && (
              <Modal onClose={() => setShowDetails(false)}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-semibold text-lg mr-4">
                      {selected.ticketNo?.split("-")[1] || "TKT"}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">
                        {selected.subject}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {selected.ticketNo}
                      </p>
                    </div>
                  </div>
                  <CloseBtn onClick={() => setShowDetails(false)} />
                </div>

                <div className="space-y-3 text-sm">
                  <Row label="Category" value={selected.category} />
                  <Row label="Priority" value={selected.priority} />
                  <Row
                    label="Status"
                    value={selected.status?.replace("_", " ")}
                  />
                  <Row
                    label="Created"
                    value={new Date(selected.createdAt).toLocaleString()}
                  />
                  <div>
                    <div className="text-slate-500 mb-1">Message</div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 whitespace-pre-wrap">
                      {selected.message}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowDetails(false)}
                    className="px-4 py-2 text-sm text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                  >
                    Close
                  </button>
                </div>
              </Modal>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TicketManagement;

/* ---------- UI helpers ---------- */
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
      className={`px-6 py-4 whitespace-nowrap text-sm ${
        right ? "text-right" : "text-left"
      } ${className}`}
    >
      {children}
    </td>
  );
}
function Badge({ text, tone }) {
  const map = {
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
    emerald: "bg-emerald-100 text-emerald-700",
    blue: "bg-blue-100 text-blue-700",
    violet: "bg-violet-100 text-violet-700",
    slate: "bg-slate-200 text-slate-700",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs capitalize ${
        map[tone] || map.slate
      }`}
    >
      {text}
    </span>
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
function Modal({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 m-4 max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
function ModalHeader({ title }) {
  return (
    <div className="flex items-center mb-6">
      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mr-3">
        🎟️
      </div>
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500">
          Buyers can edit only while status is <b>open</b>.
        </p>
      </div>
    </div>
  );
}
function CloseBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100"
    >
      ✖
    </button>
  );
}
function Labeled({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
