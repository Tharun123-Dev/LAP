// src/pages/reports/ReportsPage.jsx
import { useEffect, useState } from 'react'
import usePermission from '../../hooks/usePermission'
import ReportsDashboard from './Reportsdashboard'
import AttendanceReport from './AttendanceReport'
import LeaveReport      from './LeaveReport'
import PayrollReport    from './PayrollReport'
import HeadcountReport  from './HeadCountReport'

export default function ReportsPage({ forcedScope = null }) {
  const { can } = usePermission()
  const [tab, setTab] = useState('dashboard')
  const canViewAllReports = can('view_reports')
  const canSelfReports    = can('self_reports')
  const [scope, setScope] = useState(forcedScope || (canViewAllReports ? 'all' : 'self'))
  const activeScope = forcedScope || scope
  const showScopeSwitch = !forcedScope && canViewAllReports && canSelfReports

  const tabs = [
    { key: 'dashboard',  label: 'Overview',   show: canViewAllReports || canSelfReports },
    { key: 'attendance', label: 'Attendance', show: canViewAllReports || canSelfReports },
    { key: 'leave',      label: 'Leave',      show: canViewAllReports || canSelfReports },
    { key: 'payroll',    label: 'Payroll',    show: canViewAllReports || canSelfReports },
    { key: 'headcount',  label: 'Headcount',  show: canViewAllReports && activeScope !== 'self' },
  ].filter(t => t.show)

  useEffect(() => {
    if (!tabs.some(t => t.key === tab)) setTab(tabs[0]?.key || 'dashboard')
  }, [tabs, tab])

  useEffect(() => {
    if (forcedScope && scope !== forcedScope) setScope(forcedScope)
    else if (!forcedScope && !canViewAllReports && scope !== 'self') setScope('self')
  }, [canViewAllReports, forcedScope, scope])

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {showScopeSwitch && (
        <div style={{ display: 'flex', gap: '4px', background: '#e5e7eb', borderRadius: '9px', padding: '4px', width: 'fit-content', marginBottom: '14px' }}>
          {[
            { key: 'all', label: 'All Reports' },
            { key: 'self', label: 'Self Reports' },
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => setScope(opt.key)}
              style={{
                padding: '7px 14px',
                borderRadius: '7px',
                border: 'none',
                background: activeScope === opt.key ? '#1a1a2e' : 'transparent',
                color: activeScope === opt.key ? '#fff' : '#475569',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

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

      {tab === 'dashboard'  && <ReportsDashboard canViewAllReports={canViewAllReports} canSelfReports={canSelfReports} scope={activeScope} />}
      {tab === 'attendance' && <AttendanceReport scope={activeScope} />}
      {tab === 'leave'      && <LeaveReport scope={activeScope} />}
      {tab === 'payroll'    && <PayrollReport scope={activeScope} />}
      {tab === 'headcount'  && <HeadcountReport />}
    </div>
  )
}
