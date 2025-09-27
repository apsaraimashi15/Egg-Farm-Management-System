import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from './Sidebar'
import axios from 'axios'

const BuyerDashboard = () => {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalSpent: 0,
    favoriteProduct: 'N/A'
  })
  const [recentPurchases, setRecentPurchases] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBuyerData()
  }, [])

  const fetchBuyerData = async () => {
    try {
      setLoading(true)
      // Fetch buyer's purchases
      const response = await axios.get('http://localhost:5000/api/purchases/my-purchases', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.data.success) {
        const purchases = response.data.data
        setRecentPurchases(purchases.slice(0, 3)) // Show only recent 3 purchases

        // Calculate stats
        const totalSpent = purchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0)
        const totalPurchases = purchases.length

        // Find favorite product (most purchased)
        const productCount = {}
        purchases.forEach(purchase => {
          purchase.items.forEach(item => {
            productCount[item.productName] = (productCount[item.productName] || 0) + item.quantity
          })
        })

        const favoriteProduct = Object.keys(productCount).length > 0
          ? Object.keys(productCount).reduce((a, b) => productCount[a] > productCount[b] ? a : b)
          : 'N/A'

        setStats({
          totalPurchases,
          totalSpent: totalSpent.toFixed(2),
          favoriteProduct
        })
      }
    } catch (error) {
      console.error('Error fetching buyer data:', error)
      // Keep default stats if API fails
    } finally {
      setLoading(false)
    }
  }

  const featuredProducts = [
    {
      id: 1,
      name: 'Fresh Brown Eggs',
      price: 6.99,
      image: '🥚',
      description: 'Farm fresh brown eggs, perfect for breakfast'
    },
    {
      id: 2,
      name: 'Organic White Eggs',
      price: 8.99,
      image: '🥚',
      description: 'Organic white eggs from free-range hens'
    },
    {
      id: 3,
      name: 'Fertilizer Pack',
      price: 25.99,
      image: '🌱',
      description: 'Premium organic fertilizer for your garden'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:ml-64">
        {/* Mobile menu button */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm px-4 py-3 shadow-sm border-b border-white/20">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-600 hover:text-slate-800 p-2 rounded-lg hover:bg-white/50 transition-colors"
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-slate-800">Buyer Dashboard</h1>
            <div className="w-9"></div>
          </div>
        </div>

        <main className="p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-600 rounded-3xl p-8 mb-8 text-white shadow-2xl">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 -translate-y-12"></div>
                <div className="absolute bottom-0 left-1/4 w-20 h-20 bg-white rounded-full translate-y-10"></div>
                <div className="absolute bottom-0 right-1/3 w-16 h-16 bg-white rounded-full translate-y-8"></div>
              </div>

              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.name}!</h1>
                    <p className="text-emerald-100 text-xl mb-4">
                      Discover fresh farm products and make your purchase today
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <Link
                        to="/store"
                        className="inline-flex items-center px-6 py-3 bg-white text-emerald-600 font-semibold rounded-xl hover:bg-emerald-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        <span className="mr-2">🛒</span>
                        Shop Now
                      </Link>
                      <button 
                        onClick={() => {
                          const ordersSection = document.getElementById('recent-orders');
                          ordersSection?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="inline-flex items-center px-6 py-3 bg-emerald-500/20 text-white font-semibold rounded-xl hover:bg-emerald-400/30 transition-all duration-200 backdrop-blur-sm border border-white/20"
                      >
                        <span className="mr-2">📋</span>
                        View Orders
                      </button>
                    </div>
                  </div>

                  <div className="lg:w-80">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                      <h3 className="text-lg font-semibold mb-4 text-white">Quick Stats</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-emerald-100">Total Purchases</span>
                          <span className="font-bold text-white">{loading ? '...' : stats.totalPurchases}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-emerald-100">Total Spent</span>
                          <span className="font-bold text-white">LKR {loading ? '...' : stats.totalSpent}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-emerald-100">Favorite Product</span>
                          <span className="font-bold text-white">{loading ? '...' : stats.favoriteProduct}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white text-xl">🛒</span>
                    </div>
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-slate-500 truncate mb-1">Orders This Month</dt>
                      <dd className="text-2xl font-bold text-slate-900">{loading ? '...' : stats.totalPurchases}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white text-xl">💰</span>
                    </div>
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-slate-500 truncate mb-1">Total Spent</dt>
                      <dd className="text-2xl font-bold text-slate-900">LKR {loading ? '...' : stats.totalSpent}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white text-xl">⭐</span>
                    </div>
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-slate-500 truncate mb-1">Loyalty Points</dt>
                      <dd className="text-2xl font-bold text-slate-900">{loading ? '...' : Math.floor(parseFloat(stats.totalSpent) * 10)}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Featured Products */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Featured Products</h2>
                <Link
                  to="/store"
                  className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center"
                >
                  View All
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProducts.map((product) => (
                  <div key={product.id} className="group bg-slate-50 rounded-xl p-6 hover:bg-slate-100 transition-all duration-300 hover:shadow-lg border border-slate-200 hover:border-slate-300">
                    <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-4 mx-auto shadow-lg">
                      <span className="text-3xl">{product.image}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2 text-center">{product.name}</h3>
                    <p className="text-slate-600 text-sm mb-4 text-center">{product.description}</p>
                    <div className="text-center">
                      <span className="text-2xl font-bold text-emerald-600">LKR {product.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Orders */}
            <div id="recent-orders" className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Recent Orders</h2>
                <Link
                  to="/store"
                  className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center"
                >
                  Shop More
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-slate-200 rounded-lg mr-4"></div>
                          <div>
                            <div className="h-4 bg-slate-200 rounded w-32 mb-2"></div>
                            <div className="h-3 bg-slate-200 rounded w-24"></div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="h-4 bg-slate-200 rounded w-16 mb-2"></div>
                          <div className="h-6 bg-slate-200 rounded w-20"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentPurchases.length > 0 ? (
                <div className="space-y-4">
                  {recentPurchases.map((purchase) => (
                    <div key={purchase._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-4">
                          <span className="text-emerald-600">
                            {purchase.items[0]?.productType === 'eggs' ? '🥚' : purchase.items[0]?.productType === 'fertilizer' ? '🌱' : '🌾'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {purchase.items.length === 1
                              ? `${purchase.items[0].quantity}x ${purchase.items[0].productName}`
                              : `${purchase.items.length} items`
                            }
                          </p>
                          <p className="text-sm text-slate-500">
                            Ordered on {new Date(purchase.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">LKR {purchase.totalAmount?.toFixed(2) || '0.00'}</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          purchase.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          purchase.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                          purchase.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No orders yet</h3>
                  <p className="text-slate-500 mb-4">Start shopping to see your order history here.</p>
                  <Link
                    to="/store"
                    className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Browse Products
                  </Link>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default BuyerDashboard