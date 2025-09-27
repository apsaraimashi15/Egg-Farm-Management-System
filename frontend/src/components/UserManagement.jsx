import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import Sidebar from './Sidebar'

// Schema for adding new users (includes password validation)
const addUserSchema = yup.object({
  name: yup.string().required('Name is required').min(2, 'Name must be at least 2 characters'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
  role: yup.string().oneOf(['employee', 'buyer', 'admin', 'hrmanager'], 'Invalid role').required('Role is required'),
  isActive: yup.boolean()
})

// Schema for editing existing users (no password validation)
const editUserSchema = yup.object({
  name: yup.string().required('Name is required').min(2, 'Name must be at least 2 characters'),
  email: yup.string().email('Invalid email').required('Email is required'),
  role: yup.string().oneOf(['employee', 'buyer', 'admin', 'hrmanager'], 'Invalid role').required('Role is required'),
  isActive: yup.boolean()
})

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredUsers, setFilteredUsers] = useState([])

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(editingUser ? editUserSchema : addUserSchema)
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    const filtered = users.filter(user =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredUsers(filtered)
  }, [users, searchTerm])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await axios.get('http://localhost:5000/api/users')
      setUsers(response.data)
    } catch (err) {
      setError('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      setModalLoading(true)
      const submitData = editingUser
        ? { name: data.name, email: data.email, role: data.role, isActive: data.isActive }
        : {
            name: data.name,
            email: data.email,
            password: data.password,
            role: data.role
          }
      if (editingUser) {
        await axios.put(`http://localhost:5000/api/users/${editingUser._id}`, submitData)
      } else {
        await axios.post('http://localhost:5000/api/users', submitData)
      }
      fetchUsers()
      setShowModal(false)
      setEditingUser(null)
      reset()
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed')
    } finally {
      setModalLoading(false)
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    reset({
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    }, { resolver: yupResolver(editUserSchema) })
    setShowModal(true)
  }

  const handleDelete = (user) => {
    setUserToDelete(user)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!userToDelete) return

    try {
      await axios.delete(`http://localhost:5000/api/users/${userToDelete._id}`)
      fetchUsers()
      setShowDeleteModal(false)
      setUserToDelete(null)
    } catch (err) {
      setError('Failed to delete user')
      setShowDeleteModal(false)
      setUserToDelete(null)
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setUserToDelete(null)
  }

  const handleToggleActive = async (user) => {
    try {
      await axios.put(`http://localhost:5000/api/users/${user._id}`, {
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: !user.isActive
      })
      fetchUsers()
    } catch (err) {
      setError('Failed to update user status')
    }
  }

  const openAddModal = () => {
    setEditingUser(null)
    reset({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'employee',
      isActive: true
    }, { resolver: yupResolver(addUserSchema) })
    setShowModal(true)
  }

  const generatePDF = async () => {
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
            pdf.text('User Management System', 50, 25)

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
          pdf.text('User Management Report', pageWidth / 2, 27, { align: 'center' })

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
        pdf.text('User Management Report', pageWidth / 2, 27, { align: 'center' })

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
        pdf.text(`Total Users: ${filteredUsers.length}`, margin, yPosition)
        yPosition += 8

        // Active/Inactive summary
        const activeUsers = filteredUsers.filter(u => u.isActive).length
        const inactiveUsers = filteredUsers.length - activeUsers

        pdf.setTextColor(34, 197, 94)
        pdf.text(`Active Users: ${activeUsers}`, margin, yPosition)
        pdf.setTextColor(239, 68, 68)
        pdf.text(`Inactive Users: ${inactiveUsers}`, margin + 60, yPosition)
        yPosition += 15

        // Table styling
        const tableStartY = yPosition
        const rowHeight = 12
        const colWidths = [12, 45, 25, 20, 30, 25] // Adjusted column widths
        const tableWidth = colWidths.reduce((a, b) => a + b, 0)

        // Table header background
        pdf.setFillColor(40, 87, 74)
        pdf.rect(margin, yPosition - 3, tableWidth, rowHeight, 'F')

        // Table header text
        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'bold')

        const headers = ['#', 'User Details', 'Role', 'Status', 'Joined', 'Actions']
        let xPos = margin + 2

        headers.forEach((header, index) => {
          pdf.text(header, xPos, yPosition + 2)
          xPos += colWidths[index]
        })

        yPosition += rowHeight

        // Table rows
        pdf.setFont('helvetica', 'normal')
        let alternateRow = false

        filteredUsers.forEach((user, index) => {
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

          // User details
          pdf.setTextColor(15, 23, 42) // Dark slate
          pdf.setFontSize(9)
          pdf.setFont('helvetica', 'bold')
          const name = user.name || 'Unknown'
          pdf.text(name, xPos + colWidths[0] + 2, yPosition + 1)

          pdf.setFont('helvetica', 'normal')
          pdf.setFontSize(7)
          pdf.setTextColor(100, 116, 139)
          pdf.text(user.email, xPos + colWidths[0] + 2, yPosition + 5)

          // Role badge
          const roleX = xPos + colWidths[0] + colWidths[1] + 2
          let roleColor = [100, 116, 139] // Default neutral
          if (user.role === 'admin') roleColor = [147, 51, 234] // Purple
          else if (user.role === 'hrmanager') roleColor = [40, 87, 74] // Emerald
          else if (user.role === 'buyer') roleColor = [34, 197, 94] // Green

          pdf.setFillColor(roleColor[0], roleColor[1], roleColor[2])
          pdf.rect(roleX - 1, yPosition - 1, colWidths[2] - 2, 6, 'F')

          pdf.setTextColor(255, 255, 255)
          pdf.setFontSize(7)
          const roleText = user.role === 'hrmanager' ? 'HR Manager' : user.role.charAt(0).toUpperCase() + user.role.slice(1)
          pdf.text(roleText, roleX + (colWidths[2] - 2) / 2, yPosition + 2.5, { align: 'center' })

          // Status
          const statusX = roleX + colWidths[2] + 2
          const isActive = user.isActive
          if (isActive) {
            pdf.setFillColor(34, 197, 94) // Green
            pdf.setTextColor(34, 197, 94)
          } else {
            pdf.setFillColor(239, 68, 68) // Red
            pdf.setTextColor(239, 68, 68)
          }
          pdf.circle(statusX + 3, yPosition + 1.5, 1.5, 'F')

          pdf.setFontSize(8)
          pdf.text(isActive ? 'Active' : 'Inactive', statusX + 8, yPosition + 2.5)

          // Joined date
          pdf.setTextColor(100, 116, 139)
          pdf.setFontSize(7)
          const joinedX = statusX + colWidths[3] + 2
          const joinedDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }) : 'N/A'
          pdf.text(joinedDate, joinedX, yPosition + 2.5)

          // Actions
          pdf.setTextColor(40, 87, 74)
          pdf.setFontSize(7)
          const actionsX = joinedX + colWidths[4] + 2
          pdf.text('View/Edit', actionsX, yPosition + 2.5)

          yPosition += rowHeight
          alternateRow = !alternateRow

          // Row separator line
          pdf.setDrawColor(226, 232, 240) // Light border
          pdf.line(margin, yPosition - 3, margin + tableWidth, yPosition - 3)
        })

        // Add footer to last page
        addFooter(pdf, pageHeight)

        // Save PDF
        const fileName = `egg-farm-users-${new Date().toISOString().split('T')[0]}.pdf`
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent mb-4"></div>
            <p className="text-slate-600 font-medium">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        {/* Mobile menu button */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm px-4 py-3 shadow-sm border-b border-white/20">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-600 hover:text-slate-800 p-2 rounded-lg hover:bg-white/50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-slate-800">Users</h1>
            <div className="w-9"></div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-screen-2xl mx-auto">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-800 rounded-2xl p-8 mb-8 text-white">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 -translate-y-12"></div>
                <div className="absolute bottom-0 left-1/4 w-20 h-20 bg-white rounded-full translate-y-10"></div>
                <div className="absolute bottom-0 right-1/3 w-16 h-16 bg-white rounded-full translate-y-8"></div>
              </div>

              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                        <p className="text-emerald-100 text-lg">Manage your organization's team members</p>
                      </div>
                    </div>
                    <p className="text-slate-300 max-w-2xl">
                      Oversee user accounts, permissions, and access levels. Add new members, update roles,
                      and maintain a secure and organized workforce.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={openAddModal}
                      className="inline-flex items-center px-6 py-3 bg-white text-slate-900 font-semibold rounded-xl hover:bg-emerald-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add New User
                    </button>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-emerald-100 text-sm font-medium">Total Users</p>
                        <p className="text-2xl font-bold text-white mt-1">{users.length}</p>
                        {searchTerm && (
                          <p className="text-emerald-200 text-xs mt-1">Showing: {filteredUsers.length}</p>
                        )}
                      </div>
                      <div className="p-3 bg-emerald-500/20 rounded-lg">
                        <svg className="w-6 h-6 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm font-medium">Active Users</p>
                        <p className="text-2xl font-bold text-white mt-1">{users.filter(u => u.isActive).length}</p>
                      </div>
                      <div className="p-3 bg-green-500/20 rounded-lg">
                        <svg className="w-6 h-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm font-medium">Administrators</p>
                        <p className="text-2xl font-bold text-white mt-1">{users.filter(u => u.role === 'admin').length}</p>
                      </div>
                      <div className="p-3 bg-purple-500/20 rounded-lg">
                        <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1112 21h0a9 9 0 01-6.879-3.196m6.879-12.804v9m4.5-4.5h-9" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-sm font-medium">Employees</p>
                        <p className="text-2xl font-bold text-white mt-1">{users.filter(u => u.role === 'employee').length}</p>
                      </div>
                      <div className="p-3 bg-orange-500/20 rounded-lg">
                        <svg className="w-6 h-6 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Team Members</h3>
                    <p className="text-sm text-slate-600 mt-1">Manage your organization's users and their permissions</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search Bar */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                      />
                    </div>
                    {/* PDF Download Button */}
                    <button
                      onClick={generatePDF}
                      className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download PDF
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table id="users-table" className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">#</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredUsers.map((user, index) => (
                      <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-slate-900">{user.name || 'Unknown'}</div>
                              <div className="text-sm text-slate-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'hrmanager' ? 'bg-emerald-100 text-emerald-800' :
                            user.role === 'buyer' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role === 'hrmanager' ? 'HR Manager' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${user.isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
                            <span className={`text-sm font-medium ${user.isActive ? 'text-green-800' : 'text-red-800'}`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => viewDetails(user)}
                              className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
                              title="View details"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleEdit(user)}
                              className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
                              title="Edit user"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleToggleActive(user)}
                              className={`p-1 rounded-md transition-colors ${
                                user.isActive
                                  ? 'text-green-600 hover:bg-green-50'
                                  : 'text-red-600 hover:bg-red-50'
                              }`}
                              title={user.isActive ? 'Deactivate user' : 'Activate user'}
                            >
                              {user.isActive ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(user)}
                              className="text-red-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors"
                              title="Delete user"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredUsers.length === 0 && searchTerm && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No users found</h3>
                  <p className="text-slate-500 mb-6">Try adjusting your search terms.</p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="inline-flex items-center px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
                  >
                    Clear Search
                  </button>
                </div>
              )}

              {filteredUsers.length === 0 && !searchTerm && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No users yet</h3>
                  <p className="text-slate-500 mb-6">Get started by adding your first team member.</p>
                  <button
                    onClick={openAddModal}
                    className="inline-flex items-center px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add User
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 m-4 max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {editingUser ? 'Edit User' : 'Add User'}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {editingUser ? 'Update user information' : 'Create a new user account'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input
                    {...register('name')}
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter full name"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    {...register('email')}
                    type="email"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter email address"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                </div>

                {/* Password (Add only) */}
                {!editingUser && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                      <input
                        {...register('password')}
                        type="password"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Enter password"
                      />
                      {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                      <input
                        {...register('confirmPassword')}
                        type="password"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Confirm password"
                      />
                      {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
                    </div>
                  </>
                )}

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                  <select
                    {...register('role')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="employee">Employee</option>
                    <option value="buyer">Buyer</option>
                    <option value="admin">Admin</option>
                    <option value="hrmanager">HR Manager</option>
                  </select>
                  {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>}
                </div>

                {/* Active Status (Edit only) */}
                {editingUser && (
                  <div className="flex items-center">
                    <input
                      {...register('isActive')}
                      type="checkbox"
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                    />
                    <label className="ml-2 text-sm text-slate-700">Active user</label>
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  {modalLoading ? 'Saving...' : (editingUser ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-2xl p-6 m-4 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              {/* Warning Icon */}
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete User</h3>

              {/* Message */}
              <p className="text-slate-600 mb-6 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-slate-900">{userToDelete.name}</span>?
                This action cannot be undone and will permanently remove the user from the system.
              </p>

              {/* User Info Card */}
              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                    {userToDelete.name ? userToDelete.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-900">{userToDelete.name}</p>
                    <p className="text-sm text-slate-500">{userToDelete.email}</p>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={modalLoading}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {modalLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Deleting...
                    </div>
                  ) : (
                    'Delete User'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement