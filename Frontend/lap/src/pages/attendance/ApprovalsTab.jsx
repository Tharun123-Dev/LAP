// src/pages/attendance/ApprovalsTab.jsx
import { useEffect, useState } from 'react'
import { getAllRegularizationsApi, actionRegularizationApi } from '../../api/services/attendance'
import toast from 'react-hot-toast'

export default function ApprovalsTab() {
  const [regs,       setRegs]       = useState([])
  const [loading,    setLoading]    = useState(false)
  const [filter,     setFilter]     = useState('pending')
  const [actionId,   setActionId]   = useState(null)
  const [noteInput,  setNoteInput]  = useState('')

  useEffect(() => { load() }, [filter])

  const load = async () => {
    setLoading(true)
    try { const r = await getAllRegularizationsApi(filter); setRegs(r.data) }
    catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  const handleAction = async (id, action) => {
    try {
      await actionRegularizationApi(id, action, noteInput)
      toast.success(`Request ${action}d`)
      setActionId(null)
      setNoteInput('')
      load()
    } catch { toast.error('Action failed') }
  }

  const FILTER_TABS = ['pending', 'approved', 'rejected']

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111' }}>Regularization Approvals</h3>
        <div style={{ display: 'flex', gap: '6px' }}>
          {FILTER_TABS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                background: filter === f ? '#1a1a2e' : '#f3f4f6',
                color: filter === f ? '#fff' : '#555',
                fontSize: '12px', fontWeight: 500, textTransform: 'capitalize',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#888' }}>Loading...</p>
      ) : regs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#aaa', background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          No {filter} requests
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {regs.map(reg => (
            <div key={reg.id} style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, color: '#111' }}>{reg.employee_name}</span>
                    <code style={{ background: '#f3f4f6', padding: '1px 7px', borderRadius: '4px', fontSize: '11px' }}>{reg.emp_code}</code>
                    <span style={{ color: '#888', fontSize: '13px' }}>{reg.date}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#555' }}>
                    Current: <strong>{reg.current_checkin || '—'} → {reg.current_checkout || '—'}</strong>
                    <span style={{ margin: '0 8px', color: '#ddd' }}>|</span>
                    Requested: <strong style={{ color: '#1d4ed8' }}>{reg.requested_checkin || '—'} → {reg.requested_checkout || '—'}</strong>
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#888' }}>Reason: {reg.reason}</p>
                </div>

                {filter === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button
                      onClick={() => setActionId(actionId === reg.id ? null : reg.id)}
                      style={{ padding: '6px 14px', background: '#f3f4f6', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Add Note
                    </button>
                    <button
                      onClick={() => handleAction(reg.id, 'reject')}
                      style={{ padding: '6px 14px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleAction(reg.id, 'approve')}
                      style={{ padding: '6px 14px', background: '#dcfce7', color: '#16a34a', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Approve
                    </button>
                  </div>
                )}
              </div>

              {actionId === reg.id && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <input
                    value={noteInput}
                    onChange={e => setNoteInput(e.target.value)}
                    placeholder="Add a note (optional)..."
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px', outline: 'none' }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}