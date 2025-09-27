import React, { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import axios from 'axios'

const PurchaseManagement = () => {
  // const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0
  })

  // Filters
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('all')

  // Modal states
  const [selectedPurchase, setSelectedPurchase] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    fetchPurchases()
    fetchStats()
  }, [])

  const fetchPurchases = async () => {
    try {
      setLoading(true)
      const response = await axios.get('http://localhost:5000/api/purchases', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.data.success) {
        setPurchases(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching purchases:', error)
      setError('Failed to load purchases')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/purchases/stats', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.data.success) {
        setStats(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const updatePurchaseStatus = async (purchaseId, newStatus) => {
    try {
      setUpdatingStatus(true)
      const response = await axios.put(`http://localhost:5000/api/purchases/${purchaseId}/status`, {
        status: newStatus
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.data.success) {
        // Update the purchase in the local state
        setPurchases(purchases.map(purchase =>
          purchase._id === purchaseId
            ? { ...purchase, status: newStatus }
            : purchase
        ))

        // Refresh stats
        fetchStats()

        // Close modal if open
        setShowDetailsModal(false)
        setSelectedPurchase(null)
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update order status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳'
      case 'confirmed': return '✅'
      case 'shipped': return '🚚'
      case 'delivered': return '📦'
      case 'cancelled': return '❌'
      default: return '📋'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Filter purchases based on current filters
  const filteredPurchases = purchases.filter(purchase => {
    const matchesStatus = statusFilter === 'all' || purchase.status === statusFilter
    const matchesSearch = searchTerm === '' ||
      purchase.buyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase._id.toLowerCase().includes(searchTerm.toLowerCase())

    let matchesDate = true
    if (dateFilter !== 'all') {
      const purchaseDate = new Date(purchase.createdAt)
      const now = new Date()
      const daysDiff = Math.floor((now - purchaseDate) / (1000 * 60 * 60 * 24))

      switch (dateFilter) {
        case 'today':
          matchesDate = daysDiff === 0
          break
        case 'week':
          matchesDate = daysDiff <= 7
          break
        case 'month':
          matchesDate = daysDiff <= 30
          break
        default:
          matchesDate = true
      }
    }

    return matchesStatus && matchesSearch && matchesDate
  })

  const openDetailsModal = (purchase) => {
    setSelectedPurchase(purchase)
    setShowDetailsModal(true)
  }

  const generateReport = async () => {
    try {
      const { jsPDF } = await import('jspdf')

      // Create PDF document
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 20
      let yPosition = margin

      // Add logo and header section
      try {
        const logoResponse = await fetch('/logo.png')
        if (logoResponse.ok) {
          const logoBlob = await logoResponse.blob()
          const logoReader = new FileReader()
          logoReader.onload = function() {
            const logoData = logoReader.result
            // Header background
            pdf.setFillColor(40, 87, 74)
            pdf.rect(0, 0, pageWidth, 35, 'F')

            // Logo
            pdf.addImage(logoData, 'PNG', margin, 7.5, 20, 20)

            // Company name
            pdf.setTextColor(255, 255, 255)
            pdf.setFontSize(16)
            pdf.setFont('helvetica', 'bold')
            pdf.text('EGG FARM MANAGEMENT', 50, 17)

            pdf.setFontSize(10)
            pdf.setFont('helvetica', 'normal')
            pdf.text('Purchase Management System', 50, 25)

            yPosition = 50
            addContent()
          }
          logoReader.readAsDataURL(logoBlob)
        } else {
          // Header without logo
          pdf.setFillColor(40, 87, 74)
          pdf.rect(0, 0, pageWidth, 35, 'F')

          pdf.setTextColor(255, 255, 255)
          pdf.setFontSize(18)
          pdf.setFont('helvetica', 'bold')
          pdf.text('EGG FARM MANAGEMENT', pageWidth / 2, 17, { align: 'center' })

          pdf.setFontSize(12)
          pdf.setFont('helvetica', 'normal')
          pdf.text('Purchase Report', pageWidth / 2, 27, { align: 'center' })

          yPosition = 50
          addContent()
        }
      } catch {
        // Simple header
        pdf.setFillColor(40, 87, 74)
        pdf.rect(0, 0, pageWidth, 35, 'F')

        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(18)
        pdf.setFont('helvetica', 'bold')
        pdf.text('EGG FARM MANAGEMENT', pageWidth / 2, 17, { align: 'center' })

        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'normal')
        pdf.text('Purchase Report', pageWidth / 2, 27, { align: 'center' })

        yPosition = 50
        addContent()
      }

      function addContent() {
        // Report metadata
        pdf.setTextColor(100, 116, 139)
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')

        const currentDate = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })

        pdf.text(`Generated: ${currentDate}`, margin, yPosition)
        yPosition += 8

        // Applied filters
        let filterText = 'Filters: All purchases'
        if (statusFilter !== 'all' || searchTerm || dateFilter !== 'all') {
          filterText = 'Filters: '
          const filters = []
          if (statusFilter !== 'all') filters.push(`Status: ${statusFilter}`)
          if (searchTerm) filters.push(`Search: "${searchTerm}"`)
          if (dateFilter !== 'all') filters.push(`Date: ${dateFilter}`)
          filterText += filters.join(', ')
        }
        pdf.text(filterText, margin, yPosition)
        yPosition += 15

        // Summary Statistics
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(12)
        pdf.setTextColor(15, 23, 42)
        pdf.text('SUMMARY STATISTICS', margin, yPosition)
        yPosition += 10

        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(10)
        pdf.setTextColor(71, 85, 105)

        const statsData = [
          `Total Orders: ${stats.totalPurchases}`,
          `Total Revenue: LKR ${stats.totalRevenue?.toFixed(2) || '0.00'}`,
          `Pending Orders: ${stats.pendingOrders}`,
          `Completed Orders: ${stats.completedOrders}`,
          `Filtered Results: ${filteredPurchases.length} orders`
        ]

        statsData.forEach((stat, index) => {
          pdf.text(stat, margin, yPosition + (index * 6))
        })

        yPosition += 40

        // Purchase Data Table
        if (filteredPurchases.length > 0) {
          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(12)
          pdf.setTextColor(15, 23, 42)
          pdf.text('PURCHASE DETAILS', margin, yPosition)
          yPosition += 10

          // Table styling
          const rowHeight = 12
          const colWidths = [15, 35, 25, 25, 20, 30] // Adjusted column widths
          const tableWidth = colWidths.reduce((a, b) => a + b, 0)

          // Table header background
          pdf.setFillColor(40, 87, 74)
          pdf.rect(margin, yPosition - 3, tableWidth, rowHeight, 'F')

          // Table header text
          pdf.setTextColor(255, 255, 255)
          pdf.setFontSize(9)
          pdf.setFont('helvetica', 'bold')

          const headers = ['#', 'Customer', 'Items', 'Total', 'Status', 'Date']
          let xPos = margin + 2

          headers.forEach((header, index) => {
            pdf.text(header, xPos, yPosition + 2)
            xPos += colWidths[index]
          })

          yPosition += rowHeight

          // Table rows
          pdf.setFont('helvetica', 'normal')
          let alternateRow = false

          filteredPurchases.forEach((purchase, index) => {
            if (yPosition > pageHeight - 40) {
              // Add footer to current page
              addFooter(pdf, pageHeight)

              // New page
              pdf.addPage()
              yPosition = margin

              // Repeat header on new page
              pdf.setFillColor(40, 87, 74)
              pdf.rect(margin, yPosition - 3, tableWidth, rowHeight, 'F')

              pdf.setTextColor(255, 255, 255)
              pdf.setFontSize(9)
              pdf.setFont('helvetica', 'bold')

              xPos = margin + 2
              headers.forEach((header, headerIndex) => {
                pdf.text(header, xPos, yPosition + 2)
                xPos += colWidths[headerIndex]
              })

              yPosition += rowHeight
              alternateRow = false
            }

            // Alternate row background
            if (alternateRow) {
              pdf.setFillColor(248, 250, 252) // Very light gray
              pdf.rect(margin, yPosition - 3, tableWidth, rowHeight, 'F')
            }

            // Row number
            pdf.setTextColor(100, 116, 139)
            pdf.setFontSize(8)
            xPos = margin + 2
            pdf.text((index + 1).toString(), xPos, yPosition + 2)

            // Customer details
            pdf.setTextColor(15, 23, 42)
            pdf.setFontSize(9)
            pdf.setFont('helvetica', 'bold')
            const customerName = purchase.buyer.name.length > 15 ? purchase.buyer.name.substring(0, 15) + '...' : purchase.buyer.name
            pdf.text(customerName, xPos + colWidths[0] + 2, yPosition + 1)

            pdf.setFont('helvetica', 'normal')
            pdf.setFontSize(7)
            pdf.setTextColor(100, 116, 139)
            const customerEmail = purchase.buyer.email.length > 15 ? purchase.buyer.email.substring(0, 15) + '...' : purchase.buyer.email
            pdf.text(customerEmail, xPos + colWidths[0] + 2, yPosition + 5)

            // Items count
            pdf.setTextColor(71, 85, 105)
            pdf.setFontSize(8)
            const itemsX = xPos + colWidths[0] + colWidths[1] + 2
            const itemsText = `${purchase.items.length} item${purchase.items.length !== 1 ? 's' : ''}`
            pdf.text(itemsText, itemsX, yPosition + 2.5)

            // Total amount
            pdf.setTextColor(34, 197, 94)
            pdf.setFontSize(8)
            const totalX = itemsX + colWidths[2] + 2
            pdf.text(`LKR ${purchase.totalAmount?.toFixed(2) || '0.00'}`, totalX, yPosition + 2.5)

            // Status badge
            const statusX = totalX + colWidths[3] + 2
            let statusColor = [100, 116, 139] // Default neutral
            if (purchase.status === 'delivered') statusColor = [34, 197, 94] // Green
            else if (purchase.status === 'shipped') statusColor = [147, 197, 253] // Blue
            else if (purchase.status === 'confirmed') statusColor = [251, 191, 36] // Yellow
            else if (purchase.status === 'cancelled') statusColor = [239, 68, 68] // Red

            pdf.setFillColor(statusColor[0], statusColor[1], statusColor[2])
            pdf.rect(statusX - 1, yPosition - 1, colWidths[4] - 2, 6, 'F')

            pdf.setTextColor(255, 255, 255)
            pdf.setFontSize(7)
            const statusText = purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)
            pdf.text(statusText, statusX + (colWidths[4] - 2) / 2, yPosition + 2.5, { align: 'center' })

            // Date
            pdf.setTextColor(100, 116, 139)
            pdf.setFontSize(7)
            const dateX = statusX + colWidths[4] + 2
            const dateText = formatDate(purchase.createdAt).split(',')[0] // Date only
            pdf.text(dateText, dateX, yPosition + 2.5)

            yPosition += rowHeight
            alternateRow = !alternateRow

            // Row separator line
            pdf.setDrawColor(226, 232, 240) // Light border
            pdf.line(margin, yPosition - 3, margin + tableWidth, yPosition - 3)
          })
        } else {
          pdf.setFont('helvetica', 'normal')
          pdf.setFontSize(12)
          pdf.setTextColor(148, 163, 184)
          pdf.text('No purchase data available for the selected filters.', margin, yPosition)
        }

        // Add footer to last page
        addFooter(pdf, pageHeight)

        // Save PDF
        const fileName = `egg-farm-purchases-${new Date().toISOString().split('T')[0]}.pdf`
        pdf.save(fileName)
      }

      function addFooter(pdf, pageHeight) {
        const footerY = pageHeight - 15

        // Footer line
        pdf.setDrawColor(40, 87, 74)
        pdf.setLineWidth(0.5)
        pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5)

        // Footer text
        pdf.setTextColor(100, 116, 139)
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'normal')
        pdf.text('Egg Farm Management System - Confidential Document', pageWidth / 2, footerY, { align: 'center' })

        pdf.setFontSize(7)
        pdf.text(`Page ${pdf.internal.getNumberOfPages()}`, pageWidth - margin, footerY, { align: 'right' })
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 lg:ml-64 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent mb-4"></div>
            <p className="text-slate-600 font-medium">Loading purchase data...</p>
          </div>
        </div>
      </div>
    )
  }

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
            <h1 className="text-lg font-semibold text-slate-800">Purchase Management</h1>
            <div className="w-9"></div>
          </div>
        </div>

        <main className="p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">Purchase Management</h1>
                  <p className="text-slate-600">Monitor and manage all customer orders</p>
                </div>
                <button
                  onClick={generateReport}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white text-2xl">🛒</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-500">Total Orders</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.totalPurchases}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white text-2xl">💰</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-500">Total Revenue</p>
                    <p className="text-2xl font-bold text-slate-900">LKR {stats.totalRevenue?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white text-2xl">⏳</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-500">Pending Orders</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.pendingOrders}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white text-2xl">✅</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-500">Completed Orders</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.completedOrders}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
                  <input
                    type="text"
                    placeholder="Search by buyer name or order ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Date Range</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setStatusFilter('all')
                      setSearchTerm('')
                      setDateFilter('all')
                    }}
                    className="w-full px-4 py-3 bg-slate-600 text-white rounded-xl hover:bg-slate-700 transition-colors font-medium"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Purchases Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900">Orders ({filteredPurchases.length})</h2>
              </div>

              {error && (
                <div className="p-6">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600">{error}</p>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Order ID</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Buyer</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Items</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredPurchases.map((purchase) => (
                      <tr key={purchase._id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900">#{purchase._id.slice(-8)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900">{purchase.buyer.name}</div>
                          <div className="text-sm text-slate-500">{purchase.buyer.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900">
                            {purchase.items.length} item{purchase.items.length !== 1 ? 's' : ''}
                          </div>
                          <div className="text-sm text-slate-500">
                            {purchase.items.map(item => `${item.quantity}x ${item.productName}`).join(', ')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900">LKR {purchase.totalAmount?.toFixed(2) || '0.00'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(purchase.status)}`}>
                            <span className="mr-1">{getStatusIcon(purchase.status)}</span>
                            {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900">{formatDate(purchase.createdAt)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => openDetailsModal(purchase)}
                            className="text-emerald-600 hover:text-emerald-900 mr-4"
                          >
                            View Details
                          </button>
                          {purchase.status !== 'delivered' && purchase.status !== 'cancelled' && (
                            <select
                              value={purchase.status}
                              onChange={(e) => updatePurchaseStatus(purchase._id, e.target.value)}
                              disabled={updatingStatus}
                              className="text-xs border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirm</option>
                              <option value="shipped">Ship</option>
                              <option value="delivered">Deliver</option>
                              <option value="cancelled">Cancel</option>
                            </select>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredPurchases.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No orders found</h3>
                  <p className="text-slate-500">Try adjusting your search or filter criteria.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Order Details</h2>
                    <p className="text-emerald-100 text-sm">Order #{selectedPurchase._id.slice(-8)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="w-10 h-10 bg-white/20 rounded-xl hover:bg-white/30 transition-colors flex items-center justify-center backdrop-blur-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-8 py-6 max-h-[70vh] overflow-y-auto">
              {/* Status Badge */}
              <div className="flex justify-center mb-6">
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(selectedPurchase.status)} shadow-lg`}>
                  <span className="mr-2 text-lg">{getStatusIcon(selectedPurchase.status)}</span>
                  {selectedPurchase.status.charAt(0).toUpperCase() + selectedPurchase.status.slice(1)}
                </span>
              </div>

              {/* Order & Customer Info Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Order Information */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Order Information</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-slate-200">
                      <span className="text-slate-600 font-medium">Order ID</span>
                      <span className="text-slate-900 font-mono text-sm">#{selectedPurchase._id.slice(-8)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-200">
                      <span className="text-slate-600 font-medium">Date</span>
                      <span className="text-slate-900">{formatDate(selectedPurchase.createdAt)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-200">
                      <span className="text-slate-600 font-medium">Payment Method</span>
                      <span className="text-slate-900 capitalize">{selectedPurchase.paymentMethod?.replace('_', ' ') || 'Cash'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-slate-600 font-medium">Items</span>
                      <span className="text-slate-900 font-semibold">{selectedPurchase.items.length} item{selectedPurchase.items.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 border border-blue-200">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Customer Details</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-blue-200">
                      <span className="text-blue-700 font-medium">Name</span>
                      <span className="text-slate-900 font-semibold">{selectedPurchase.buyer.name}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-blue-200">
                      <span className="text-blue-700 font-medium">Email</span>
                      <span className="text-slate-900 text-sm">{selectedPurchase.buyer.email}</span>
                    </div>
                    {selectedPurchase.buyer.phone && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-blue-700 font-medium">Phone</span>
                        <span className="text-slate-900">{selectedPurchase.buyer.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              {selectedPurchase.address && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl p-6 mb-6 border border-purple-200">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Shipping Address</h3>
                  </div>
                  <div className="bg-white/70 rounded-xl p-4 border border-purple-200">
                    <p className="text-slate-900 font-medium">{selectedPurchase.address.fullName}</p>
                    <p className="text-slate-700">{selectedPurchase.address.street}</p>
                    <p className="text-slate-700">{selectedPurchase.address.city}, {selectedPurchase.address.district}</p>
                    <p className="text-slate-700">{selectedPurchase.address.province}, {selectedPurchase.address.postalCode}</p>
                    <p className="text-slate-700">{selectedPurchase.address.country}</p>
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Order Items</h3>
                  <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium">
                    {selectedPurchase.items.length} item{selectedPurchase.items.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-4">
                  {selectedPurchase.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                          <span className="text-white text-lg">
                            {item.productType === 'eggs' ? '🥚' : item.productType === 'fertilizer' ? '🌱' : '🌾'}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">{item.productName}</h4>
                          <p className="text-sm text-slate-600">{item.quantity} × LKR {item.unitPrice?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-emerald-600">LKR {item.totalPrice?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Order Total</h3>
                    <p className="text-emerald-100">Including all items and taxes</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold">LKR {selectedPurchase.totalAmount?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              </div>

              {/* Status Update Actions */}
              {selectedPurchase.status !== 'delivered' && selectedPurchase.status !== 'cancelled' && (
                <div className="mt-6 bg-slate-50 rounded-2xl p-6 border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Update Order Status
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {selectedPurchase.status === 'pending' && (
                      <button
                        onClick={() => updatePurchaseStatus(selectedPurchase._id, 'confirmed')}
                        disabled={updatingStatus}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {updatingStatus ? 'Updating...' : '✅ Confirm Order'}
                      </button>
                    )}
                    {selectedPurchase.status === 'confirmed' && (
                      <button
                        onClick={() => updatePurchaseStatus(selectedPurchase._id, 'shipped')}
                        disabled={updatingStatus}
                        className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {updatingStatus ? 'Updating...' : '🚚 Mark as Shipped'}
                      </button>
                    )}
                    {selectedPurchase.status === 'shipped' && (
                      <button
                        onClick={() => updatePurchaseStatus(selectedPurchase._id, 'delivered')}
                        disabled={updatingStatus}
                        className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {updatingStatus ? 'Updating...' : '📦 Mark as Delivered'}
                      </button>
                    )}
                    {selectedPurchase.status !== 'cancelled' && (
                      <button
                        onClick={() => updatePurchaseStatus(selectedPurchase._id, 'cancelled')}
                        disabled={updatingStatus}
                        className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {updatingStatus ? 'Updating...' : '❌ Cancel Order'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PurchaseManagement