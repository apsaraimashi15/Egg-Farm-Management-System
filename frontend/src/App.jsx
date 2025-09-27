import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import UserManagement from './components/UserManagement'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'
import LeaveRequests from './components/LeaveRequests'
import LeaveForm from './components/LeaveForm'
import Attendance from './components/Attendance'

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

            <Route path="/leave-requests" element={
              <ProtectedRoute roles={['hrmanager']}>
                <LeaveRequests/>
              </ProtectedRoute>
            } />

            <Route path="/leave-form" element={
              <ProtectedRoute roles={['employee']}>
                <LeaveForm />
              </ProtectedRoute>
            } />

            <Route path="/attendance" element={
              <ProtectedRoute roles={['hrmanager']}>
                <Attendance />
              </ProtectedRoute>
            } />

            


            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
