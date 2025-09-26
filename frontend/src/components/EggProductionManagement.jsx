import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import Sidebar from './Sidebar'

// =============== config ===============
const API_BASE = 'http://localhost:5000'
const ENDPOINT = `${API_BASE}/api/egg-production`

// Add token automatically (reads from localStorage.token or sessionStorage.token)
const api = axios.create()
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  cfg.headers['Content-Type'] = 'application/json'
  return cfg
})

// =============== helpers ===============
const toInputDate = (d) => {
  if (!d) return ''
  const dt = new Date(d)
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const normalizeDay = (val) => {
  const dt = new Date(val)
  dt.setHours(0, 0, 0, 0)
  return dt.toISOString()
}

// =============== validation ===============
const schema = yup.object({
  date: yup.string().required('Date is required'),
  quantity: yup.number().typeError('Enter a number').min(0, 'Must be >= 0').required('Quantity is required'),
  type: yup.string()
})

const EggProductionManagement = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [productions, setProductions] = useState([])
  const [filtered, setFiltered] = useState([])
  const [searchDate, setSearchDate] = useState('') // yyyy-mm-dd
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null) // record
  const [modalLoading, setModalLoading] = useState(false)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  })

  // =============== effects ===============
  useEffect(() => { fetchAll() }, [])

  useEffect(() => {
    if (!searchDate) {
      setFiltered(productions)
      return
    }
    setFiltered(productions.filter(p => toInputDate(p.date) === searchDate))
  }, [productions, searchDate])

  // =============== api ===============
  const fetchAll = async () => {
    try {
      setLoading(true)
      setError('') // Clear any previous errors
      const res = await api.get(ENDPOINT)
      console.log('Fetched data:', res.data) // Debug log
      setProductions(res.data || [])
    } catch (e) {
      console.error('Fetch error:', e) // Debug log
      setError(e.response?.data?.message || 'Failed to fetch egg productions')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      setModalLoading(true)
      setError('') // Clear any previous errors
      
      const payload = { 
        date: normalizeDay(data.date), 
        quantity: Number(data.quantity), 
        type: data.type || 'Mixed' // Provide default if empty
      }
      
      console.log('Submitting payload:', payload) // Debug log
      console.log('Editing mode:', !!editing) // Debug log
      
      let response
      if (editing) {
        console.log('Updating record ID:', editing._id) // Debug log
        response = await api.put(`${ENDPOINT}/${editing._id}`, payload)
      } else {
        response = await api.post(ENDPOINT, payload)
      }
      
      console.log('API response:', response.data) // Debug log
      
      // Force refresh data from server
      await fetchAll()
      
      // Close modal and reset form
      setShowModal(false)
      setEditing(null)
      reset()
      
    } catch (e) {
      console.error('Submit error:', e) // Debug log
      const msg = e.response?.data?.message || 'Operation failed'
      setError(msg)
    } finally {
      setModalLoading(false)
    }
  }

  const openAddModal = () => {
    setEditing(null)
    setError('') // Clear errors
    reset({ date: '', quantity: '', type: '' }) // Include type field
    setShowModal(true)
  }

  const handleEdit = (rec) => {
    console.log('Editing record:', rec) // Debug log
    setEditing(rec)
    setError('') // Clear errors
    // Include all fields including type
    reset({ 
      date: toInputDate(rec.date), 
      quantity: rec.quantity,
      type: rec.type || '' // Handle empty/undefined type
    })
    setShowModal(true)
  }

  const askDelete = (rec) => {
    setRecordToDelete(rec)
    setError('') // Clear errors
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!recordToDelete) return
    
    try {
      setModalLoading(true)
      setError('') // Clear errors
      
      console.log('Deleting record ID:', recordToDelete._id) // Debug log
      
      const response = await api.delete(`${ENDPOINT}/${recordToDelete._id}`)
      console.log('Delete response:', response.data) // Debug log
      
      // Force refresh data from server
      await fetchAll()
      
    } catch (e) {
      console.error('Delete error:', e) // Debug log
      setError(e.response?.data?.message || 'Failed to delete record')
    } finally {
      setShowDeleteModal(false)
      setRecordToDelete(null)
      setModalLoading(false)
    }
  }

  // =============== stats ===============
  const totals = useMemo(() => {
    const totalQty = filtered.reduce((a, b) => a + (Number(b.quantity) || 0), 0)
    const uniqueDays = new Set(filtered.map(r => toInputDate(r.date))).size
    return { totalQty, uniqueDays, rows: filtered.length }
  }, [filtered])

  // =============== pdf (optional light) ===============
  const generatePDF = async () => {
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF('p', 'mm', 'a4')
      const margin = 14
      let y = 16

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.text('Egg Production Report', margin, y)
      y += 8

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y)
      y += 6
      doc.text(`Rows: ${totals.rows}   |   Unique Days: ${totals.uniqueDays}   |   Total Qty: ${totals.totalQty}`, margin, y)
      y += 8

      doc.setFont('helvetica', 'bold')
      doc.text('No', margin, y)
      doc.text('Date', margin + 14, y)
      doc.text('Type', margin + 50, y)
      doc.text('Quantity', margin + 80, y)
      y += 6
      doc.setFont('helvetica', 'normal')

      filtered.forEach((r, idx) => {
        if (y > 280) { doc.addPage(); y = 16 }
        doc.text(String(idx + 1), margin, y)
        doc.text(toInputDate(r.date), margin + 14, y)
        doc.text(r.type || '-', margin + 50, y)
        doc.text(String(r.quantity), margin + 80, y)
        y += 6
      })

      doc.save(`egg-production-${new Date().toISOString().slice(0,10)}.pdf`)
    } catch (e) {
      console.error(e)
      alert('Failed to generate PDF')
    }
  }

  // =============== UI ===============
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 md:pl-72 lg:pl-72">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="ml-0 md:ml-72 lg:ml-72">
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent mb-4"></div>
              <p className="text-slate-600 font-medium">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1">
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
            <h1 className="text-lg font-semibold text-slate-800">Egg Production</h1>
            <div className="w-9"></div>
          </div>
        </div>

        <main className="p-6 mb-100">
          <div className="max-w-screen-2xl mx-auto">
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-800 rounded-2xl p-8 mb-8 text-white">
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c1.5 0 3 .5 4 1.5M8 16a6 6 0 118 0M7 12h10" />
                        </svg>
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold tracking-tight">Egg Production</h1>
                        <p className="text-emerald-100 text-lg">Record daily production and manage stock updates</p>
                      </div>
                    </div>
                    <p className="text-slate-300 max-w-2xl">
                      Add, edit, and review daily egg production entries. Use the date filter to quickly
                      find a specific day's record.
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
                      Add Production
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200">
                    <p className="text-emerald-100 text-sm font-medium">Rows</p>
                    <p className="text-2xl font-bold text-white mt-1">{filtered.length}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200">
                    <p className="text-green-100 text-sm font-medium">Unique Days</p>
                    <p className="text-2xl font-bold text-white mt-1">{totals.uniqueDays}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200">
                    <p className="text-orange-100 text-sm font-medium">Total Quantity</p>
                    <p className="text-2xl font-bold text-white mt-1">{totals.totalQty}</p>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Daily Records</h3>
                    <p className="text-sm text-slate-600 mt-1">Manage daily egg production</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                      <input
                        type="date"
                        value={searchDate}
                        onChange={(e) => setSearchDate(e.target.value)}
                        className="block w-full sm:w-56 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                      />
                    </div>
                    <button
                      onClick={() => { setSearchDate('') }}
                      className="inline-flex items-center px-3 py-2 bg-slate-100 text-slate-800 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      Clear Filter
                    </button>
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
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">#</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filtered.map((rec, idx) => (
                      <tr key={rec._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{idx + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{rec.type || 'Mixed'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{toInputDate(rec.date)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{rec.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEdit(rec)}
                              className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => askDelete(rec)}
                              className="text-red-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors"
                              title="Delete"
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

              {filtered.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6M12 9v6m9 3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No records yet</h3>
                  <p className="text-slate-500 mb-6">Start by adding today's production.</p>
                  <button
                    onClick={openAddModal}
                    className="inline-flex items-center px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Production
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 m-4 max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12h10M12 7v10" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {editing ? 'Edit Production' : 'Add Production'}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {editing ? 'Update daily quantity' : 'Record daily eggs collected'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    {...register('date')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    {...register('quantity')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="e.g., 120"
                  />
                  {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Egg Type</label>
                  <input
                    type="text"
                    {...register('type')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="e.g., White, Brown, Mixed"
                  />
                  {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
                </div>
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
                  {modalLoading ? 'Saving...' : (editing ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-2xl p-6 m-4 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Record</h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Delete egg production for <span className="font-semibold text-slate-900">{toInputDate(recordToDelete.date)}</span>?
                This action cannot be undone.
              </p>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setRecordToDelete(null) }}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={modalLoading}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {modalLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EggProductionManagement