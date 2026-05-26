// src/pages/leave/LeaveTypeConfig.jsx — FULL REPLACEMENT
// Syncs leave type edits to BOTH LeaveType model AND SystemSettings.
// Changes to days_allowed / min_notice_days / is_paid / carry_forward are saved
// to both places so the calendar, payroll and apply-leave form always stay in sync.

import { useEffect, useState, useCallback } from 'react'
import {
  getLeavePolicySettingsApi,
  saveLeavePolicySettingApi,
  createLeaveTypeApi,
} from '../../api/services/leave'
import toast from 'react-hot-toast'

/* ─── helpers ─────────────────────────────────────────────────────────────── */

const EMPTY = {
  name: '', code: '', days_allowed: 12, applicable_to: 'all',
  carry_forward: false, max_carry_forward: 0,
  is_paid: true, requires_document: false,
  min_notice_days: 0, description: '',
}

const inp = {
  width: '100%', padding: '8px 12px', borderRadius: '8px',
  border: '1px solid #ddd', fontSize: '13px', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', display: 'block',
}

const Row2  = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
    {children}
  </div>
)

const Field = ({ label, hint, children }) => (
  <div>
    <label style={{ fontSize: '12px', color: '#555', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
      {label}
    </label>
    {children}
    {hint && <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#999' }}>{hint}</p>}
  </div>
)

const SourceBadge = ({ source }) =>
  source === 'system_settings' ? (
    <span title="Controlled by System Settings" style={{
      fontSize: '10px', background: '#e0f2fe', color: '#0369a1',
      padding: '1px 6px', borderRadius: '4px', border: '1px solid #bae6fd',
      fontWeight: 600, marginLeft: '4px',
    }}>⚙ Settings</span>
  ) : (
    <span title="Set directly on this leave type" style={{
      fontSize: '10px', background: '#f3f4f6', color: '#666',
      padding: '1px 6px', borderRadius: '4px', border: '1px solid #e5e7eb',
      fontWeight: 500, marginLeft: '4px',
    }}>Leave Type</span>
  )

/* ─── main component ─────────────────────────────────────────────────────── */

export default function LeaveTypeConfig() {
  const [policies,  setPolicies]  = useState([])
  const [loading,   setLoading]   = useState(false)
  const [showForm,  setShowForm]  = useState(false)
  const [isNew,     setIsNew]     = useState(false)
  const [editing,   setEditing]   = useState(null)   // policy object being edited
  const [form,      setForm]      = useState(EMPTY)
  const [saving,    setSaving]    = useState(false)

  /* load merged policy list */
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await getLeavePolicySettingsApi()
      setPolicies(r.data)
    } catch {
      toast.error('Failed to load leave policies')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  /* open add form */
  const openAdd = () => {
    setIsNew(true)
    setEditing(null)
    setForm(EMPTY)
    setShowForm(true)
  }

  /* open edit form — pre-fill from merged policy */
  const openEdit = (policy) => {
    setIsNew(false)
    setEditing(policy)
    setForm({
      name:              policy.name,
      code:              policy.code,
      days_allowed:      policy.days_allowed,
      applicable_to:     policy.applicable_to,
      carry_forward:     policy.carry_forward,
      max_carry_forward: policy.max_carry_forward,
      is_paid:           policy.is_paid,
      requires_document: policy.requires_document,
      min_notice_days:   policy.min_notice_days,
      description:       policy.description || '',
    })
    setShowForm(true)
  }

  /* field setters */
  const set  = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const setB = k => e => setForm(p => ({ ...p, [k]: e.target.checked }))
  const setN = k => e => setForm(p => ({ ...p, [k]: parseInt(e.target.value) || 0 }))

  /* save handler */
  const handleSave = async () => {
    if (!form.name || !form.code) { toast.error('Name and code are required'); return }
    setSaving(true)
    try {
      if (isNew) {
        // Create via standard leave type endpoint (will create model record)
        await createLeaveTypeApi({
          name: form.name, code: form.code,
          days_allowed: form.days_allowed, applicable_to: form.applicable_to,
          carry_forward: form.carry_forward, max_carry_forward: form.max_carry_forward,
          is_paid: form.is_paid, requires_document: form.requires_document,
          min_notice_days: form.min_notice_days, description: form.description,
        })
        // After create, reload to get id then sync to system settings
        const r = await getLeavePolicySettingsApi()
        const created = r.data.find(p => p.code.toUpperCase() === form.code.toUpperCase())
        if (created) {
          await saveLeavePolicySettingApi(created.id, {
            days_allowed:    form.days_allowed,
            min_notice_days: form.min_notice_days,
            is_paid:         form.is_paid,
            carry_forward:   form.carry_forward,
          })
        }
        toast.success('Leave type created and synced to System Settings!')
      } else {
        // Edit: single call syncs BOTH model and system settings
        const res = await saveLeavePolicySettingApi(editing.id, {
          name:              form.name,
          applicable_to:     form.applicable_to,
          description:       form.description,
          requires_document: form.requires_document,
          max_carry_forward: form.max_carry_forward,
          days_allowed:      form.days_allowed,
          min_notice_days:   form.min_notice_days,
          is_paid:           form.is_paid,
          carry_forward:     form.carry_forward,
        })
        const balCount = res.data?.balances_updated ?? 0
        toast.success(
          balCount > 0
            ? `Saved! ${balCount} employee balance(s) updated → reflected in Balance, Calendar & Payroll`
            : 'Saved — reflected in System Settings, Calendar & Payroll!'
        )
      }
      setShowForm(false)
      load()
    } catch (e) {
      const err = e.response?.data
      toast.error(err?.name?.[0] || err?.code?.[0] || err?.error || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  /* ── render ─────────────────────────────────────────────────────────────── */

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111' }}>Leave Policies</h3>
          <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#888' }}>
            Edits here are saved to both <strong>Leave Types</strong> and <strong>System Settings</strong> — changes reflect in the Monthly Calendar and Payroll automatically.
          </p>
        </div>
        <button onClick={openAdd} style={{ padding: '9px 18px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          + Add Leave Type
        </button>
      </div>

      {/* Info banner */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '12px', color: '#1e40af' }}>
        ℹ️ Values marked <strong>⚙ Settings</strong> are controlled by System Settings. Editing here also updates System Settings so the Calendar, Apply Leave, and Payroll all stay in sync.
      </div>

      {/* Policy cards */}
      {loading ? (
        <p style={{ color: '#888' }}>Loading leave policies…</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '14px' }}>
          {policies.map(policy => (
            <PolicyCard key={policy.id} policy={policy} onEdit={openEdit} />
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showForm && (
        <EditModal
          form={form} isNew={isNew}
          set={set} setB={setB} setN={setN}
          onClose={() => setShowForm(false)}
          onSave={handleSave} saving={saving}
          editingPolicy={editing}
        />
      )}
    </div>
  )
}

/* ─── Policy Card ─────────────────────────────────────────────────────────── */

function PolicyCard({ policy, onEdit }) {
  const badges = [
    { label: policy.is_paid ? 'Paid' : 'Unpaid',                          color: policy.is_paid ? '#16a34a' : '#dc2626' },
    { label: policy.applicable_to,                                          color: '#6366f1' },
    { label: policy.carry_forward ? 'Carry Forward' : 'No Carry Forward',  color: '#d97706' },
    { label: policy.requires_document ? 'Doc Required' : '',               color: '#b45309' },
  ].filter(b => b.label)

  return (
    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Title row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#111' }}>{policy.name}</h4>
          <span style={{ fontSize: '11px', color: '#888', fontFamily: 'monospace' }}>{policy.code}</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '22px', fontWeight: 800, color: '#1d4ed8' }}>{policy.days_allowed}</span>
          <div style={{ fontSize: '10px', color: '#888' }}>days/yr</div>
          <SourceBadge source={policy.days_allowed_source} />
        </div>
      </div>

      {/* Key policy info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        <PolicyStat
          label="Min Notice"
          value={`${policy.min_notice_days} day${policy.min_notice_days !== 1 ? 's' : ''}`}
          source={policy.notice_days_source}
        />
        <PolicyStat
          label="Paid"
          value={policy.is_paid ? 'Yes' : 'No'}
          source={policy.is_paid_source}
          valueColor={policy.is_paid ? '#16a34a' : '#dc2626'}
        />
        {policy.carry_forward && (
          <PolicyStat
            label="Max Carry Fwd"
            value={`${policy.max_carry_forward} days`}
            source={policy.carry_forward_source}
          />
        )}
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
        {badges.map(b => (
          <span key={b.label} style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, background: b.color + '18', color: b.color }}>
            {b.label}
          </span>
        ))}
      </div>

      {policy.description && (
        <p style={{ margin: 0, fontSize: '12px', color: '#888', lineClamp: 2, overflow: 'hidden' }}>{policy.description}</p>
      )}

      <button
        onClick={() => onEdit(policy)}
        style={{ padding: '7px', background: '#f3f4f6', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 500, marginTop: 'auto' }}
      >
        ✏️ Edit
      </button>
    </div>
  )
}

function PolicyStat({ label, value, source, valueColor }) {
  return (
    <div style={{ background: '#f8fafc', borderRadius: '6px', padding: '6px 8px' }}>
      <div style={{ fontSize: '10px', color: '#999', marginBottom: '2px' }}>
        {label} <SourceBadge source={source} />
      </div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: valueColor || '#111' }}>{value}</div>
    </div>
  )
}

/* ─── Edit Modal ──────────────────────────────────────────────────────────── */

function EditModal({ form, isNew, set, setB, setN, onClose, onSave, saving, editingPolicy }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
      <div style={{ background: '#fff', borderRadius: '14px', width: '100%', maxWidth: '560px', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Modal header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
              {isNew ? 'Add Leave Type' : `Edit — ${editingPolicy?.name}`}
            </h3>
            {!isNew && (
              <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#888' }}>
                Changes are saved to both Leave Type and System Settings simultaneously
              </p>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}>✕</button>
        </div>

        {/* Form body */}
        <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Sync notice for edit */}
          {!isNew && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#16a34a' }}>
              ✓ Saving here automatically updates System Settings → reflected in Monthly Calendar, Apply Leave, and Payroll Payslips
            </div>
          )}

          {/* Name + Code */}
          <Row2>
            <Field label="Name *">
              <input value={form.name} onChange={set('name')} style={inp} placeholder="Casual Leave" />
            </Field>
            <Field label="Code *">
              <input value={form.code} onChange={set('code')} style={inp} placeholder="CL" disabled={!isNew}
                title={!isNew ? 'Code cannot be changed after creation' : ''}
              />
            </Field>
          </Row2>

          {/* Days Allowed + Min Notice */}
          <Row2>
            <Field
              label="Days Allowed / Year"
              hint={!isNew ? 'Also updates System Settings cl_days_per_year etc.' : undefined}
            >
              <input type="number" min="0" value={form.days_allowed} onChange={setN('days_allowed')} style={inp} />
            </Field>
            <Field
              label="Min Advance Notice (Days)"
              hint={!isNew ? `Also updates ${form.code?.toLowerCase()}_advance_notice_days in System Settings` : undefined}
            >
              <input type="number" min="0" value={form.min_notice_days} onChange={setN('min_notice_days')} style={inp} />
            </Field>
          </Row2>

          {/* Applicable to */}
          <Field label="Applicable To">
            <select value={form.applicable_to} onChange={set('applicable_to')} style={inp}>
              <option value="all">All</option>
              <option value="regular">Regular</option>
              <option value="contract">Contract</option>
              <option value="parttime">Part-Time</option>
              <option value="intern">Intern</option>
            </select>
          </Field>

          {/* Description */}
          <Field label="Description">
            <textarea value={form.description} onChange={set('description')}
              style={{ ...inp, height: '60px', resize: 'vertical' }}
              placeholder="Brief description…"
            />
          </Field>

          {/* Boolean toggles */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { key: 'is_paid',           label: '💰 Paid Leave',        hint: 'Affects payslip LOP calculation' },
              { key: 'carry_forward',     label: '↪ Carry Forward',      hint: 'Unused balance moves to next year' },
              { key: 'requires_document', label: '📄 Document Required', hint: 'Employee must upload proof' },
            ].map(t => (
              <label key={t.key} style={{ display: 'flex', flexDirection: 'column', gap: '3px', background: form[t.key] ? '#f0fdf4' : '#f8fafc', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', border: `1px solid ${form[t.key] ? '#86efac' : '#e5e7eb'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
                  <input type="checkbox" checked={form[t.key]} onChange={setB(t.key)} style={{ width: '15px', height: '15px', accentColor: '#1a1a2e' }} />
                  {t.label}
                </div>
                <span style={{ fontSize: '10px', color: '#999', paddingLeft: '23px' }}>{t.hint}</span>
              </label>
            ))}
          </div>

          {/* Max carry forward — only when carry forward enabled */}
          {form.carry_forward && (
            <Field label="Max Carry Forward Days">
              <input type="number" min="0" value={form.max_carry_forward} onChange={setN('max_carry_forward')} style={inp} />
            </Field>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 22px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#fafafa' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', background: '#f3f4f6', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={onSave} disabled={saving} style={{ padding: '9px 22px', background: saving ? '#9ca3af' : '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Saving…' : isNew ? 'Create & Sync' : '💾 Save & Sync to Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}