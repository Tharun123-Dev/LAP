// src/pages/leave/LeaveApprovals.jsx
import { useEffect, useState } from 'react'
import { getAllRequestsApi, leaveActionApi } from '../../api/services/leave'
import toast from 'react-hot-toast'

export default function LeaveApprovals() {
  const [requests, setRequests] = useState([])
  const [loading,  setLoading]  = useState(false)
  const [filter,   setFilter]   = useState('pending')
  const [actionId, setActionId] = useState(null)
  const [note,     setNote]     = useState('')

  useEffect(() => { load() }, [filter])

  const load = async () => {
    setLoading(true)
    try { const r = await getAllRequestsApi(filter); setRequests(r.data) }
    catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  const handleAction = async (id, action) => {
    try {
      await leaveActionApi(id, action, note)
      toast.success(`Leave ${action}d!`)
      setActionId(null)
      setNote('')
      load()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Action failed')
    }
  }

  const STATUS_LABELS = ['pending', 'approved', 'rejected', 'cancelled']

  return (
    <div>
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {STATUS_LABELS.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: '6px 16px', borderRadius: '20px', border: '1px solid',
              borderColor: filter === s ? '#1a1a2e' : '#e5e7eb',
              background: filter === s ? '#1a1a2e' : '#fff',
              color: filter === s ? '#fff' : '#555',
              fontSize: '12px', fontWeight: 500, cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: '#888' }}>Loading...</p>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#aaa', background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          No {filter} requests
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {requests.map(req => (
            <div key={req.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px 20px' }}>
              {/* Top row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '6px' }}>
                    {/* Avatar */}
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1a1a2e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                      {req.employee_name?.[0]}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: '#111' }}>{req.employee_name}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#aaa' }}>{req.emp_code}</p>
                    </div>
                    <span style={{ fontSize: '13px', color: '#6366f1', fontWeight: 600 }}>{req.leave_type_name}</span>
                    <span style={{ fontSize: '12px', color: '#888' }}>{req.days} day{req.days !== 1 ? 's' : ''}</span>
                  </div>

                  <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#333' }}>
                    📅 {req.start_date} {req.start_date !== req.end_date ? `→ ${req.end_date}` : ''}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>Reason: {req.reason}</p>
                </div>

                {/* Actions */}
                {filter === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      onClick={() => setActionId(actionId === req.id ? null : req.id)}
                      style={{ padding: '6px 12px', background: '#f3f4f6', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                    >
                      💬 Note
                    </button>
                    <button
                      onClick={() => handleAction(req.id, 'reject')}
                      style={{ padding: '6px 14px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleAction(req.id, 'approve')}
                      style={{ padding: '6px 14px', background: '#dcfce7', color: '#16a34a', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Approve
                    </button>
                  </div>
                )}

                {filter !== 'pending' && (
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#aaa' }}>
                      by {req.approver_name || '—'}
                    </p>
                    {req.approver_note && (
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#555', fontStyle: 'italic' }}>
                        "{req.approver_note}"
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Note input expander */}
              {actionId === req.id && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Add a note before approving/rejecting..."
                    style={{ flex: 1, minWidth: '200px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px', outline: 'none' }}
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