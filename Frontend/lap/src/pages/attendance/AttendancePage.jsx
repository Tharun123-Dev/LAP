// src/pages/attendance/AttendancePage.jsx
import { useState } from 'react'
import usePermission from '../../hooks/usePermission'
import TodayWidget from './TodayWidget'
import MonthlyView from './MonthlyView'
import RegularizationTab from './RegularizationTab'
import ApprovalsTab from './ApprovalsTab'

const TABS = [
  { key: 'today',     label: '📍 Today' },
  { key: 'monthly',   label: '📅 Monthly' },
  { key: 'regularize', label: '📝 My Requests' },
]

const MANAGER_TAB = { key: 'approvals', label: '✅ Approvals' }

export default function AttendancePage() {
  const { can }       = usePermission()
  const [tab, setTab] = useState('today')

  const tabs = can('approve_regularize')
    ? [...TABS, MANAGER_TAB]
    : TABS

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: '#f3f4f6', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 18px', borderRadius: '7px', border: 'none',
              background: tab === t.key ? '#fff' : 'transparent',
              color: tab === t.key ? '#1a1a2e' : '#888',
              fontWeight: tab === t.key ? 600 : 400,
              fontSize: '13px', cursor: 'pointer',
              boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'today'      && <TodayWidget />}
      {tab === 'monthly'    && <MonthlyView />}
      {tab === 'regularize' && <RegularizationTab />}
      {tab === 'approvals'  && <ApprovalsTab />}
    </div>
  )
}