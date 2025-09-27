import React, { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth()
  const location = useLocation()

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '🏠' },

    ...(user?.role === 'buyer' ? [
      { name: 'Store', href: '/store', icon: '🛒' }
    ] : []),

    ...(user?.role === 'admin' || user?.role === 'hrmanager' ? [
      { name: 'User Management', href: '/users', icon: '👥' }
    ] : []),

    ...(user?.role === 'admin' ? [
      { name: 'Purchase Management', href: '/purchases', icon: '🛒' }
    ] : []),

    ...(user?.role === "admin" || user?.role === "employee" ? [
      { name: "Egg Production", href: "/egg-production", icon: "🥚" }
    ] : []),
    
    ...(user?.role === "admin" || user?.role === "employee" || user?.role === "buyer" ? [
    { name: "Egg Stock", href: "/egg-stock", icon: "📦" },
    ] : []),

    ...(user?.role === "admin" || user?.role === "employee" ? [
      { name: "Fertilizers", href: "/fertilizers", icon: "🌱" }  
    ] : []),
    ...(user?.role === "admin" || user?.role === "employee" ? [
      { name: "Reports", href: "/reports", icon: "📑" }  
    ] : []),






  ]

  const handleLogout = () => {
    logout()
    onClose?.()
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 h-screen
        bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
        shadow-2xl transform transition-all duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
        border-r border-slate-700/50
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-center h-20 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <img
                  src="/logo.png"
                  alt="Egg Farm Logo"
                  className="w-6 h-6 object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextElementSibling.style.display = 'block'
                  }}
                />
                <span className="text-2xl hidden">🥚</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-wide">Egg Farm</h1>
                <p className="text-xs text-emerald-100 opacity-80">Management System</p>
              </div>
            </div>
          </div>

          {/* Scrollable Navigation */}
          <nav className="flex-1 px-4 py-8 overflow-y-auto">
            <div className="mb-6 flex-shrink-0">
              <h2 className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Navigation
              </h2>
            </div>

            <div className="space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                      ${
                        isActive
                          ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25"
                          : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                      }
                    `}
                    onClick={onClose}
                  >
                    <span className="mr-4 text-lg">{item.icon}</span>
                    <span className="flex-1">{item.name}</span>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    )}
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* User Profile Section */}
          <div className="flex-shrink-0 p-6 border-t border-slate-700/50 bg-slate-800/50">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 capitalize flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                  {user?.role}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="
                w-full flex items-center px-4 py-3 text-sm font-medium text-slate-300
                rounded-xl hover:bg-red-500/20 hover:text-red-300 transition-all duration-200
                group border border-transparent hover:border-red-500/30
              "
            >
              <span className="mr-4 text-lg group-hover:animate-bounce">🚪</span>
              <span>Logout</span>
            </button>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-4 border-t border-slate-700/30 bg-slate-900/50">
            <div className="text-center">
              <p className="text-xs text-slate-500">
                © 2025 Egg Farm System
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Version 1.0.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
