// src/pages/leave/LeaveApprovals.jsx
import { useEffect, useState } from 'react'
import { getAllRequestsApi, leaveActionApi, getLeavePriorUsageApi } from '../../api/services/leave'
import toast from 'react-hot-toast'

// ── Prior-usage confirmation modal ───────────────────────────────────────────
function PriorUsageModal({ data, note, onNoteChange, onConfirm, onCancel, loading }) {
  const hasPrior = data.has_prior

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '480px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 20px 14px',
          borderBottom: '1px solid #f0f0f0',
          background: hasPrior ? '#fffbeb' : '#f0fdf4',
        }}>
          <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: hasPrior ? '#b45309' : '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {hasPrior ? '⚠️  Prior Leave Found' : '✅  No Prior Leave This Month'}
          </p>
          <h3 style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: 700, color: '#111' }}>
            Approve {data.requested_days} day{data.requested_days !== 1 ? 's' : ''} of {data.leave_type}
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#888' }}>
            {data.employee_name} · {data.month}
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px' }}>

          {/* Annual balance bar */}
          {data.annual_balance && (() => {
            const bal = data.annual_balance
            const usedPct   = Math.min((bal.used   / bal.total) * 100, 100)
            const pendPct   = Math.min((bal.pending / bal.total) * 100, 100 - usedPct)
            return (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#555', textTransform: 'uppercase' }}>Annual Balance</span>
                  <span style={{ fontSize: '11px', color: '#888' }}>{bal.remaining} of {bal.total} days left</span>
                </div>
                <div style={{ height: '8px', borderRadius: '4px', background: '#f3f4f6', overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${usedPct}%`, background: '#6366f1', transition: 'width .3s' }} />
                  <div style={{ width: `${pendPct}%`, background: '#fbbf24', transition: 'width .3s' }} />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '5px' }}>
                  {[
                    { label: 'Used',    val: bal.used,    color: '#6366f1' },
                    { label: 'Pending', val: bal.pending, color: '#fbbf24' },
                    { label: 'Left',    val: bal.remaining, color: '#16a34a' },
                  ].map(({ label, val, color }) => (
                    <span key={label} style={{ fontSize: '10px', color: '#888' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '2px', background: color, marginRight: '3px', verticalAlign: 'middle' }} />
                      {label}: <b style={{ color: '#333' }}>{val}d</b>
                    </span>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Prior leaves table */}
          {data.is_compensatory && data.comp_off && (
            <div style={{ marginBottom: '16px', padding: '10px 12px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
              <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 700, color: '#1e40af' }}>
                Extra worked days available: {data.comp_off.available_days}
              </p>
              <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#3b82f6' }}>
                Worked on weekend/holiday: {data.comp_off.worked_days} day(s) · Used/Pending comp-off: {data.comp_off.used_or_pending_days} day(s)
              </p>
              {(data.comp_off.worked_dates || []).slice(0, 6).map(d => (
                <div key={d.date} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#1e3a8a', padding: '3px 0' }}>
                  <span>{d.date} · {d.type}</span>
                  <span>{d.check_in} → {d.check_out}</span>
                </div>
              ))}
            </div>
          )}

          {/* Prior leaves table */}
          {hasPrior ? (
            <div style={{ marginBottom: '16px' }}>
              <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 600, color: '#b45309' }}>
                Already taken {data.leave_type} this month ({data.total_prior_days} day{data.total_prior_days !== 1 ? 's' : ''}):
              </p>
              <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #fde68a' }}>
                {[...data.prior_approved, ...data.prior_pending].map((r, i) => (
                  <div key={r.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px',
                    background: i % 2 === 0 ? '#fffdf5' : '#fff',
                    borderBottom: i < data.prior_approved.length + data.prior_pending.length - 1 ? '1px solid #fde68a' : 'none',
                    fontSize: '12px',
                  }}>
                    <span style={{ color: '#555' }}>
                      {r.start_date === r.end_date ? r.start_date : `${r.start_date} → ${r.end_date}`}
                    </span>
                    <span style={{ fontWeight: 600, color: '#333' }}>{r.days}d</span>
                    <span style={{
                      fontSize: '10px', padding: '2px 7px', borderRadius: '10px', fontWeight: 600,
                      background: r.status === 'approved' ? '#dcfce7' : '#fef9c3',
                      color: r.status === 'approved' ? '#16a34a' : '#b45309',
                    }}>{r.status}</span>
                    <span style={{ color: '#aaa', fontSize: '10px' }}>Applied {r.applied_at}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: '16px', padding: '10px 12px', background: '#f0fdf4', borderRadius: '8px', fontSize: '12px', color: '#16a34a' }}>
              No other {data.leave_type} requests found for {data.month}.
            </div>
          )}

          {/* Note input */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#555', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>
              Approver Note (optional)
            </label>
            <textarea
              value={note}
              onChange={e => onNoteChange(e.target.value)}
              placeholder="Add a note visible to the employee..."
              rows={2}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '8px 10px', borderRadius: '7px',
                border: '1px solid #e5e7eb', fontSize: '13px',
                outline: 'none', resize: 'vertical', fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px 16px',
          borderTop: '1px solid #f0f0f0',
          display: 'flex', gap: '8px', justifyContent: 'flex-end',
        }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '8px 18px', borderRadius: '8px',
              border: '1px solid #e5e7eb', background: '#fff',
              fontSize: '13px', fontWeight: 500, cursor: 'pointer', color: '#555',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '8px 20px', borderRadius: '8px',
              border: 'none', background: '#16a34a',
              fontSize: '13px', fontWeight: 600, cursor: loading ? 'wait' : 'pointer',
              color: '#fff', opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Approving…' : hasPrior ? 'OK, Approve Anyway' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  )
}


// ── Main component ────────────────────────────────────────────────────────────
export default function LeaveApprovals() {
  const [requests,   setRequests]   = useState([])
  const [loading,    setLoading]    = useState(false)
  const [filter,     setFilter]     = useState('pending')

  // Prior-usage popup state
  const [popup,      setPopup]      = useState(null)   // { leaveId, data }
  const [popupNote,  setPopupNote]  = useState('')
  const [popupLoading, setPopupLoading] = useState(false)
  const [checkingId, setCheckingId] = useState(null)   // which card is loading

  useEffect(() => { load() }, [filter])

  const load = async () => {
    setLoading(true)
    try { const r = await getAllRequestsApi(filter); setRequests(r.data) }
    catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  // Called when approver clicks "Approve" — fetch prior usage first
  const handleApproveClick = async (req) => {
    setCheckingId(req.id)
    try {
      const res = await getLeavePriorUsageApi(req.id)
      setPopup({ leaveId: req.id, data: res.data })
      setPopupNote('')
    } catch {
      toast.error('Could not fetch leave history')
    } finally {
      setCheckingId(null)
    }
  }

  // Called from popup "OK, Approve" button
  const handleConfirmApprove = async () => {
    setPopupLoading(true)
    try {
      await leaveActionApi(popup.leaveId, 'approve', popupNote)
      toast.success('Leave approved!')
      setPopup(null)
      setPopupNote('')
      load()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Approval failed')
    } finally {
      setPopupLoading(false)
    }
  }

  // Reject directly (no popup needed)
  const handleReject = async (id) => {
    try {
      await leaveActionApi(id, 'reject', '')
      toast.success('Leave rejected')
      load()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Reject failed')
    }
  }

  const STATUS_LABELS = ['pending', 'approved', 'rejected', 'cancelled']

  const statusBadge = (s) => {
    const map = {
      pending:   { bg: '#fef9c3', color: '#b45309' },
      approved:  { bg: '#dcfce7', color: '#16a34a' },
      rejected:  { bg: '#fee2e2', color: '#dc2626' },
      cancelled: { bg: '#f3f4f6', color: '#6b7280' },
    }
    const { bg, color } = map[s] || { bg: '#f3f4f6', color: '#555' }
    return (
      <span style={{
        padding: '2px 9px', borderRadius: '10px', fontSize: '11px',
        fontWeight: 600, background: bg, color, textTransform: 'capitalize',
      }}>{s}</span>
    )
  }

  return (
    <div>
      {/* Popup */}
      {popup && (
        <PriorUsageModal
          data={popup.data}
          note={popupNote}
          onNoteChange={setPopupNote}
          onConfirm={handleConfirmApprove}
          onCancel={() => setPopup(null)}
          loading={popupLoading}
        />
      )}

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
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '6px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1a1a2e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                      {req.employee_name?.[0]}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: '#111' }}>{req.employee_name}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#aaa' }}>{req.emp_code}</p>
                    </div>
                    <span style={{ fontSize: '13px', color: '#6366f1', fontWeight: 600 }}>{req.leave_type_name}</span>
                    <span style={{ fontSize: '12px', color: '#888' }}>{req.days} day{req.days !== 1 ? 's' : ''}</span>
                    {statusBadge(req.status)}
                  </div>

                  <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#333' }}>
                    📅 {req.start_date}{req.start_date !== req.end_date ? ` → ${req.end_date}` : ''}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>Reason: {req.reason}</p>
                </div>

                {/* Pending actions */}
                {filter === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      onClick={() => handleReject(req.id)}
                      style={{ padding: '6px 14px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApproveClick(req)}
                      disabled={checkingId === req.id}
                      style={{
                        padding: '6px 14px', background: '#dcfce7', color: '#16a34a',
                        border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                        cursor: checkingId === req.id ? 'wait' : 'pointer',
                        opacity: checkingId === req.id ? 0.7 : 1,
                      }}
                    >
                      {checkingId === req.id ? 'Checking…' : 'Approve'}
                    </button>
                  </div>
                )}

                {/* Approved/rejected meta */}
                {filter !== 'pending' && req.approver_name && (
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#aaa' }}>by {req.approver_name}</p>
                    {req.approver_note && (
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#555', fontStyle: 'italic' }}>"{req.approver_note}"</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
