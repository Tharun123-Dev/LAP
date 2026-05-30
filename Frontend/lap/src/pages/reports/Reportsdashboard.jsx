// src/pages/reports/ReportsDashboard.jsx
import { useEffect, useState } from 'react'
import { getReportsDashboardApi } from '../../api/services/reports'
import toast from 'react-hot-toast'

const MONTH_NAMES = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const fmt = v => `₹${parseFloat(v||0).toLocaleString('en-IN')}`

export default function ReportsDashboard({ canViewAllReports = false, canSelfReports = false, scope = 'all' }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getReportsDashboardApi({ scope })
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load report summary'))
      .finally(() => setLoading(false))
  }, [scope])

  if (loading) return <p style={{ color: '#888' }}>Loading...</p>
  if (!data)   return null

  const { attendance, leave, payroll, headcount } = data
  const canShowSelf = () => canSelfReports

  const sections = [
    {
      title: `Attendance - ${MONTH_NAMES[data.month]} ${data.year}`,
      color: '#10b981',
      show: canViewAllReports || canShowSelf(),
      items: [
        { label: 'Total Records', value: attendance.total_records, raw: true },
        { label: 'Present',       value: attendance.present,       raw: true },
        { label: 'Absent',        value: attendance.absent,        raw: true },
        { label: 'Late',          value: attendance.late,          raw: true },
        { label: 'On Leave',      value: attendance.on_leave,      raw: true },
      ],
    },
    {
      title: `Leave - ${MONTH_NAMES[data.month]} ${data.year}`,
      color: '#f59e0b',
      show: canViewAllReports || canShowSelf(),
      items: [
        { label: 'Total Requests', value: leave.total_requests, raw: true },
        { label: 'Approved',       value: leave.approved,       raw: true },
        { label: 'Pending',        value: leave.pending,        raw: true },
        { label: 'Rejected',       value: leave.rejected,       raw: true },
      ],
    },
    {
      title: payroll.last_month
        ? `Payroll - ${MONTH_NAMES[payroll.last_month]} ${payroll.last_year}`
        : 'Payroll',
      color: '#6366f1',
      show: canViewAllReports || canShowSelf(),
      items: [
        { label: 'Total Gross',  value: fmt(payroll.total_gross), raw: true },
        { label: 'Total Net',    value: fmt(payroll.total_net),   raw: true },
        { label: 'Employees',    value: payroll.employees,        raw: true },
        { label: 'Status',       value: payroll.status || 'N/A',  raw: true },
      ],
    },
    {
      title: 'Headcount',
      color: '#0ea5e9',
      show: canViewAllReports && scope !== 'self',
      items: [
        { label: 'Total Active', value: headcount.total_active, raw: true },
        ...Object.entries(headcount.by_role || {}).map(([role, count]) => ({
          label: role.charAt(0).toUpperCase() + role.slice(1),
          value: count, raw: true,
        })),
      ],
    },
  ].filter(section => section.show)

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: '16px' }}>
        {sections.map(sec => (
          <div key={sec.title} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', background: sec.color, color: '#fff' }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>{sec.title}</p>
            </div>
            <div style={{ padding: '16px' }}>
              {sec.items.map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '12px', color: '#666' }}>{item.label}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
