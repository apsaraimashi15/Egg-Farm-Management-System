import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";
import axios from "axios";

const API = "http://localhost:5000";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // --- SAFETY: never render this for buyers (RoleBasedDashboard should handle it too) ---
  if (user?.role === "buyer") {
    return null; // or <></> ; buyers should only see BuyerDashboard
  }

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "admin";
  const isHR = user?.role === "hrmanager";
  const isEmployee = user?.role === "employee";

  const roleMeta = {
    admin: {
      icon: "🛠️",
      title: "Admin Control Center",
      subtitle:
        "Manage users, feed stock, production, inquiries, and buyer orders.",
    },
    hrmanager: {
      icon: "🧑‍💼",
      title: "HR Operations",
      subtitle: "Track attendance, leaves, and view users.",
    },
    employee: {
      icon: "🥚",
      title: "Production & Feed",
      subtitle: "Record egg production and request/record feed usage.",
    },
  };
  const meta = roleMeta[user?.role] ?? roleMeta.employee;

  // real API counts
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalTickets, setTotalTickets] = useState(0);
  const [totalFeedQty, setTotalFeedQty] = useState(0);
  const [totalFeedItems, setTotalFeedItems] = useState(0);

  // local demo stats (NO buyer fields)
  const [stats, setStats] = useState({
    ticketsOpen: 0,
    ticketsInProgress: 0,
    feedItems: 0,
    feedQty: 0,
    eggToday: 0,
    attendanceToday: 0,
    leavesPending: 0,
    buyerOrders: 0, // admin analytics only
  });
  const [recent, setRecent] = useState([]);

  const axiosClient = useMemo(() => {
    const token = localStorage.getItem("token");
    return axios.create({
      baseURL: API,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }, [user?._id, user?.role]); // update if user changes

  useEffect(() => {
    const loadCounts = async () => {
      setLoading(true);

      // USERS (only for admin/hr)
      try {
        if (isAdmin || isHR) {
          const res = await axiosClient.get("/api/users");
          setTotalUsers(Array.isArray(res.data) ? res.data.length : 0);
        } else {
          setTotalUsers(0);
        }
      } catch (e) {
        console.warn("users error:", e?.response?.status, e?.response?.data);
        setTotalUsers(0);
      }

      // TICKETS (global count for admin/hr/employee)
      try {
        const params = { page: 1, limit: 1 }; // only need count
        const res = await axiosClient.get("/api/tickets", { params });

        let ticketTotal = 0;
        if (res?.data && typeof res.data === "object") {
          if (typeof res.data.total === "number") ticketTotal = res.data.total;
          else if (Array.isArray(res.data.items))
            ticketTotal = res.data.items.length;
          else if (Array.isArray(res.data)) ticketTotal = res.data.length;
        }
        setTotalTickets(ticketTotal);
      } catch (e) {
        console.warn("tickets error:", e?.response?.status, e?.response?.data);
        setTotalTickets(0);
      }

      // FEED TOTALS
      try {
        const res = await axiosClient.get("/api/feed/totals");
        const arr = Array.isArray(res.data) ? res.data : [];
        const qtySum = arr.reduce(
          (sum, r) => sum + (Number(r.quantity) || 0),
          0
        );
        setTotalFeedQty(qtySum);
        setTotalFeedItems(arr.length);
      } catch (e) {
        console.warn(
          "feed totals error:",
          e?.response?.status,
          e?.response?.data
        );
        setTotalFeedQty(0);
        setTotalFeedItems(0);
      }

      setLoading(false);
    };

    loadCounts();
  }, [axiosClient, isAdmin, isHR, isEmployee]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 400));

      if (isAdmin) {
        setStats((s) => ({
          ...s,
          ticketsOpen: 12,
          ticketsInProgress: 5,
          feedItems: 6,
          feedQty: 1280,
          eggToday: 4200,
          buyerOrders: 37,
        }));
        setRecent([
          {
            id: 1,
            text: "User added: chamara@company.com",
            t: "user",
            when: "2m",
          },
          {
            id: 2,
            text: "Feed restocked: Layer Feed 200kg",
            t: "feed",
            when: "45m",
          },
          {
            id: 3,
            text: "Ticket resolved: TKT-000345",
            t: "ticket",
            when: "1h",
          },
        ]);
      } else if (isHR) {
        setStats((s) => ({
          ...s,
          attendanceToday: 97,
          leavesPending: 4,
          ticketsOpen: 3,
        }));
        setRecent([
          {
            id: 1,
            text: "Marked attendance sync complete",
            t: "hr",
            when: "10m",
          },
          {
            id: 2,
            text: "Leave request pending: EMP-103",
            t: "hr",
            when: "1h",
          },
          { id: 3, text: "New user onboarded", t: "user", when: "3h" },
        ]);
      } else if (isEmployee) {
        setStats((s) => ({ ...s, eggToday: 4100, ticketsOpen: 0 }));
        setRecent([
          {
            id: 1,
            text: "Egg batch logged: 2,000 (Shed A)",
            t: "prod",
            when: "20m",
          },
          {
            id: 2,
            text: "Feed issued: 25kg to EMP-221",
            t: "feed",
            when: "1h",
          },
        ]);
      }

      setLoading(false);
    };
    load();
  }, [isAdmin, isHR, isEmployee]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
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
            <h1 className="text-lg font-semibold text-slate-800">Dashboard</h1>
            <div className="w-9" />
          </div>
        </div>

        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Role-aware header */}
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
                      <span className="text-2xl">{meta.icon}</span>
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight">
                        {meta.title}
                      </h1>
                      <p className="text-emerald-100 text-lg">
                        {meta.subtitle}
                      </p>
                    </div>
                  </div>
                  <p className="text-slate-300 max-w-2xl">
                    Use the quick modules below to jump into your daily
                    workflow.
                  </p>
                </div>

                <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-2">
                  <div className="text-sm">Signed in as</div>
                  <div className="text-lg font-semibold capitalize">
                    {user?.role}
                  </div>
                </div>
              </div>

              {/* Top shortcuts per role (NO buyer here) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-8">
                {isAdmin && (
                  <>
                    <HeaderShortcut to="/users" icon="👥" label="Users" />
                    <HeaderShortcut
                      to="/feed-management"
                      icon="🌾"
                      label="Feed Stock"
                    />
                    <HeaderShortcut to="/tickets" icon="🎟️" label="Inquiries" />
                    <HeaderShortcut
                      to="/egg-production"
                      icon="🥚"
                      label="Production"
                    />
                    <HeaderShortcut
                      to="/purchases"
                      icon="📦"
                      label="Buyer Orders"
                    />
                    <HeaderShortcut to="/reports" icon="📊" label="Analytics" />
                  </>
                )}

                {isHR && (
                  <>
                    <HeaderShortcut
                      to="/attendance"
                      icon="🕒"
                      label="Attendance"
                    />
                    <HeaderShortcut
                      to="/leave-requests"
                      icon="🏖️"
                      label="Leaves"
                    />
                    <HeaderShortcut to="/users" icon="👥" label="Users" />
                    <HeaderShortcut to="/tickets" icon="🎟️" label="Inquiries" />
                  </>
                )}

                {isEmployee && (
                  <>
                    <HeaderShortcut
                      to="/egg-production"
                      icon="🥚"
                      label="Record Production"
                    />
                    <HeaderShortcut
                      to="/feed-management"
                      icon="🌾"
                      label="Feed Issue"
                    />
                    <HeaderShortcut
                      to="/tickets"
                      icon="🎟️"
                      label="Raise Inquiry"
                    />
                  </>
                )}
              </div>
            </div>

            {/* KPI cards per role (NO buyer here) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <StatCard
                title="Role"
                value={user?.role}
                icon="👤"
                color="from-blue-100 to-blue-200"
                loading={loading}
              />

              {isAdmin && (
                <>
                  <StatCard
                    title="Users"
                    value={totalUsers}
                    icon="👥"
                    color="from-emerald-100 to-emerald-200"
                    loading={loading}
                  />
                  <StatCard
                    title="Tickets (All)"
                    value={totalTickets}
                    icon="🎟️"
                    color="from-yellow-100 to-yellow-200"
                    loading={loading}
                  />
                  <StatCard
                    title="Feed Items"
                    value={totalFeedItems}
                    icon="🌾"
                    color="from-purple-100 to-purple-200"
                    loading={loading}
                  />
                  <StatCard
                    title="Feed Qty"
                    value={`${totalFeedQty} kg`}
                    icon="📦"
                    color="from-lime-100 to-lime-200"
                    loading={loading}
                  />
                  <StatCard
                    title="Eggs Today"
                    value={stats.eggToday}
                    icon="🥚"
                    color="from-rose-100 to-rose-200"
                    loading={loading}
                  />
                  <StatCard
                    title="Buyer Orders"
                    value={stats.buyerOrders}
                    icon="🧾"
                    color="from-cyan-100 to-cyan-200"
                    loading={loading}
                  />
                </>
              )}

              {isHR && (
                <>
                  <StatCard
                    title="Users"
                    value={totalUsers}
                    icon="👥"
                    color="from-emerald-100 to-emerald-200"
                    loading={loading}
                  />
                  <StatCard
                    title="Attendance (Today)"
                    value={`${stats.attendanceToday}%`}
                    icon="🕒"
                    color="from-indigo-100 to-indigo-200"
                    loading={loading}
                  />
                  <StatCard
                    title="Pending Leaves"
                    value={stats.leavesPending}
                    icon="🏖️"
                    color="from-yellow-100 to-yellow-200"
                    loading={loading}
                  />
                  <StatCard
                    title="Open Tickets"
                    value={stats.ticketsOpen}
                    icon="🎟️"
                    color="from-rose-100 to-rose-200"
                    loading={loading}
                  />
                </>
              )}

              {isEmployee && (
                <>
                  <StatCard
                    title="Eggs Today"
                    value={stats.eggToday}
                    icon="🥚"
                    color="from-emerald-100 to-emerald-200"
                    loading={loading}
                  />
                  <StatCard
                    title="Open Inquiries"
                    value={stats.ticketsOpen}
                    icon="🎟️"
                    color="from-rose-100 to-rose-200"
                    loading={loading}
                  />
                </>
              )}
            </div>

            {/* Recent activity */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Recent Activity
                </h3>
                <Link
                  to={isAdmin ? "/reports" : "#"}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All
                </Link>
              </div>
              <div className="divide-y divide-gray-100">
                {recent.map((r) => (
                  <div
                    key={r.id}
                    className="py-3 flex items-center justify-between"
                  >
                    <div className="text-sm text-gray-800">{r.text}</div>
                    <div className="text-xs text-gray-500">{r.when}</div>
                  </div>
                ))}
                {recent.length === 0 && (
                  <div className="text-sm text-gray-400 py-6">
                    No recent updates
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

/* ------------- small UI helpers ------------- */
function HeaderShortcut({ to, icon, label }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all"
    >
      <div className="flex items-center">
        <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center mr-3">
          {icon}
        </div>
        <div className="font-medium">{label}</div>
      </div>
      <span>›</span>
    </Link>
  );
}

function StatCard({ title, value, icon, color, loading }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {loading ? (
                <div className="h-7 w-24 bg-gray-200 rounded animate-pulse" />
              ) : (
                value
              )}
            </p>
          </div>
          <div
            className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-lg`}
          >
            <span className="text-2xl">{icon}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
