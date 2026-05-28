// src/pages/leave/LeavePage.jsx
// ── REPLACEMENT FILE ──
// Replace: Frontend/lap/src/pages/leave/LeavePage.jsx
// Change:  Added "🗓 Holidays" tab that renders <HolidayConfig />
//          It sits beside "⚙️ Leave Types" and is visible to anyone
//          who can configure_leave (same guard as Leave Types tab).

import { useState } from 'react'
import usePermission from '../../hooks/usePermission'
import BalanceDashboard  from './BalanceDashboard'
import ApplyLeave        from './ApplyLeave'
import MyRequests        from './MyRequests'
import LeaveApprovals    from './LeaveApprovals'
import LeaveTypeConfig   from './LeaveTypeConfig'
import HolidayConfig     from './HolidayConfig'   // ← NEW

export default function LeavePage() {
  const { can }       = usePermission()
  const [tab, setTab] = useState('balance')

  const tabs = [
    { key: 'balance',   label: '📊 Balance',      show: true },
    { key: 'apply',     label: '✏️ Apply',         show: can('apply_leave') },
    { key: 'my',        label: '📋 My Requests',  show: can('view_leave') },
    { key: 'approvals', label: '✅ Approvals',     show: can('approve_leave') },
    { key: 'config',    label: '⚙️ Leave Types',  show: can('configure_leave') },
    { key: 'holidays',  label: '🗓 Holidays',      show: can('configure_leave') },  // ← NEW
  ].filter((t) => t.show)

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Tab bar */}
      <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '4px', background: '#f3f4f6', borderRadius: '10px', padding: '4px', width: 'fit-content', minWidth: '100%' }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '8px 14px', borderRadius: '7px', border: 'none', whiteSpace: 'nowrap',
                background: tab === t.key ? '#fff' : 'transparent',
                color:      tab === t.key ? '#1a1a2e' : '#888',
                fontWeight: tab === t.key ? 600 : 400,
                fontSize: '13px', cursor: 'pointer',
                boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                flex: 1,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'balance'   && <BalanceDashboard />}
      {tab === 'apply'     && <ApplyLeave onApplied={() => setTab('my')} />}
      {tab === 'my'        && <MyRequests />}
      {tab === 'approvals' && <LeaveApprovals />}
      {tab === 'config'    && <LeaveTypeConfig />}
      {tab === 'holidays'  && <HolidayConfig />}
    </div>
  )
}