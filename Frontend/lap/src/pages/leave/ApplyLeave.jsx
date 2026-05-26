'JSXEOF'
// src/pages/leave/ApplyLeave.jsx
import { useEffect, useState } from 'react'
import { getLeaveTypesApi, applyLeaveApi, getMyBalanceApi } from '../../api/services/leave'
import systemSettingsService from '../../api/services/systemsettings'
import toast from 'react-hot-toast'

const DAY_NAMES = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']

export default function ApplyLeave({ onApplied }) {
  const [types,          setTypes]          = useState([])
  const [balance,        setBalance]        = useState([])
  const [saving,         setSaving]         = useState(false)
  const [form,           setForm]           = useState({ leave_type: '', start_date: '', end_date: '', session: 'full', reason: '', doc_url: '' })
  const [days,           setDays]           = useState(0)
  const [weekendDays,    setWeekendDays]    = useState(['saturday','sunday'])
  const [halfDayEnabled, setHalfDayEnabled] = useState(true)
  const [clMonthCap,     setClMonthCap]     = useState(0)
  const [slDocDays,      setSlDocDays]      = useState(2)


  useEffect(() => {
    getLeaveTypesApi().then(r => setTypes(r.data)).catch(() => {})
    getMyBalanceApi(new Date().getFullYear()).then(r => setBalance(r.data)).catch(() => {})

    systemSettingsService.getAll().then(res => {
      const all = Object.values(res.data).flat()
      const find = key => all.find(s => s.key === key)

      const wknd = find('weekend_days')
      if (wknd) { try { setWeekendDays(JSON.parse(wknd.value)) } catch {} }

      const halfDay = find('half_day_leave_enabled')
      if (halfDay) setHalfDayEnabled(halfDay.value === 'true')

      const cap = find('cl_monthly_cap')
      if (cap) setClMonthCap(parseInt(cap.value) || 0)

      const slDoc = find('sl_doc_required_after_days')
      if (slDoc) setSlDocDays(parseInt(slDoc.value) || 2)

    
    }).catch(() => {})
  }, [])

  const isWorkingDay = (d) => !weekendDays.includes(DAY_NAMES[d.getDay()])

  // Count working days between two dates (inclusive)
  const countWorkingDays = (from, to) => {
    let count = 0
    const cur = new Date(from)
    while (cur <= to) {
      if (isWorkingDay(cur)) count++
      cur.setDate(cur.getDate() + 1)
    }
    return count
  }

  // Recalculate days whenever dates / session / weekendDays change
  useEffect(() => {
    if (!form.start_date || !form.end_date) { setDays(0); return }
    const start = new Date(form.start_date)
    const end   = new Date(form.end_date)
    if (end < start) { setDays(0); return }
    if (form.session !== 'full') { setDays(0.5); return }
    setDays(countWorkingDays(start, end))
  }, [form.start_date, form.end_date, form.session, weekendDays])

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const selectedBal  = balance.find(b => b.leave_type_id === parseInt(form.leave_type) || b.leave_type === parseInt(form.leave_type))
  const remaining    = selectedBal ? parseFloat(selectedBal.remaining) : null
  const cfRemaining  = selectedBal ? parseFloat(selectedBal.cf_remaining || 0) : 0
  const thisYearRem  = selectedBal ? parseFloat(selectedBal.this_year_remaining || 0) : 0
  const insufficient = remaining !== null && days > remaining
  const selectedType = types.find(t => t.id === parseInt(form.leave_type))

  const needsDoc    = selectedType?.code === 'SL' && days > slDocDays
  const isClOverCap = selectedType?.code === 'CL' && clMonthCap > 0

  // ── Advance notice validation ─────────────────────────────────────────────
 // Fully dynamic from LeaveTypeConfig only
const getAdvanceNoticeRequired = () => {
  if (!selectedType) return 0

  return Number(
    selectedType.min_notice_days || 0
  )
}

  const advanceNoticeRequired = getAdvanceNoticeRequired()

  const getNoticeDaysFromToday = () => {
    if (!form.start_date) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const start = new Date(form.start_date)
    if (start <= today) return 0
    return countWorkingDays(today, start) - 1 // exclude start date itself
  }

  const noticeDaysFromToday   = getNoticeDaysFromToday()
  const noticeViolation       = advanceNoticeRequired > 0 &&
                                noticeDaysFromToday !== null &&
                                noticeDaysFromToday < advanceNoticeRequired

  const handleSubmit = async () => {
    if (!form.leave_type || !form.start_date || !form.end_date || !form.reason.trim()) {
      toast.error('Please fill all required fields')
      return
    }
    if (new Date(form.end_date) < new Date(form.start_date)) {
      toast.error('End date cannot be before start date')
      return
    }
    if (insufficient) { toast.error('Insufficient leave balance'); return }
    if (noticeViolation) {
      toast.error(`${selectedType.name} requires ${advanceNoticeRequired} working day(s) advance notice.`)
      return
    }

    setSaving(true)
    try {
      await applyLeaveApi(form)
      toast.success('Leave request submitted!')
      onApplied()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to apply')
    } finally {
      setSaving(false)
    }
  }

  const submitDisabled = saving || insufficient || !form.leave_type || noticeViolation

  return (
    <div style={{ maxWidth: '600px' }}>
      <h3 style={{ margin: '0 0 20px', fontSize: '17px', fontWeight: 700, color: '#111' }}>Apply for Leave</h3>

      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e5e7eb', padding: '24px' }}>

        {/* Leave Type */}
        <div style={fw}>
          <label style={lbl}>Leave Type *</label>
          <select value={form.leave_type} onChange={set('leave_type')} style={sel}>
            <option value="">— Select leave type —</option>
            {types.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.code}){!t.is_paid ? ' — Unpaid' : ''}</option>
            ))}
          </select>
        </div>

        {/* Advance notice info banner — shown when a type is selected with notice requirement */}
        {selectedType && advanceNoticeRequired > 0 && (
          <div style={{
            padding: '10px 14px',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#1d4ed8',
            fontWeight: 500,
          }}>
            ℹ️ <strong>{selectedType.name}</strong> requires <strong>{advanceNoticeRequired} working day(s)</strong> advance notice before the leave date.
          </div>
        )}

        {/* Balance card for selected type */}
        {selectedBal && (
          <div style={{ background: remaining <= 2 ? '#fff7ed' : '#f0fdf4', borderRadius: '10px', border: `1px solid ${remaining <= 2 ? '#fed7aa' : '#bbf7d0'}`, padding: '12px 16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>Available Balance</p>
                <p style={{ margin: '4px 0 0', fontSize: '22px', fontWeight: 800, color: remaining <= 2 ? '#ea580c' : '#16a34a' }}>
                  {remaining} days
                </p>
              </div>
              <div style={{ textAlign: 'right', fontSize: '11px', color: '#888' }}>
                {cfRemaining > 0 && (
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '4px 8px', marginBottom: '4px', color: '#1d4ed8', fontWeight: 600 }}>
                    🔄 {cfRemaining} days carried forward from last year
                  </div>
                )}
                <div>This year: {thisYearRem} days | Used: {selectedBal.used} | Pending: {selectedBal.pending}</div>
                <div>Total allocated: {selectedBal.total} days</div>
              </div>
            </div>
            {remaining <= 2 && remaining > 0 && (
              <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#ea580c', fontWeight: 600 }}>⚠ Low balance — only {remaining} day(s) remaining</p>
            )}
          </div>
        )}

        {/* Dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
          <div>
            <label style={lbl}>Start Date *</label>
            <input type="date" value={form.start_date} onChange={set('start_date')} style={inp} />
          </div>
          <div>
            <label style={lbl}>End Date *</label>
            <input type="date" value={form.end_date} min={form.start_date} onChange={set('end_date')} style={inp} />
          </div>
        </div>

        {/* Advance notice violation warning */}
        {noticeViolation && form.start_date && (
          <div style={{
            padding: '10px 14px',
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#dc2626',
            fontWeight: 500,
          }}>
            🚫 <strong>{selectedType?.name}</strong> requires <strong>{advanceNoticeRequired} working day(s)</strong> advance notice.
            {' '}You have only <strong>{noticeDaysFromToday} working day(s)</strong> before this date.
            {' '}Please select a date at least <strong>{advanceNoticeRequired} working day(s)</strong> from today.
          </div>
        )}

        {/* Session — only if half day enabled in settings */}
        {halfDayEnabled && (
          <div style={fw}>
            <label style={lbl}>Session</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { val: 'full',        label: 'Full Day' },
                { val: 'first_half',  label: 'First Half' },
                { val: 'second_half', label: 'Second Half' },
              ].map(o => (
                <button
                  key={o.val} type="button"
                  onClick={() => setForm(p => ({ ...p, session: o.val }))}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '8px',
                    border: `1px solid ${form.session === o.val ? '#1a1a2e' : '#ddd'}`,
                    background: form.session === o.val ? '#1a1a2e' : '#fff',
                    color: form.session === o.val ? '#fff' : '#555',
                    fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Day count */}
        {days > 0 && (
          <div style={{ padding: '10px 14px', background: insufficient ? '#fee2e2' : '#f0f9ff', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: insufficient ? '#dc2626' : '#0369a1' }}>
              {insufficient ? '❌ Insufficient balance — ' : '📅 '}
              <strong>{days} working day{days !== 1 ? 's' : ''}</strong> selected
              {weekendDays.length === 1 ? ' (6-day week, Sun off)' : ' (weekends excluded)'}
            </span>
            {remaining !== null && (
              <span style={{ fontSize: '12px', color: insufficient ? '#dc2626' : '#888' }}>
                {remaining - days >= 0 ? `${remaining - days} will remain` : `${Math.abs(remaining - days)} short`}
              </span>
            )}
          </div>
        )}

        {/* SL doc warning */}
        {needsDoc && (
          <div style={{ padding: '10px 14px', background: '#fffbeb', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: '#92400e' }}>
            📋 Sick Leave over {slDocDays} days requires a medical certificate. Please upload below.
          </div>
        )}

        {/* CL cap info */}
        {isClOverCap && (
          <div style={{ padding: '10px 14px', background: '#f0f9ff', borderRadius: '8px', marginBottom: '16px', fontSize: '12px', color: '#0369a1' }}>
            ℹ CL monthly cap: {clMonthCap} days/month. The system will validate this when you submit.
          </div>
        )}

        {/* Reason */}
        <div style={fw}>
          <label style={lbl}>Reason *</label>
          <textarea
            value={form.reason} onChange={set('reason')} rows={3}
            placeholder="Brief reason for leave request…"
            style={{ ...inp, resize: 'vertical', fontFamily: 'Inter, sans-serif' }}
          />
        </div>

        {/* Document URL */}
        {(needsDoc || selectedType?.requires_document) && (
          <div style={fw}>
            <label style={lbl}>Document URL {selectedType?.requires_document ? '*' : '(recommended)'}</label>
            <input type="url" value={form.doc_url} onChange={set('doc_url')} placeholder="https://…" style={inp} />
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitDisabled}
          style={{
            width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
            background: submitDisabled ? '#e5e7eb' : '#1a1a2e',
            color: submitDisabled ? '#9ca3af' : '#fff',
            fontSize: '14px', fontWeight: 700,
            cursor: submitDisabled ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Submitting…' : 'Submit Leave Request'}
        </button>
      </div>
    </div>
  )
}

const fw  = { marginBottom: '16px' }
const lbl = { fontSize: '13px', color: '#555', fontWeight: 500, display: 'block', marginBottom: '6px' }
const inp = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }
const sel = { ...inp, background: '#fff' }