import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Login from './components/Login'
import Register from './components/Register'
import RoleBasedDashboard from './components/RoleBasedDashboard'
import Store from './components/Store'
import Checkout from './components/Checkout'
import PurchaseManagement from './components/PurchaseManagement'
import UserManagement from './components/UserManagement'
import ProtectedRoute from './components/ProtectedRoute'
import EggProductionManagement from './components/EggProductionManagement'
import EggStockManagement from './components/EggStockManagement'
import FertilizerManagement from './components/FertilizerManagement'
import ReportManagement from './components/ReportManagement'
import './App.css'

const App = () => {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <RoleBasedDashboard />
              </ProtectedRoute>
            } />
            <Route path="/store" element={
              <ProtectedRoute roles={['buyer']}>
                <Store />
              </ProtectedRoute>
            } />
            <Route path="/checkout" element={
              <ProtectedRoute roles={['buyer']}>
                <Checkout />
              </ProtectedRoute>
            } />
            <Route path="/purchases" element={
              <ProtectedRoute roles={['admin']}>
                <PurchaseManagement />
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute roles={['admin', 'hrmanager']}>
                <UserManagement />
              </ProtectedRoute>
            } />
            <Route
              path="/egg-production"
              element={
                <ProtectedRoute roles={["admin", "employee"]}>
                  <EggProductionManagement />
                </ProtectedRoute>
              } />
            <Route
              path="/egg-stock"
              element={
                <ProtectedRoute roles={["admin", "employee", "buyer"]}>
                  <EggStockManagement />
                </ProtectedRoute>
              } />
            <Route
              path="/fertilizers"
              element={
                <ProtectedRoute roles={["admin", "employee"]}>
                  <FertilizerManagement />
            </ProtectedRoute>
              } />
            <Route
              path="/reports"
              element={
                <ProtectedRoute roles={["admin", "employee"]}>
                  <ReportManagement />
                </ProtectedRoute>
              } />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />

          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
