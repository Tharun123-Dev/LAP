// src/pages/leave/HolidayConfig.jsx
// ── NEW FILE ──
// Place at: Frontend/lap/src/pages/leave/HolidayConfig.jsx
//
// Full CRUD component for public holidays.
//   • Displayed as a tab "🗓 Holidays" next to "⚙️ Leave Types" in LeavePage
//   • Add / Edit / Delete holidays
//   • Shows upcoming vs past holidays with colour-coded date badges
//   • Info banner explains payroll behaviour (holidays = present, no LOP)
//   • Holidays appear in MonthlyView calendar with a "PH" badge automatically
//     (calendar reads holidays from the API response, no extra work needed)

import { useEffect, useState } from 'react'
import {
  getHolidaysApi,
  createHolidayApi,
  updateHolidayApi,
  deleteHolidayApi,
} from '../../api/services/attendance'
import toast from 'react-hot-toast'

const INP_STYLE = {
  width: '100%', padding: '8px 12px', borderRadius: '8px',
  border: '1px solid #ddd', fontSize: '13px', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', display: 'block',
}

const Field = ({ label, children }) => (
  <div>
    <label style={{ fontSize: '12px', color: '#555', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
      {label}
    </label>
    {children}
  </div>
)

const EMPTY_FORM = { date: '', name: '', description: '' }

export default function HolidayConfig() {
  const [holidays, setHolidays] = useState([])
  const [loading,  setLoading]  = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing,  setEditing]  = useState(null)        // holiday object being edited
  const [form,     setForm]     = useState(EMPTY_FORM)
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(null)        // id being deleted

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const r = await getHolidaysApi()
      setHolidays(r.data)
    } catch {
      toast.error('Failed to load holidays')
    } finally {
      setLoading(false)
    }
  }

  const openAdd  = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true) }
  const openEdit = (h) => {
    setEditing(h)
    setForm({ date: h.date, name: h.name, description: h.description || '' })
    setShowForm(true)
  }

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))

  const handleSave = async () => {
    if (!form.date || !form.name.trim()) { toast.error('Date and name are required'); return }
    setSaving(true)
    try {
      if (editing) {
        await updateHolidayApi(editing.id, form)
        toast.success('Holiday updated!')
      } else {
        await createHolidayApi(form)
        toast.success('Holiday added!')
      }
      setShowForm(false)
      load()
    } catch (e) {
      const err = e?.response?.data
      toast.error(err?.date?.[0] || err?.name?.[0] || err?.detail || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (h) => {
    if (!window.confirm(`Delete holiday "${h.name}" on ${fmtDate(h.date)}?`)) return
    setDeleting(h.id)
    try {
      await deleteHolidayApi(h.id)
      toast.success('Holiday deleted')
      load()
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Delete failed')
    } finally {
      setDeleting(null)
    }
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const upcoming = holidays.filter((h) => h.date >= todayStr)
  const past     = holidays.filter((h) => h.date <  todayStr)

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111' }}>🗓 Holiday Calendar</h3>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#888' }}>
            Public holidays count as&nbsp;
            <strong>present days</strong>&nbsp;in payroll — no LOP deducted.
            They appear in the attendance calendar with a&nbsp;
            <span style={{ background: '#dbeafe', color: '#1e40af', padding: '1px 7px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>PH</span>
            &nbsp;badge.
          </p>
        </div>
        <button
          onClick={openAdd}
          style={{ padding: '9px 18px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          + Add Holiday
        </button>
      </div>

      {/* ── Info banner ── */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', fontSize: '12px', color: '#1e40af', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '16px', flexShrink: 0 }}>ℹ️</span>
        <div>
          <strong>How it works:</strong> Any date added here is automatically treated as a paid day off for all employees.
          In the attendance calendar it shows as <strong>Public Holiday (PH)</strong>.
          In payroll, that day is counted as <strong>present</strong> — it is
          never deducted as LOP, regardless of whether the employee has an
          attendance record for that day.
        </div>
      </div>

      {/* ── List ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading holidays…</div>
      ) : holidays.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', background: '#f9fafb', borderRadius: '12px', border: '1px dashed #e5e7eb' }}>
          <p style={{ margin: 0, fontSize: '32px' }}>📅</p>
          <p style={{ margin: '8px 0 0', color: '#888', fontSize: '13px' }}>No holidays added yet.</p>
          <p style={{ margin: '4px 0 0', color: '#aaa', fontSize: '12px' }}>Click "+ Add Holiday" to get started.</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <Section title={`📅 Upcoming Holidays (${upcoming.length})`} titleColor="#1e40af" bg="#eff6ff">
              {upcoming.map((h) => (
                <HolidayRow key={h.id} h={h} onEdit={openEdit} onDelete={handleDelete} deleting={deleting} isUpcoming />
              ))}
            </Section>
          )}
          {past.length > 0 && (
            <Section title={`📂 Past Holidays (${past.length})`} titleColor="#6b7280" bg="#f9fafb" startCollapsed>
              {past.map((h) => (
                <HolidayRow key={h.id} h={h} onEdit={openEdit} onDelete={handleDelete} deleting={deleting} />
              ))}
            </Section>
          )}
        </>
      )}

      {/* ── Add / Edit Modal ── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '14px', width: '100%', maxWidth: '440px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Modal header */}
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                {editing ? '✏️ Edit Holiday' : '➕ Add Holiday'}
              </h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888', lineHeight: 1 }}>✕</button>
            </div>

            {/* Modal body */}
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Field label="Date *">
                <input type="date" value={form.date} onChange={set('date')} style={INP_STYLE} />
              </Field>
              <Field label="Holiday Name *">
                <input value={form.name} onChange={set('name')} style={INP_STYLE} placeholder="e.g. Diwali, Republic Day, Christmas…" />
              </Field>
              <Field label="Description (optional)">
                <textarea value={form.description} onChange={set('description')} style={{ ...INP_STYLE, height: '64px', resize: 'vertical' }} placeholder="Optional note…" />
              </Field>

              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#166534' }}>
                🎉 This holiday will show as <strong>PH (Public Holiday)</strong> on the attendance
                calendar and will be treated as a <strong>paid present day</strong> in payroll automatically.
              </div>
            </div>

            {/* Modal footer */}
            <div style={{ padding: '14px 22px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '9px 18px', background: '#f3f4f6', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '9px 22px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : editing ? 'Update Holiday' : 'Add Holiday'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Collapsible section ───────────────────────────────────────────────────────
function Section({ title, titleColor, bg, children, startCollapsed = false }) {
  const [open, setOpen] = useState(!startCollapsed)
  return (
    <div style={{ marginBottom: '20px', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ width: '100%', padding: '12px 16px', background: bg, border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}
      >
        <span style={{ fontSize: '13px', fontWeight: 700, color: titleColor }}>{title}</span>
        <span style={{ fontSize: '11px', color: titleColor, opacity: 0.7 }}>{open ? '▲ collapse' : '▼ expand'}</span>
      </button>
      {open && <div style={{ background: '#fff' }}>{children}</div>}
    </div>
  )
}

// ── Single holiday row ────────────────────────────────────────────────────────
function HolidayRow({ h, onEdit, onDelete, deleting, isUpcoming = false }) {
  const dayName  = new Date(h.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long' })
  const daysAway = Math.round((new Date(h.date) - new Date()) / 86400000)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
      {/* Date badge */}
      <div style={{ minWidth: '52px', textAlign: 'center', background: isUpcoming ? '#1e40af' : '#e5e7eb', color: isUpcoming ? '#fff' : '#6b7280', borderRadius: '8px', padding: '6px 4px', flexShrink: 0 }}>
        <div style={{ fontSize: '18px', fontWeight: 800, lineHeight: 1 }}>
          {new Date(h.date + 'T00:00:00').getDate()}
        </div>
        <div style={{ fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>
          {new Date(h.date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short' })}
        </div>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#111' }}>{h.name}</span>
          <span style={{ padding: '1px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: '#dbeafe', color: '#1e40af' }}>PH</span>
          {isUpcoming && daysAway >= 0 && (
            <span style={{ padding: '1px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, background: '#f0fdf4', color: '#16a34a' }}>
              {daysAway === 0 ? 'Today!' : daysAway === 1 ? 'Tomorrow' : `in ${daysAway}d`}
            </span>
          )}
        </div>
        <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
          {dayName} · {fmtDate(h.date)}
          {h.description && <span> · {h.description}</span>}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
        <button
          onClick={() => onEdit(h)}
          style={{ padding: '5px 12px', background: '#f3f4f6', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(h)}
          disabled={deleting === h.id}
          style={{ padding: '5px 12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '12px', cursor: deleting === h.id ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: deleting === h.id ? 0.6 : 1 }}
        >
          {deleting === h.id ? '…' : 'Delete'}
        </button>
      </div>
    </div>
  )
}

// ── Util ──────────────────────────────────────────────────────────────────────
function fmtDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}