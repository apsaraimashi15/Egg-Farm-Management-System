import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
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
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
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
                <ProtectedRoute roles={["admin", "employee"]}>
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

          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
