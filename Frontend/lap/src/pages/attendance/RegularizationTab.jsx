// src/pages/attendance/RegularizationTab.jsx
import { useEffect, useState } from 'react'
import { getMyRegularizationsApi } from '../../api/services/attendance'
import toast from 'react-hot-toast'

const STATUS_STYLE = {
  pending:  { bg: '#fef9c3', color: '#854d0e' },
  approved: { bg: '#dcfce7', color: '#166534' },
  rejected: { bg: '#fee2e2', color: '#991b1b' },
}

export default function RegularizationTab() {
  const [regs,    setRegs]    = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getMyRegularizationsApi()
      .then(r => setRegs(r.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p style={{ color: '#888' }}>Loading...</p>

  return (
    <div>
      <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: '#111' }}>My Regularization Requests</h3>
      {regs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#aaa', background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          No regularization requests yet.<br />
          <span style={{ fontSize: '13px' }}>Go to Monthly view and click a day to request.</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {regs.map(reg => {
            const st = STATUS_STYLE[reg.status]
            return (
              <div key={reg.id} style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, color: '#111', fontSize: '14px' }}>{reg.date}</span>
                    <span style={{ padding: '2px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: st.bg, color: st.color, textTransform: 'capitalize' }}>
                      {reg.status}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#555' }}>
                    Current: {reg.current_checkin || '—'} → {reg.current_checkout || '—'}
                    {(reg.requested_checkin || reg.requested_checkout) && (
                      <span style={{ marginLeft: '8px', color: '#1d4ed8' }}>
                        Requested: {reg.requested_checkin || '—'} → {reg.requested_checkout || '—'}
                      </span>
                    )}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#888' }}>Reason: {reg.reason}</p>
                  {reg.approver_note && (
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: reg.status === 'approved' ? '#166534' : '#991b1b' }}>
                      Note: {reg.approver_note}
                    </p>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: '11px', color: '#aaa', whiteSpace: 'nowrap' }}>
                  {new Date(reg.created_at).toLocaleDateString('en-IN')}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}