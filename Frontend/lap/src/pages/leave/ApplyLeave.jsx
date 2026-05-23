// src/pages/leave/ApplyLeave.jsx
import { useEffect, useState } from 'react'
import { getLeaveTypesApi, applyLeaveApi, getMyBalanceApi } from '../../api/services/leave'
import toast from 'react-hot-toast'

export default function ApplyLeave({ onApplied }) {
  const [types,   setTypes]   = useState([])
  const [balance, setBalance] = useState([])
  const [saving,  setSaving]  = useState(false)
  const [form,    setForm]    = useState({
    leave_type: '', start_date: '', end_date: '',
    session: 'full', reason: '', doc_url: '',
  })
  const [days, setDays] = useState(0)

  useEffect(() => {
    getLeaveTypesApi().then(r => setTypes(r.data)).catch(() => {})
    getMyBalanceApi(new Date().getFullYear()).then(r => setBalance(r.data)).catch(() => {})
  }, [])

  // Auto-calculate days when dates/session change
  useEffect(() => {
    if (!form.start_date || !form.end_date) { setDays(0); return }
    const start = new Date(form.start_date)
    const end   = new Date(form.end_date)
    if (end < start) { setDays(0); return }
    if (form.session !== 'full') { setDays(0.5); return }
    let count = 0
    const cur = new Date(start)
    while (cur <= end) {
      if (cur.getDay() !== 0 && cur.getDay() !== 6) count++
      cur.setDate(cur.getDate() + 1)
    }
    setDays(count)
  }, [form.start_date, form.end_date, form.session])

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  // Get remaining balance for selected leave type
  const selectedBalance = balance.find(b => b.leave_type === parseInt(form.leave_type))
  const remaining       = selectedBalance ? parseFloat(selectedBalance.remaining) : null
  const insufficient    = remaining !== null && days > remaining

  const handleSubmit = async () => {
    if (!form.leave_type || !form.start_date || !form.end_date || !form.reason.trim()) {
      toast.error('Please fill all required fields')
      return
    }
    if (new Date(form.end_date) < new Date(form.start_date)) {
      toast.error('End date cannot be before start date')
      return
    }
    if (insufficient) {
      toast.error('Insufficient leave balance')
      return
    }
    setSaving(true)
    try {
      console.log(form)
      await applyLeaveApi(form)
      toast.success('Leave request submitted!')
      onApplied()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to apply')
    } finally { setSaving(false) }
  }

  const selectedType = types.find(t => t.id === parseInt(form.leave_type))

  return (
    <div style={{ maxWidth: '600px' }}>
      <h3 style={{ margin: '0 0 20px', fontSize: '17px', fontWeight: 700, color: '#111' }}>Apply for Leave</h3>

      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e5e7eb', padding: '24px' }}>

        {/* Leave Type */}
        <div style={fieldWrap}>
          <label style={lbl}>Leave Type *</label>
          <select value={form.leave_type} onChange={set('leave_type')} style={inp}>
            <option value="">Select leave type</option>
            {types.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
            ))}
          </select>
        </div>

        {/* Balance info for selected type */}
        {selectedBalance && (
          <div style={{ background: insufficient ? '#fef2f2' : '#f0fdf4', border: `1px solid ${insufficient ? '#fecaca' : '#bbf7d0'}`, borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px' }}>
            <span style={{ color: insufficient ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
              {insufficient ? '⚠ Insufficient balance' : '✓ Balance available'}
            </span>
            <span style={{ color: '#555', marginLeft: '8px' }}>
              Available: <strong>{selectedBalance.remaining}</strong> days
              {days > 0 && <> · Requesting: <strong style={{ color: insufficient ? '#dc2626' : '#1d4ed8' }}>{days}</strong> days</>}
            </span>
          </div>
        )}

        {/* Document notice */}
        {selectedType?.requires_document && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '12px', color: '#92400e' }}>
            📎 This leave type requires a supporting document (medical certificate, etc.)
          </div>
        )}

        {/* Notice period */}
        {selectedType?.min_notice_days > 0 && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '12px', color: '#1e40af' }}>
            🗓 Requires {selectedType.min_notice_days} day(s) advance notice
          </div>
        )}

        {/* Dates row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '16px' }}>
          <div>
            <label style={lbl}>Start Date *</label>
            <input type="date" value={form.start_date} onChange={set('start_date')} style={inp} min={new Date().toISOString().split('T')[0]} />
          </div>
          <div>
            <label style={lbl}>End Date *</label>
            <input type="date" value={form.end_date} onChange={set('end_date')} style={inp} min={form.start_date || new Date().toISOString().split('T')[0]} />
          </div>
        </div>

        {/* Session */}
        <div style={fieldWrap}>
          <label style={lbl}>Session</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { val: 'full',        label: 'Full Day' },
              { val: 'first_half',  label: 'First Half' },
              { val: 'second_half', label: 'Second Half' },
            ].map(s => (
              <button
                key={s.val}
                onClick={() => setForm(p => ({ ...p, session: s.val }))}
                style={{
                  padding: '7px 16px', borderRadius: '8px', border: '1px solid',
                  borderColor: form.session === s.val ? '#1a1a2e' : '#ddd',
                  background: form.session === s.val ? '#1a1a2e' : '#fff',
                  color: form.session === s.val ? '#fff' : '#555',
                  fontSize: '13px', cursor: 'pointer', fontWeight: form.session === s.val ? 600 : 400,
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Days calculated */}
        {days > 0 && (
          <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#333' }}>
            🗓 <strong>{days} working day{days !== 1 ? 's' : ''}</strong> will be deducted
          </div>
        )}

        {/* Reason */}
        <div style={fieldWrap}>
          <label style={lbl}>Reason *</label>
          <textarea
            value={form.reason}
            onChange={set('reason')}
            placeholder="Brief reason for leave..."
            style={{ ...inp, height: '80px', resize: 'vertical' }}
          />
        </div>

        {/* Doc URL */}
        {selectedType?.requires_document && (
          <div style={fieldWrap}>
            <label style={lbl}>Document URL</label>
            <input value={form.doc_url} onChange={set('doc_url')} placeholder="https://drive.google.com/..." style={inp} />
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={saving || insufficient}
          style={{
            width: '100%', padding: '13px',
            background: insufficient ? '#e5e7eb' : saving ? '#999' : '#1a1a2e',
            color: insufficient ? '#aaa' : '#fff',
            border: 'none', borderRadius: '10px',
            fontSize: '14px', fontWeight: 700, cursor: insufficient || saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Submitting...' : 'Submit Leave Request'}
        </button>
      </div>
    </div>
  )
}

const fieldWrap = { marginBottom: '16px' }
const lbl = { fontSize: '12px', color: '#555', fontWeight: 500, display: 'block', marginBottom: '5px' }
const inp = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', display: 'block' }