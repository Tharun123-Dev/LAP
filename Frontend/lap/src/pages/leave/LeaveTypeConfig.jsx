// src/pages/leave/LeaveTypeConfig.jsx
import { useEffect, useState } from 'react'
import { getLeaveTypesApi, createLeaveTypeApi, updateLeaveTypeApi } from '../../api/services/leave'
import toast from 'react-hot-toast'

const EMPTY = {
  name: '', code: '', days_allowed: 12, applicable_to: 'all',
  carry_forward: false, max_carry_forward: 0,
  is_paid: true, requires_document: false,
  min_notice_days: 0, description: '',
}

export default function LeaveTypeConfig() {
  const [types,    setTypes]    = useState([])
  const [loading,  setLoading]  = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [form,     setForm]     = useState(EMPTY)
  const [saving,   setSaving]   = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try { const r = await getLeaveTypesApi(); setTypes(r.data) }
    catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setShowForm(true) }
  const openEdit = (t) => { setEditing(t); setForm({ ...t }); setShowForm(true) }

  const set  = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const setB = k => e => setForm(p => ({ ...p, [k]: e.target.checked }))
  const setN = k => e => setForm(p => ({ ...p, [k]: parseInt(e.target.value) || 0 }))

  const handleSave = async () => {
    if (!form.name || !form.code) { toast.error('Name and code are required'); return }
    setSaving(true)
    try {
      if (editing) {
        await updateLeaveTypeApi(editing.id, form)
        toast.success('Leave type updated!')
      } else {
        await createLeaveTypeApi(form)
        toast.success('Leave type created!')
      }
      setShowForm(false)
      load()
    } catch (e) {
      const err = e.response?.data
      toast.error(err?.name?.[0] || err?.code?.[0] || 'Save failed')
    } finally { setSaving(false) }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111' }}>Leave Type Configuration</h3>
        <button onClick={openAdd} style={{ padding: '9px 18px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          + Add Leave Type
        </button>
      </div>

      {loading ? <p style={{ color: '#888' }}>Loading...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {types.map(t => (
            <div key={t.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#111' }}>{t.name}</h4>
                  <span style={{ fontSize: '11px', color: '#888', fontFamily: 'monospace' }}>{t.code}</span>
                </div>
                <span style={{ fontSize: '20px', fontWeight: 800, color: '#1d4ed8' }}>{t.days_allowed}</span>
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { label: t.is_paid ? 'Paid' : 'Unpaid',              color: t.is_paid ? '#16a34a' : '#dc2626' },
                  { label: t.applicable_to,                              color: '#6366f1' },
                  { label: t.carry_forward ? 'Carry fwd' : 'No carry',  color: '#d97706' },
                  { label: t.requires_document ? 'Doc req.' : '',        color: '#b45309' },
                ].filter(p => p.label).map(p => (
                  <span key={p.label} style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, background: p.color + '18', color: p.color }}>
                    {p.label}
                  </span>
                ))}
              </div>

              {t.description && <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>{t.description}</p>}

              <button onClick={() => openEdit(t)} style={{ padding: '7px', background: '#f3f4f6', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 500, marginTop: 'auto' }}>
                Edit
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '14px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>{editing ? 'Edit Leave Type' : 'Add Leave Type'}</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}>✕</button>
            </div>
            <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Row2>
                <Field label="Name *"><input value={form.name} onChange={set('name')} style={inp} placeholder="Casual Leave" /></Field>
                <Field label="Code *"><input value={form.code} onChange={set('code')} style={inp} placeholder="CL" /></Field>
              </Row2>
              <Row2>
                <Field label="Days Allowed"><input type="number" min="0" value={form.days_allowed} onChange={setN('days_allowed')} style={inp} /></Field>
                <Field label="Min Notice Days"><input type="number" min="0" value={form.min_notice_days} onChange={setN('min_notice_days')} style={inp} /></Field>
              </Row2>
              <Field label="Applicable To">
                <select value={form.applicable_to} onChange={set('applicable_to')} style={inp}>
                  <option value="all">All</option>
                  <option value="regular">Regular</option>
                  <option value="contract">Contract</option>
                  <option value="parttime">Part-Time</option>
                  <option value="intern">Intern</option>
                </select>
              </Field>
              <Field label="Description">
                <textarea value={form.description} onChange={set('description')} style={{ ...inp, height: '60px', resize: 'vertical' }} placeholder="Brief description..." />
              </Field>
              {/* Toggles */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { key: 'is_paid',           label: 'Paid Leave' },
                  { key: 'carry_forward',     label: 'Carry Forward' },
                  { key: 'requires_document', label: 'Document Required' },
                ].map(toggle => (
                  <label key={toggle.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', background: '#f8fafc', padding: '9px 12px', borderRadius: '8px' }}>
                    <input type="checkbox" checked={form[toggle.key]} onChange={setB(toggle.key)} style={{ width: '15px', height: '15px', accentColor: '#1a1a2e' }} />
                    {toggle.label}
                  </label>
                ))}
              </div>
              {form.carry_forward && (
                <Field label="Max Carry Forward Days">
                  <input type="number" min="0" value={form.max_carry_forward} onChange={setN('max_carry_forward')} style={inp} />
                </Field>
              )}
            </div>
            <div style={{ padding: '14px 22px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '9px 18px', background: '#f3f4f6', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '9px 20px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const Row2  = ({ children }) => <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>{children}</div>
const Field = ({ label, children }) => <div><label style={{ fontSize: '12px', color: '#555', fontWeight: 500, display: 'block', marginBottom: '4px' }}>{label}</label>{children}</div>
const inp   = { width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', display: 'block' }