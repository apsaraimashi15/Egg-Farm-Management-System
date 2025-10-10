import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Sidebar from './Sidebar'

const Reports = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [reportData, setReportData] = useState({
    leaveRequests: [],
    payroll: [],
    attendance: []
  })
  const [reportParams, setReportParams] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  })

  const fetchReportData = async () => {
    try {
      setLoading(true)
      setError('')
      const token = localStorage.getItem('token')
      const { month, year } = reportParams

      // Fetch leave requests
      const leaveResponse = await axios.get(`http://localhost:5000/api/leaves?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      // Fetch attendance summary (used for payroll and attendance reports)
      const attendanceResponse = await axios.get(`http://localhost:5000/api/attendance/summary?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setReportData({
        leaveRequests: leaveResponse.data,
        payroll: attendanceResponse.data.map(summary => ({
          employee: summary.employee,
          daysWorked: summary.daysWorked,
          salary: summary.salary
        })),
        attendance: attendanceResponse.data.map(summary => ({
          employee: summary.employee,
          daysWorked: summary.daysWorked,
          daysLeaved: summary.daysLeaved,
          daysAbsent: summary.daysAbsent
        }))
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch report data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReportData()
  }, [reportParams])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setReportParams(prev => ({ ...prev, [name]: parseInt(value) }))
  }

  const generatePDF = async (type) => {
    try {
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 20
      let yPosition = margin
      const { month, year } = reportParams
      const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' })

      // Defining header
      const addHeader = () => {
        pdf.setFillColor(40, 87, 74)
        pdf.rect(0, 0, pageWidth, 35, 'F')
        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(18)
        pdf.setFont('helvetica', 'bold')
        pdf.text('EGG FARM MANAGEMENT', pageWidth / 2, 17, { align: 'center' })
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'normal')
        pdf.text(`${type.charAt(0).toUpperCase() + type.slice(1)} Report - ${monthName} ${year}`, pageWidth / 2, 27, { align: 'center' })
        yPosition = 50
      }

      // Defining footer
      const addFooter = (pageNum) => {
        const footerY = pageHeight - 15
        pdf.setDrawColor(40, 87, 74)
        pdf.setLineWidth(0.5)
        pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5)
        pdf.setTextColor(100, 116, 139)
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'normal')
        pdf.text('Egg Farm Management System - Confidential Document', pageWidth / 2, footerY, { align: 'center' })
        pdf.setFontSize(7)
        pdf.text(`Page ${pageNum}`, pageWidth - margin, footerY, { align: 'right' })
      }

      // Adding content based on report type
      const addContent = () => {
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

        if (type === 'leave') {
          pdf.text(`Total Leave Requests: ${reportData.leaveRequests.length}`, margin, yPosition)
          yPosition += 15

          const colWidths = [30, 40, 30, 30, 30, 40]
          const tableWidth = colWidths.reduce((a, b) => a + b, 0)
          const headers = ['Employee', 'Email', 'Start Date', 'End Date', 'Status', 'Reason']

          // Table header
          pdf.setFillColor(40, 87, 74)
          pdf.rect(margin, yPosition - 3, tableWidth, 12, 'F')
          pdf.setTextColor(255, 255, 255)
          pdf.setFontSize(9)
          pdf.setFont('helvetica', 'bold')
          let xPos = margin + 2
          headers.forEach((header, index) => {
            pdf.text(header, xPos, yPosition + 2)
            xPos += colWidths[index]
          })
          yPosition += 12

          // Table rows
          pdf.setFont('helvetica', 'normal')
          let alternateRow = false
          reportData.leaveRequests.forEach((req, index) => {
            if (yPosition > pageHeight - 40) {
              addFooter(pdf.internal.getNumberOfPages())
              pdf.addPage()
              yPosition = margin
              pdf.setFillColor(40, 87, 74)
              pdf.rect(margin, yPosition - 3, tableWidth, 12, 'F')
              pdf.setTextColor(255, 255, 255)
              pdf.setFontSize(9)
              pdf.setFont('helvetica', 'bold')
              xPos = margin + 2
              headers.forEach((header, headerIndex) => {
                pdf.text(header, xPos, yPosition + 2)
                xPos += colWidths[headerIndex]
              })
              yPosition += 12
              alternateRow = false
            }

            if (alternateRow) {
              pdf.setFillColor(248, 250, 252)
              pdf.rect(margin, yPosition - 3, tableWidth, 12, 'F')
            }

            pdf.setTextColor(15, 23, 42)
            pdf.setFontSize(8)
            xPos = margin + 2
            pdf.text(req.userId?.name || 'Unknown', xPos, yPosition + 2)
            xPos += colWidths[0]
            pdf.setTextColor(100, 116, 139)
            pdf.setFontSize(7)
            pdf.text(req.userId?.email || 'Unknown', xPos, yPosition + 2)
            xPos += colWidths[1]
            pdf.text(new Date(req.startDate).toLocaleDateString(), xPos, yPosition + 2)
            xPos += colWidths[2]
            pdf.text(new Date(req.endDate).toLocaleDateString(), xPos, yPosition + 2)
            xPos += colWidths[3]
            pdf.setTextColor(req.status === 'approved' ? [34, 197, 94] : req.status === 'rejected' ? [239, 68, 68] : [100, 116, 139])
            pdf.text(req.status.charAt(0).toUpperCase() + req.status.slice(1), xPos, yPosition + 2)
            xPos += colWidths[4]
            pdf.setTextColor(100, 116, 139)
            pdf.text(req.reason || 'N/A', xPos, yPosition + 2)

            yPosition += 12
            alternateRow = !alternateRow
            pdf.setDrawColor(226, 232, 240)
            pdf.line(margin, yPosition - 3, margin + tableWidth, yPosition - 3)
          })
        } else if (type === 'payroll') {
          pdf.text(`Total Employees: ${reportData.payroll.length}`, margin, yPosition)
          yPosition += 15

          const colWidths = [50, 50, 30, 40]
          const tableWidth = colWidths.reduce((a, b) => a + b, 0)
          const headers = ['Employee', 'Email', 'Days Worked', 'Salary ($)']

          // Table header
          pdf.setFillColor(40, 87, 74)
          pdf.rect(margin, yPosition - 3, tableWidth, 12, 'F')
          pdf.setTextColor(255, 255, 255)
          pdf.setFontSize(9)
          pdf.setFont('helvetica', 'bold')
          let xPos = margin + 2
          headers.forEach((header, index) => {
            pdf.text(header, xPos, yPosition + 2)
            xPos += colWidths[index]
          })
          yPosition += 12

          // Table rows
          pdf.setFont('helvetica', 'normal')
          let alternateRow = false
          reportData.payroll.forEach((item, index) => {
            if (yPosition > pageHeight - 40) {
              addFooter(pdf.internal.getNumberOfPages())
              pdf.addPage()
              yPosition = margin
              pdf.setFillColor(40, 87, 74)
              pdf.rect(margin, yPosition - 3, tableWidth, 12, 'F')
              pdf.setTextColor(255, 255, 255)
              pdf.setFontSize(9)
              pdf.setFont('helvetica', 'bold')
              xPos = margin + 2
              headers.forEach((header, headerIndex) => {
                pdf.text(header, xPos, yPosition + 2)
                xPos += colWidths[headerIndex]
              })
              yPosition += 12
              alternateRow = false
            }

            if (alternateRow) {
              pdf.setFillColor(248, 250, 252)
              pdf.rect(margin, yPosition - 3, tableWidth, 12, 'F')
            }

            pdf.setTextColor(15, 23, 42)
            pdf.setFontSize(8)
            xPos = margin + 2
            pdf.text(item.employee?.name || 'Unknown', xPos, yPosition + 2)
            xPos += colWidths[0]
            pdf.setTextColor(100, 116, 139)
            pdf.setFontSize(7)
            pdf.text(item.employee?.email || 'Unknown', xPos, yPosition + 2)
            xPos += colWidths[1]
            pdf.text(item.daysWorked.toString(), xPos, yPosition + 2)
            xPos += colWidths[2]
            pdf.text(`$${item.salary.toFixed(2)}`, xPos, yPosition + 2)

            yPosition += 12
            alternateRow = !alternateRow
            pdf.setDrawColor(226, 232, 240)
            pdf.line(margin, yPosition - 3, margin + tableWidth, yPosition - 3)
          })
        } else if (type === 'attendance') {
          pdf.text(`Total Employees: ${reportData.attendance.length}`, margin, yPosition)
          yPosition += 15

          const colWidths = [40, 40, 30, 30, 30]
          const tableWidth = colWidths.reduce((a, b) => a + b, 0)
          const headers = ['Employee', 'Email', 'Days Worked', 'Days Leaved', 'Days Absent']

          // Table header
          pdf.setFillColor(40, 87, 74)
          pdf.rect(margin, yPosition - 3, tableWidth, 12, 'F')
          pdf.setTextColor(255, 255, 255)
          pdf.setFontSize(9)
          pdf.setFont('helvetica', 'bold')
          let xPos = margin + 2
          headers.forEach((header, index) => {
            pdf.text(header, xPos, yPosition + 2)
            xPos += colWidths[index]
          })
          yPosition += 12

          // Table rows
          pdf.setFont('helvetica', 'normal')
          let alternateRow = false
          reportData.attendance.forEach((item, index) => {
            if (yPosition > pageHeight - 40) {
              addFooter(pdf.internal.getNumberOfPages())
              pdf.addPage()
              yPosition = margin
              pdf.setFillColor(40, 87, 74)
              pdf.rect(margin, yPosition - 3, tableWidth, 12, 'F')
              pdf.setTextColor(255, 255, 255)
              pdf.setFontSize(9)
              pdf.setFont('helvetica', 'bold')
              xPos = margin + 2
              headers.forEach((header, headerIndex) => {
                pdf.text(header, xPos, yPosition + 2)
                xPos += colWidths[headerIndex]
              })
              yPosition += 12
              alternateRow = false
            }

            if (alternateRow) {
              pdf.setFillColor(248, 250, 252)
              pdf.rect(margin, yPosition - 3, tableWidth, 12, 'F')
            }

            pdf.setTextColor(15, 23, 42)
            pdf.setFontSize(8)
            xPos = margin + 2
            pdf.text(item.employee?.name || 'Unknown', xPos, yPosition + 2)
            xPos += colWidths[0]
            pdf.setTextColor(100, 116, 139)
            pdf.setFontSize(7)
            pdf.text(item.employee?.email || 'Unknown', xPos, yPosition + 2)
            xPos += colWidths[1]
            pdf.text(item.daysWorked.toString(), xPos, yPosition + 2)
            xPos += colWidths[2]
            pdf.text(item.daysLeaved.toString(), xPos, yPosition + 2)
            xPos += colWidths[3]
            pdf.text(item.daysAbsent.toString(), xPos, yPosition + 2)

            yPosition += 12
            alternateRow = !alternateRow
            pdf.setDrawColor(226, 232, 240)
            pdf.line(margin, yPosition - 3, margin + tableWidth, yPosition - 3)
          })
        }

        addFooter(pdf.internal.getNumberOfPages())
      }

      // Attempt to add logo
      try {
        const logoResponse = await fetch('/logo.png')
        if (logoResponse.ok) {
          const logoBlob = await logoResponse.blob()
          const logoReader = new FileReader()
          logoReader.onload = function() {
            const logoData = logoReader.result
            pdf.setFillColor(40, 87, 74)
            pdf.rect(0, 0, pageWidth, 35, 'F')
            pdf.addImage(logoData, 'PNG', margin, 7.5, 20, 20)
            pdf.setTextColor(255, 255, 255)
            pdf.setFontSize(16)
            pdf.setFont('helvetica', 'bold')
            pdf.text('EGG FARM MANAGEMENT', 50, 17)
            pdf.setFontSize(10)
            pdf.setFont('helvetica', 'normal')
            pdf.text(`${type.charAt(0).toUpperCase() + type.slice(1)} Report`, 50, 25)
            yPosition = 50
            addContent()
            pdf.save(`${type}-report-${monthName}-${year}.pdf`)
          }
          logoReader.readAsDataURL(logoBlob)
        } else {
          addHeader()
          addContent()
          pdf.save(`${type}-report-${monthName}-${year}.pdf`)
        }
      } catch {
        addHeader()
        addContent()
        pdf.save(`${type}-report-${monthName}-${year}.pdf`)
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
            <h1 className="text-lg font-semibold text-slate-800">Reports</h1>
            <div className="w-9"></div>
          </div>
        </div>

        <main className="flex-1 p-6 lg:p-8">
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6h6v6m-6 0h6m-9 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
                        <p className="text-emerald-100 text-lg">Generate and review workflow reports</p>
                      </div>
                    </div>
                    <p className="text-slate-300 max-w-2xl">
                      View and download reports for leave requests, payroll, and attendance for a selected month and year.
                    </p>
                  </div>
                </div>
              </div>
            </div>

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

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Generate Reports</h3>
                <p className="text-sm text-slate-600 mt-1">Select a month and year to generate reports</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Month</label>
                    <select
                      name="month"
                      value={reportParams.month}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    >
                      {[...Array(12)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {new Date(0, i).toLocaleString('default', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Year</label>
                    <select
                      name="year"
                      value={reportParams.year}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    >
                      {[...Array(10)].map((_, i) => {
                        const year = new Date().getFullYear() - 5 + i
                        return <option key={year} value={year}>{year}</option>
                      })}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={fetchReportData}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      Refresh Data
                    </button>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
     




     
                  <button
                    onClick={() => generatePDF('payroll')}
                    className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                    disabled={reportData.payroll.length === 0}
                  >
                    Download Payroll Report
                  </button>
                  <button
                    onClick={() => generatePDF('attendance')}
                    className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                    disabled={reportData.attendance.length === 0}
                  >
                    Download Attendance Report
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Report Summary</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Summary for {new Date(reportParams.year, reportParams.month - 1).toLocaleString('default', { month: 'long' })} {reportParams.year}
                </p>
              </div>
              <div className="p-6">
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Leave Requests</h4>
                <div className="overflow-x-auto mb-6">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Employee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Start Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">End Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {reportData.leaveRequests.map((req, index) => (
                        <tr key={index} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{req.userId?.name || 'Unknown'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{req.userId?.email || 'Unknown'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(req.startDate).toLocaleDateString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(req.endDate).toLocaleDateString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{req.status.charAt(0).toUpperCase() + req.status.slice(1)}</td>
                          <td className="px-6 py-4 text-sm text-slate-500">{req.reason || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h4 className="text-sm font-semibold text-slate-900 mb-2">Payroll</h4>
                <div className="overflow-x-auto mb-6">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Employee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Days Worked</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Salary ($)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {reportData.payroll.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.employee?.name || 'Unknown'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.employee?.email || 'Unknown'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.daysWorked}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${item.salary.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h4 className="text-sm font-semibold text-slate-900 mb-2">Attendance</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Employee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Days Worked</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Days Leaved</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Days Absent</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {reportData.attendance.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.employee?.name || 'Unknown'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.employee?.email || 'Unknown'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.daysWorked}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.daysLeaved}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.daysAbsent}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Reports