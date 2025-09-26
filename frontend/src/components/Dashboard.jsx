import React, { useState, useEffect } from "react";
import { Link, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    todayProduction: 0,
    ordersPlaced: 0,
    tasksCompleted: 0,
    totalRevenue: 0,
    systemStatus: "Active",
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API calls
    const fetchDashboardData = async () => {
      setLoading(true);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data based on user role
      const mockData = {
        admin: {
          totalUsers: 1542,
          systemStatus: "Optimal",
          recentActivity: [
            {
              id: 1,
              action: "New user registered",
              time: "2 min ago",
              type: "user",
            },
            {
              id: 2,
              action: "System backup completed",
              time: "1 hour ago",
              type: "system",
            },
            {
              id: 3,
              action: "Settings updated",
              time: "3 hours ago",
              type: "settings",
            },
          ],
        },
        employee: {
          todayProduction: 1250,
          tasksCompleted: 8,
          weeklyTarget: 75,
          recentActivity: [
            {
              id: 1,
              action: "Production batch completed",
              time: "30 min ago",
              type: "production",
            },
            {
              id: 2,
              action: "Quality check passed",
              time: "2 hours ago",
              type: "quality",
            },
            {
              id: 3,
              action: "New task assigned",
              time: "4 hours ago",
              type: "task",
            },
          ],
        },
        buyer: {
          ordersPlaced: 24,
          totalRevenue: 12500,
          pendingOrders: 3,
          recentActivity: [
            {
              id: 1,
              action: "Order #1234 shipped",
              time: "1 hour ago",
              type: "order",
            },
            {
              id: 2,
              action: "Payment received",
              time: "3 hours ago",
              type: "payment",
            },
            {
              id: 3,
              action: "New product available",
              time: "5 hours ago",
              type: "product",
            },
          ],
        },
      };

      const userData = mockData[user?.role] || {};
      setStats((prev) => ({ ...prev, ...userData }));
      setRecentActivity(userData.recentActivity || []);
      setLoading(false);
    };

    fetchDashboardData();
  }, [user?.role]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const StatCard = ({ title, value, change, icon, color, subtitle }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {loading ? (
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                value
              )}
            </p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            {change && (
              <span
                className={`text-xs font-medium ${
                  change > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {change > 0 ? "↑" : "↓"} {Math.abs(change)}% from last week
              </span>
            )}
          </div>
          <div className={`p-3 rounded-xl ${color} shadow-lg`}>
            <span className="text-2xl">{icon}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const ActivityItem = ({ activity }) => (
    <div className="flex items-center space-x-3 py-3 hover:bg-gray-50 rounded-lg px-2 transition-colors duration-200">
      <div
        className={`w-2 h-2 rounded-full ${
          activity.type === "user"
            ? "bg-blue-500"
            : activity.type === "system"
            ? "bg-green-500"
            : activity.type === "order"
            ? "bg-purple-500"
            : "bg-gray-500"
        }`}
      ></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {activity.action}
        </p>
        <p className="text-xs text-gray-500">{activity.time}</p>
      </div>
    </div>
  );

  const QuickAction = ({ icon, label, onClick, color }) => (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 hover:shadow-md transition-all duration-200 ${color} hover:scale-105`}
    >
      <span className="text-2xl mb-2">{icon}</span>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <svg
                  className="w-6 h-6"
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
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-sm text-gray-600">
                  Welcome back, {user?.name}!
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-blue-700">
                  System Online
                </span>
              </div>

              <div className="flex items-center space-x-3 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.role}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl p-8 text-white shadow-xl">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">
                    Good morning, {user?.name}! 👋
                  </h2>
                  <p className="text-blue-100 text-lg">
                    {user?.role === "admin" &&
                      "Monitor your system and manage users efficiently."}
                    {user?.role === "employee" &&
                      "Track your production and complete today's tasks."}
                    {user?.role === "buyer" &&
                      "Manage your orders and explore new products."}
                  </p>
                </div>
                <div className="mt-4 lg:mt-0">
                  <div className="flex space-x-3">
                    <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105">
                      Quick Start
                    </button>
                    <button className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105">
                      View Reports
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Role Card */}
              <StatCard
                title="Your Role"
                value={user?.role}
                icon="👤"
                color="bg-gradient-to-br from-blue-100 to-blue-200"
                subtitle="Account type"
              />

              {/* Role-specific Stats */}
              {user?.role === "admin" && (
                <>
                  <StatCard
                    title="Total Users"
                    value={stats.totalUsers.toLocaleString()}
                    change={2.5}
                    icon="👥"
                    color="bg-gradient-to-br from-green-100 to-green-200"
                    subtitle="Active accounts"
                  />
                  <StatCard
                    title="System Status"
                    value={stats.systemStatus}
                    icon="⚙️"
                    color="bg-gradient-to-br from-yellow-100 to-yellow-200"
                    subtitle="All systems operational"
                  />
                  <StatCard
                    title="Server Load"
                    value="24%"
                    change={-5}
                    icon="📊"
                    color="bg-gradient-to-br from-purple-100 to-purple-200"
                    subtitle="Optimal performance"
                  />
                </>
              )}

              {user?.role === "employee" && (
                <>
                  <StatCard
                    title="Today's Production"
                    value={stats.todayProduction.toLocaleString()}
                    change={8.3}
                    icon="🥚"
                    color="bg-gradient-to-br from-green-100 to-green-200"
                    subtitle="75% of daily target"
                  />
                  <StatCard
                    title="Tasks Completed"
                    value={stats.tasksCompleted}
                    change={12}
                    icon="✅"
                    color="bg-gradient-to-br from-blue-100 to-blue-200"
                    subtitle="8/10 tasks done"
                  />
                  <StatCard
                    title="Quality Score"
                    value="98.5%"
                    change={0.5}
                    icon="⭐"
                    color="bg-gradient-to-br from-yellow-100 to-yellow-200"
                    subtitle="Excellent work"
                  />
                </>
              )}

              {user?.role === "buyer" && (
                <>
                  <StatCard
                    title="Orders Placed"
                    value={stats.ordersPlaced}
                    change={15}
                    icon="🛒"
                    color="bg-gradient-to-br from-green-100 to-green-200"
                    subtitle="3 pending orders"
                  />
                  <StatCard
                    title="Total Spent"
                    value={`$${stats.totalRevenue.toLocaleString()}`}
                    change={-2}
                    icon="💰"
                    color="bg-gradient-to-br from-blue-100 to-blue-200"
                    subtitle="This month"
                  />
                  <StatCard
                    title="Savings"
                    value="$1,240"
                    change={8}
                    icon="🎯"
                    color="bg-gradient-to-br from-purple-100 to-purple-200"
                    subtitle="Loyalty discounts"
                  />
                </>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Activity */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Recent Activity
                    </h3>
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      View All
                    </button>
                  </div>
                  <div className="space-y-1">
                    {recentActivity.map((activity) => (
                      <ActivityItem key={activity.id} activity={activity} />
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {user?.role === "admin" && (
                      <>
                        <QuickAction
                          icon="👥"
                          label="Manage Users"
                          color="hover:bg-blue-50"
                        />
                        <QuickAction
                          icon="📊"
                          label="Analytics"
                          color="hover:bg-green-50"
                        />
                        <QuickAction
                          icon="⚙️"
                          label="Settings"
                          color="hover:bg-yellow-50"
                        />
                        <QuickAction
                          icon="🔒"
                          label="Security"
                          color="hover:bg-red-50"
                        />
                      </>
                    )}
                    {user?.role === "employee" && (
                      <>
                        <QuickAction
                          icon="📝"
                          label="New Task"
                          color="hover:bg-blue-50"
                        />
                        <QuickAction
                          icon="📈"
                          label="Production"
                          color="hover:bg-green-50"
                        />
                        <QuickAction
                          icon="✅"
                          label="Reports"
                          color="hover:bg-yellow-50"
                        />
                        <QuickAction
                          icon="🕒"
                          label="Time Track"
                          color="hover:bg-purple-50"
                        />
                      </>
                    )}
                    {user?.role === "buyer" && (
                      <>
                        <QuickAction
                          icon="🛒"
                          label="New Order"
                          color="hover:bg-blue-50"
                        />
                        <QuickAction
                          icon="📦"
                          label="Track Order"
                          color="hover:bg-green-50"
                        />
                        <QuickAction
                          icon="💳"
                          label="Payment"
                          color="hover:bg-yellow-50"
                        />
                        <QuickAction
                          icon="👤"
                          label="Profile"
                          color="hover:bg-purple-50"
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="space-y-6">
                {/* Profile Summary */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Profile Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Member since
                      </span>
                      <span className="text-sm font-medium">Jan 2024</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <span className="text-sm font-medium text-green-600">
                        Active
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Last login</span>
                      <span className="text-sm font-medium">2 hours ago</span>
                    </div>
                  </div>
                </div>

                {/* Notifications */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Notifications
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">
                        System update available
                      </p>
                      <p className="text-xs text-blue-600">
                        Update to version 2.1
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-green-900">
                        New features available
                      </p>
                      <p className="text-xs text-green-600">
                        Check out what's new
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
