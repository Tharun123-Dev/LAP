// src/api/services/reports.js
import api from '../axios'

export const getReportsDashboardApi = ()  => api.get('/reports/dashboard/')
export const getAttendanceReportApi = (p) => api.get('/reports/attendance/', { params: p })
export const getLeaveReportApi      = (p) => api.get('/reports/leave/',      { params: p })
export const getPayrollReportApi    = (p) => api.get('/reports/payroll/',    { params: p })
export const getHeadcountReportApi  = (p) => api.get('/reports/headcount/', { params: p })
export const getLopReportApi        = (p) => api.get('/reports/lop/',       { params: p })
export const getOvertimeReportApi   = (p) => api.get('/reports/overtime/',  { params: p })

export const downloadReportCsv = (type, params) => {
  const token = localStorage.getItem('access')
  const query = new URLSearchParams({ ...params, format: 'csv' }).toString()
  const url   = `http://localhost:8000/api/reports/${type}/?${query}`

  // const url   = `https://lap-b9vi.onrender.com/api/reports/${type}/?${query}`
  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then(r => r.blob())
    .then(blob => {
      const link    = document.createElement('a')
      link.href     = URL.createObjectURL(blob)
      link.download = `${type}_report.csv`
      link.click()
      URL.revokeObjectURL(link.href)
    })
}