// src/pages/leave/MyRequests.jsx
import { useEffect, useState } from 'react'
import { getMyRequestsApi, cancelLeaveApi } from '../../api/services/leave'
import toast from 'react-hot-toast'

const STATUS = {
  pending:   { bg: '#fef9c3', color: '#854d0e', dot: '#f59e0b' },
  approved:  { bg: '#dcfce7', color: '#166534', dot: '#16a34a' },
  rejected:  { bg: '#fee2e2', color: '#991b1b', dot: '#dc2626' },
  cancelled: { bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af' },
}

export default function MyRequests() {
  const [requests, setRequests] = useState([])
  const [loading,  setLoading]  = useState(false)
  const [filter,   setFilter]   = useState('')

  useEffect(() => { load() }, [filter])

  const load = async () => {
    setLoading(true)
    try { const r = await getMyRequestsApi(filter || undefined); setRequests(r.data) }
    catch { toast.error('Failed to load requests') }
    finally { setLoading(false) }
  }

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this leave request?')) return
    try {
      await cancelLeaveApi(id)
      toast.success('Leave request cancelled')
      load()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Cannot cancel')
    }
  }

  const FILTERS = [
    { val: '',          label: 'All' },
    { val: 'pending',   label: 'Pending' },
    { val: 'approved',  label: 'Approved' },
    { val: 'rejected',  label: 'Rejected' },
    { val: 'cancelled', label: 'Cancelled' },
  ]

  return (
    <div>
      {/* Filter pills */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button
            key={f.val}
            onClick={() => setFilter(f.val)}
            style={{
              padding: '6px 14px', borderRadius: '20px', border: '1px solid',
              borderColor: filter === f.val ? '#1a1a2e' : '#e5e7eb',
              background: filter === f.val ? '#1a1a2e' : '#fff',
              color: filter === f.val ? '#fff' : '#555',
              fontSize: '12px', fontWeight: 500, cursor: 'pointer',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: '#888' }}>Loading...</p>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#aaa', background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '32px', margin: '0 0 10px' }}>🌴</p>
          <p style={{ margin: 0, fontSize: '14px' }}>No leave requests found</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {requests.map(req => {
            const st = STATUS[req.status] || STATUS.pending
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const startDate = new Date(req.start_date)

            // Cancel allowed: pending always, approved only if leave hasn't started yet
            const canCancel = req.status === 'pending' ||
              (req.status === 'approved' && startDate > today)

            return (
              <div
                key={req.id}
                style={{
                  background: '#fff', borderRadius: '12px',
                  border: '1px solid #e5e7eb', padding: '16px 20px',
                  display: 'flex', flexWrap: 'wrap', gap: '16px',
                  justifyContent: 'space-between', alignItems: 'flex-start',
                }}
              >
                <div style={{ flex: 1, minWidth: '200px' }}>
                  {/* Header row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#111' }}>{req.leave_type_name}</span>
                    <span style={{
                      padding: '2px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 600,
                      background: st.bg, color: st.color,
                      display: 'flex', alignItems: 'center', gap: '4px',
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: st.dot, display: 'inline-block' }} />
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </span>
                    <span style={{ fontSize: '12px', color: '#888' }}>{req.days} day{req.days !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Dates */}
                  <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#333' }}>
                    📅 {req.start_date} {req.start_date !== req.end_date ? `→ ${req.end_date}` : ''}
                    {req.session !== 'full' && (
                      <span style={{ marginLeft: '6px', fontSize: '11px', color: '#6366f1', fontWeight: 500 }}>
                        ({req.session.replace('_', ' ')})
                      </span>
                    )}
                  </p>

                  {/* Reason */}
                  <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#888' }}>Reason: {req.reason}</p>

                  {/* Approved by — shown for approved and rejected */}
                  {req.approver_name && (
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#166534', fontWeight: 500 }}>
                      ✅ {req.status === 'approved' ? 'Approved' : 'Reviewed'} by {req.approver_name}
                    </p>
                  )}

                  {/* Approver note */}
                  {req.approver_note && (
                    <p style={{
                      margin: '4px 0 0', fontSize: '12px',
                      color: req.status === 'approved' ? '#166534' : '#991b1b',
                      fontStyle: 'italic',
                    }}>
                      💬 {req.approver_note}
                    </p>
                  )}
                </div>

                {/* Actions + date */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <p style={{ margin: 0, fontSize: '11px', color: '#aaa' }}>
                    {new Date(req.applied_at).toLocaleDateString('en-IN')}
                  </p>

                  {canCancel && (
                    <button
                      onClick={() => handleCancel(req.id)}
                      style={{
                        padding: '5px 12px',
                        background: req.status === 'approved' ? '#fff7ed' : '#fee2e2',
                        color: req.status === 'approved' ? '#c2410c' : '#dc2626',
                        border: `1px solid ${req.status === 'approved' ? '#fed7aa' : '#fecaca'}`,
                        borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      {req.status === 'approved' ? 'Withdraw' : 'Cancel'}
                    </button>
                  )}

                  {/* Approved leave that has already started — no cancel, show locked state */}
                  {req.status === 'approved' && !canCancel && (
                    <span style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic' }}>
                      Leave in progress
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}