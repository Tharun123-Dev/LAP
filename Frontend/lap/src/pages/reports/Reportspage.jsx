// src/pages/reports/ReportsPage.jsx
import { useState } from 'react'
import usePermission from '../../hooks/usePermission'
import ReportsDashboard from './ReportsDashboard'
import AttendanceReport from './AttendanceReport'
import LeaveReport      from './LeaveReport'
import PayrollReport    from './PayrollReport'
import HeadcountReport  from './HeadcountReport'

export default function ReportsPage() {
  const { can }       = usePermission()
  const [tab, setTab] = useState('dashboard')

  const tabs = [
    { key: 'dashboard',  label: '📊 Overview',   show: true },
    { key: 'attendance', label: '📅 Attendance',  show: true },
    { key: 'leave',      label: '🌴 Leave',       show: true },
    { key: 'payroll',    label: '💰 Payroll',     show: can('view_payroll') },
    { key: 'headcount',  label: '👥 Headcount',   show: true },
  ].filter(t => t.show)

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Tab bar */}
      <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '4px', background: '#f3f4f6', borderRadius: '10px', padding: '4px', width: 'fit-content', minWidth: '100%' }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '8px 14px', borderRadius: '7px', border: 'none',
                background: tab === t.key ? '#fff' : 'transparent',
                color: tab === t.key ? '#1a1a2e' : '#888',
                fontWeight: tab === t.key ? 600 : 400,
                fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap',
                boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                flex: 1,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'dashboard'  && <ReportsDashboard />}
      {tab === 'attendance' && <AttendanceReport />}
      {tab === 'leave'      && <LeaveReport />}
      {tab === 'payroll'    && <PayrollReport />}
      {tab === 'headcount'  && <HeadcountReport />}
    </div>
  )
}