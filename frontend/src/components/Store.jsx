import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from './Sidebar'
import axios from 'axios'

const Store = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await axios.get('http://localhost:5000/api/egg-stock', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      // Transform egg stock data to products
      const eggProducts = response.data.stock.map(stock => ({
        id: stock._id,
        name: stock.eggType,
        category: 'eggs',
        price: stock.eggType.toLowerCase().includes('organic') ? 8.99 : 6.99, // Mock pricing
        unit: 'dozen',
        stock: stock.currentStock,
        image: '🥚',
        description: `${stock.eggType} eggs from our farm`,
        rating: 4.5, // Mock rating
        reviews: Math.floor(Math.random() * 50) + 10 // Mock reviews
      }))

      // Add fertilizer products (mock data for now)
      const fertilizerProducts = [
        {
          id: 'fert-1',
          name: 'Organic Fertilizer',
          category: 'fertilizer',
          price: 25.99,
          unit: 'bag',
          stock: 20,
          image: '🌱',
          description: 'Premium organic fertilizer for healthy plant growth'
        },
        {
          id: 'feed-1',
          name: 'Chicken Feed',
          category: 'feed',
          price: 18.99,
          unit: 'bag',
          stock: 15,
          image: '🌾',
          description: 'Nutritious feed for chickens and poultry'
        }
      ]

      setProducts([...eggProducts, ...fertilizerProducts])
    } catch (error) {
      console.error('Error fetching products:', error)
      // Could show a notification here instead
    } finally {
      setLoading(false)
    }
  }

  const [notification, setNotification] = useState('')

  const showNotification = (message) => {
    setNotification(message)
    setTimeout(() => setNotification(''), 3000)
  }

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id)
    const currentQuantity = existingItem ? existingItem.quantity : 0

    if (currentQuantity >= product.stock) {
      showNotification(`Only ${product.stock} ${product.name} available in stock!`)
      return
    }

    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
      showNotification(`${product.name} quantity increased!`)
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
      showNotification(`${product.name} added to cart!`)
    }
  }

  const updateQuantity = (id, newQuantity) => {
    const item = cart.find(item => item.id === id)
    if (!item) return

    if (newQuantity <= 0) {
      setCart(cart.filter(cartItem => cartItem.id !== id))
      showNotification(`${item.name} removed from cart`)
    } else if (newQuantity > item.stock) {
      showNotification(`Only ${item.stock} ${item.name} available in stock!`)
    } else {
      setCart(cart.map(cartItem =>
        cartItem.id === id
          ? { ...cartItem, quantity: newQuantity }
          : cartItem
      ))
    }
  }

  const removeFromCart = (id) => {
    const item = cart.find(item => item.id === id)
    if (item) {
      setCart(cart.filter(cartItem => cartItem.id !== id))
      showNotification(`${item.name} removed from cart`)
    }
  }

  const clearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      setCart([])
      showNotification('Cart cleared successfully')
    }
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return

    // Save cart to localStorage for checkout page
    localStorage.setItem('cart', JSON.stringify(cart))

    // Navigate to checkout page
    window.location.href = '/checkout'
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 lg:ml-64 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent mb-4"></div>
            <p className="text-slate-600 font-medium">Loading store...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center space-x-2 animate-fade-in">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">{notification}</span>
        </div>
      )}

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
            <h1 className="text-lg font-semibold text-slate-800">Store</h1>
            <div className="relative">
              <button className="relative p-2 text-slate-600 hover:text-slate-800">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5H19M7 13l-1.1 5M7 13l1.1-5m8.9 5L17 18" />
                </svg>
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        <main className="p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Farm Fresh Store</h1>
                <p className="text-slate-600">Discover our premium farm products</p>
              </div>

              {/* Cart Summary - Desktop */}
              <div className="hidden lg:flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5H19M7 13l-1.1 5M7 13l1.1-5m8.9 5L17 18" />
                  </svg>
                  <span className="text-slate-900 font-medium">{cartItemsCount} items</span>
                </div>
                <div className="text-2xl font-bold text-emerald-600">LKR {cartTotal.toFixed(2)}</div>
                <button
                  className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={cart.length === 0}
                  onClick={handleCheckout}
                >
                  Checkout
                </button>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="eggs">Eggs</option>
                    <option value="fertilizer">Fertilizer</option>
                    <option value="feed">Feed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-2xl shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  <div className="p-6">
                    <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-4 mx-auto shadow-lg">
                      <span className="text-4xl">{product.image}</span>
                    </div>

                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">{product.name}</h3>
                      <p className="text-slate-600 text-sm line-clamp-2">{product.description}</p>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="flex items-center mr-2">
                          <span className="text-yellow-400">⭐</span>
                          <span className="text-sm text-slate-600 ml-1">{product.rating}</span>
                        </div>
                        <span className="text-sm text-slate-500">({product.reviews})</span>
                      </div>
                      <span className="text-sm text-slate-500">Stock: {product.stock}</span>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-emerald-600">LKR {product.price}</span>
                      <span className="text-sm text-slate-500">per {product.unit}</span>
                    </div>

                    <button
                      onClick={() => addToCart(product)}
                      className="w-full px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      disabled={product.stock === 0}
                    >
                      {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No products found</h3>
                <p className="text-slate-500 mb-6">Try adjusting your search or filter criteria.</p>
                <button
                  onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
                  className="inline-flex items-center px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Cart Summary - Mobile */}
            {cart.length > 0 && (
              <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-slate-900 font-medium">{cartItemsCount} items</p>
                    <p className="text-2xl font-bold text-emerald-600">LKR {cartTotal.toFixed(2)}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={clearCart}
                      className="group relative inline-flex items-center px-5 py-2.5 text-sm font-semibold text-slate-700 hover:text-white bg-gradient-to-r from-slate-50 to-slate-100 hover:from-red-500 hover:to-red-600 border border-slate-200 hover:border-red-400 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25 hover:scale-105 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-red-400/0 to-red-500/0 group-hover:from-red-400/10 group-hover:to-red-500/10 transition-all duration-300"></div>
                      <svg className="w-4 h-4 mr-2.5 relative z-10 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span className="relative z-10 group-hover:tracking-wide transition-all duration-300">Clear Cart</span>
                      <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                    <button
                      className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleCheckout}
                    >
                      Checkout
                    </button>
                  </div>
                </div>

                {/* Mobile Cart Items Preview */}
                <div className="max-h-32 overflow-y-auto">
                  <div className="space-y-2">
                    {cart.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <span className="mr-2">{item.image}</span>
                          <span className="text-slate-900 truncate max-w-32">{item.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-6 h-6 bg-slate-200 rounded flex items-center justify-center text-xs"
                              disabled={item.quantity <= 1}
                            >
                              -
                            </button>
                            <span className="w-6 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-6 h-6 bg-slate-200 rounded flex items-center justify-center text-xs"
                              disabled={item.quantity >= item.stock}
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-600 text-xs hover:text-red-700"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                    {cart.length > 3 && (
                      <p className="text-xs text-slate-500 text-center">...and {cart.length - 3} more items</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Cart Sidebar - Desktop */}
      {cart.length > 0 && (
        <div className="hidden lg:block fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-slate-200 z-40">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Shopping Cart</h2>
              <button
                onClick={clearCart}
                className="group relative inline-flex items-center px-5 py-2.5 text-sm font-semibold text-slate-700 hover:text-white bg-gradient-to-r from-slate-50 to-slate-100 hover:from-red-500 hover:to-red-600 border border-slate-200 hover:border-red-400 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25 hover:scale-105 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-400/0 to-red-500/0 group-hover:from-red-400/10 group-hover:to-red-500/10 transition-all duration-300"></div>
                <svg className="w-4 h-4 mr-2.5 relative z-10 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="relative z-10 group-hover:tracking-wide transition-all duration-300">Clear Cart</span>
                <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>

            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl relative group">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                    <span className="text-xl">{item.image}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900">{item.name}</h3>
                    <p className="text-sm text-slate-600">LKR {item.price} each</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center hover:bg-slate-300 transition-colors"
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center hover:bg-slate-300 transition-colors"
                      disabled={item.quantity >= item.stock}
                    >
                      +
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">LKR {(item.price * item.quantity).toFixed(2)}</p>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-xs text-red-600 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-slate-900">Total:</span>
                <span className="text-2xl font-bold text-emerald-600">LKR {cartTotal.toFixed(2)}</span>
              </div>
              <button
                className="w-full px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleCheckout}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Store