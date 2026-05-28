// src/pages/attendance/RegularizeModal.jsx
import { useState } from 'react'
import { applyRegularizationApi } from '../../api/services/attendance'
import toast from 'react-hot-toast'

export default function RegularizeModal({ record, date, onClose, onSaved }) {
  // Works two ways:
  //   record = existing AttendanceRecord object (from calendar click)
  //   date   = 'YYYY-MM-DD' string (from Today widget "Request for today" button)

  const [form, setForm] = useState({
    reason:             '',
    requested_checkin:  record?.check_in  || '',
    requested_checkout: record?.check_out || '',
    shift_type:         record?.shift_type || 'day',
  })
  const [saving, setSaving] = useState(false)
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const displayDate  = record?.date || date
  const currentCI    = record?.check_in  || '—'
  const currentCO    = record?.check_out || '—'
  const currentStatus = record?.status   || 'absent'
  const currentShift  = record?.shift_type || form.shift_type

  const handleSubmit = async () => {
    if (!form.reason.trim()) { toast.error('Reason is required'); return }

    setSaving(true)
    try {
      const payload = {
        reason:             form.reason,
        requested_checkin:  form.requested_checkin  || undefined,
        requested_checkout: form.requested_checkout || undefined,
        shift_type:         form.shift_type,
      }

      // Attach to the existing shift, or create the other shift for the same date.
      if (record?.id && form.shift_type === record?.shift_type) {
        payload.attendance_id = record.id
      } else {
        payload.date = displayDate
      }

      await applyRegularizationApi(payload)
      toast.success('Regularization request submitted!')
      onSaved()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to submit')
    } finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', width: '420px', fontFamily: 'Inter, sans-serif' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700 }}>Request Regularization</h3>
        <p style={{ margin: '0 0 20px', color: '#888', fontSize: '13px' }}>{displayDate}</p>

        {/* Current status */}
        <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px 16px', marginBottom: '18px', fontSize: '13px' }}>
          <p style={{ margin: 0, color: '#555' }}>
            Current: {currentCI} → {currentCO}
            <span style={{
              marginLeft: '8px', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
              background: '#e0f2fe', color: '#0369a1', textTransform: 'capitalize'
            }}>
              {currentShift} shift
            </span>
            <span style={{
              marginLeft: '8px', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
              background: '#fee2e2', color: '#991b1b', textTransform: 'capitalize'
            }}>
              {currentStatus.replace('_', ' ')}
            </span>
          </p>
          {!record && (
            <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#d97706' }}>
              ⚠ No attendance record found for this date — one will be created automatically.
            </p>
          )}
        </div>

        <label style={lbl}>Shift</label>
        <select
          value={form.shift_type}
          onChange={set('shift_type')}
          style={inp}
        >
          <option value="day">Day Shift</option>
          <option value="night">Night Shift</option>
        </select>

        <label style={{ ...lbl, marginTop: '12px' }}>Requested Check-in</label>
        <input
          type="time"
          value={form.requested_checkin}
          onChange={set('requested_checkin')}
          style={inp}
        />

        <label style={{ ...lbl, marginTop: '12px' }}>Requested Check-out</label>
        <input
          type="time"
          value={form.requested_checkout}
          onChange={set('requested_checkout')}
          style={inp}
        />

        <label style={{ ...lbl, marginTop: '12px' }}>Reason *</label>
        <textarea
          value={form.reason}
          onChange={set('reason')}
          style={{ ...inp, height: '80px', resize: 'vertical' }}
          placeholder="Explain why you need this correction..."
        />

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnCancel}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving} style={btnPrimary}>
            {saving ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  )
}

const lbl = { fontSize: '12px', color: '#555', fontWeight: 500, display: 'block', marginBottom: '5px' }
const inp = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', display: 'block' }
const btnPrimary = { padding: '9px 20px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }
const btnCancel  = { padding: '9px 18px', background: '#f3f4f6', color: '#333', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }
