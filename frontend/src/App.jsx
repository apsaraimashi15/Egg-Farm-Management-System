import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import UserManagement from "./components/UserManagement";
import ProtectedRoute from "./components/ProtectedRoute";
import FeedManagement from "./components/FeedManagement";

// ⬇️ add these pages (create them if you haven't yet)
import TicketManagement from "./components/TicketManagement"; // or './pages/TicketManagement'

import "./App.css";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Private */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Admin / HR only */}
            <Route
              path="/users"
              element={
                <ProtectedRoute roles={["admin", "hrmanager"]}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tickets"
              element={
                <ProtectedRoute roles={["admin", "hrmanager"]}>
                  <TicketManagement />
                </ProtectedRoute>
              }
            />

            {/* Buyer only */}
            <Route
              path="/inquiry"
              element={
                <ProtectedRoute roles={["buyer"]}>
                  <TicketManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/feed-management"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <FeedManagement />
                </ProtectedRoute>
              }
            />

            {/* Default + 404 */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<div className="p-6">Not Found</div>} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
