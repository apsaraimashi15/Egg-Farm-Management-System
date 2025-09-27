import React, { useState, useEffect } from 'react'
import { Link, useNavigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from './Sidebar'
import axios from 'axios'

const Dashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [employeeData, setEmployeeData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user?.role === 'employee') {
      fetchEmployeeData()
    }
  }, [user])

  const fetchEmployeeData = async () => {
    try {
      setLoading(true)
      const response = await axios.get('http://localhost:5000/api/employee/products', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      setEmployeeData(response.data)
    } catch (error) {
      console.error('Error fetching employee data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        {/* Mobile menu button */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between bg-white px-4 py-2 shadow-sm border-b">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
            <div className="w-6"></div> {/* Spacer for centering */}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}!</h1>
              <p className="text-lg text-gray-600">
                Here's what's happening with your account today.
              </p>
            </div>

            {/* Dashboard content based on role */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {/* Role Card - Always shown */}
              <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white text-lg font-medium">👤</span>
                      </div>
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate mb-1">Role</dt>
                        <dd className="text-xl font-bold text-gray-900 capitalize">{user?.role}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Cards */}
              {user?.role === 'admin' && (
                <>
                  <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white text-lg font-medium">👥</span>
                          </div>
                        </div>
                        <div className="ml-4 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate mb-1">Total Users</dt>
                            <dd className="text-xl font-bold text-gray-900">--</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white text-lg font-medium">⚙️</span>
                          </div>
                        </div>
                        <div className="ml-4 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate mb-1">System Status</dt>
                            <dd className="text-xl font-bold text-gray-900">Active</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Employee Cards */}
              {user?.role === 'employee' && (
                <>
                  <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white text-lg font-medium">🥚</span>
                          </div>
                        </div>
                        <div className="ml-4 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate mb-1">Today's Production</dt>
                            <dd className="text-xl font-bold text-gray-900">
                              {loading ? '...' : (employeeData?.summary?.todaysProduction || 0)} eggs
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white text-lg font-medium">📊</span>
                          </div>
                        </div>
                        <div className="ml-4 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate mb-1">Total Records Added</dt>
                            <dd className="text-xl font-bold text-gray-900">
                              {loading ? '...' : ((employeeData?.summary?.totalProductions || 0) + (employeeData?.summary?.totalStocks || 0) + (employeeData?.summary?.totalFertilizers || 0))}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white text-lg font-medium">🌱</span>
                          </div>
                        </div>
                        <div className="ml-4 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate mb-1">Fertilizer Records</dt>
                            <dd className="text-xl font-bold text-gray-900">
                              {loading ? '...' : (employeeData?.summary?.totalFertilizers || 0)}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Buyer Cards */}
              {user?.role === 'buyer' && (
                <>
                  <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white text-lg font-medium">🛒</span>
                          </div>
                        </div>
                        <div className="ml-4 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate mb-1">Orders Placed</dt>
                            <dd className="text-xl font-bold text-gray-900">--</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white text-lg font-medium">💰</span>
                          </div>
                        </div>
                        <div className="ml-4 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate mb-1">Total Spent</dt>
                            <dd className="text-xl font-bold text-gray-900">$--</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Employee Recent Products Section */}
            {user?.role === 'employee' && employeeData && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Recent Activity</h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Recent Productions */}
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="text-2xl mr-2">🥚</span>
                      Recent Productions
                    </h3>
                    <div className="space-y-3">
                      {employeeData.recentProductions?.length > 0 ? (
                        employeeData.recentProductions.slice(0, 5).map((prod, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{prod.type || 'Mixed'}</p>
                              <p className="text-xs text-gray-500">{new Date(prod.date).toLocaleDateString()}</p>
                            </div>
                            <span className="text-sm font-bold text-emerald-600">{prod.quantity} eggs</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No productions yet</p>
                      )}
                    </div>
                  </div>

                  {/* Recent Stock Updates */}
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="text-2xl mr-2">📦</span>
                      Recent Stock Updates
                    </h3>
                    <div className="space-y-3">
                      {employeeData.recentStocks?.length > 0 ? (
                        employeeData.recentStocks.slice(0, 5).map((stock, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{stock.eggType}</p>
                              <p className="text-xs text-gray-500">{new Date(stock.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className="text-sm font-bold text-blue-600">{stock.currentStock} units</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No stock updates yet</p>
                      )}
                    </div>
                  </div>

                  {/* Recent Fertilizer Records */}
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="text-2xl mr-2">🌱</span>
                      Recent Fertilizer
                    </h3>
                    <div className="space-y-3">
                      {employeeData.recentFertilizers?.length > 0 ? (
                        employeeData.recentFertilizers.slice(0, 5).map((fert, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{fert.month}</p>
                              <p className="text-xs text-gray-500">{new Date(fert.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className="text-sm font-bold text-purple-600">{fert.quantityCollected} kg</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No fertilizer records yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Dashboard