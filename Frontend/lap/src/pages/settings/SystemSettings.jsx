// src/pages/settings/SystemSettings.jsx — FULL REPLACEMENT
// No duplicates. Each setting shows exactly which modules it affects.
import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import systemSettingsService from '../../api/services/systemsettings'

const CATEGORY_META = {
  attendance: {
    label: 'Attendance Settings',
    icon:  '📅',
    desc:  'Affects: Monthly calendar week-off display, late/OT marking, payroll working days & LOP',
    color: '#eff6ff',
    border:'#bfdbfe',
  },
  leave: {
    label: 'Leave Policies',
    icon:  '🌴',
    desc:  'Affects: Apply Leave form validation & day count, Balance Dashboard, carry-forward',
    color: '#f0fdf4',
    border:'#bbf7d0',
  },
  payroll: {
    label: 'Payroll Settings',
    icon:  '💰',
    desc:  'Affects: Payroll engine — PF/ESI/PT/TDS calculations, payslip deduction breakdown',
    color: '#fefce8',
    border:'#fde047',
  },
  general: {
    label: 'General Settings',
    icon:  '⚙️',
    desc:  'Affects: Payslip header, email subjects, fiscal year, probation eligibility',
    color: '#f5f3ff',
    border:'#ddd6fe',
  },
}

// Which modules does each key affect — shown as tags
const KEY_IMPACT = {
  work_days_per_week:        ['📅 Calendar', '💰 Payroll working days', '🌴 Leave day count'],
  weekend_days:              ['📅 Calendar week-off cells', '💰 Payroll LOP days', '🌴 Apply Leave form'],
  work_start_time:           ['📅 Late marking'],
  work_end_time:             ['📅 OT calculation'],
  work_hours_per_day:        ['💰 OT pay rate'],
  grace_period_minutes:      ['📅 Late vs Present status'],
  half_day_hours:            ['📅 Half Day marking', '💰 LOP 0.5 day'],
  late_marks_per_half_day:   ['💰 LOP deduction (late marks)'],
  overtime_multiplier:       ['💰 OT pay rate in payroll'],
  regularization_window_days:['📅 Regularize form date limit'],
  cl_days_per_year:          ['🌴 Balance init', '🌴 Apply form remaining'],
  cl_monthly_cap:            ['🌴 Apply Leave CL validation'],
  sl_days_per_year:          ['🌴 Balance init'],
  el_days_per_year:          ['🌴 Balance init'],
  el_max_carry_forward:      ['🌴 Carry-forward cap', '🌴 Balance dashboard'],
  cl_advance_notice_days:    ['🌴 Apply Leave date validation'],
  sl_doc_required_after_days:['🌴 Apply Leave document warning'],
  sandwich_rule_enabled:     ['🌴 Leave day count'],
  half_day_leave_enabled:    ['🌴 Apply Leave session field'],
  leave_balance_low_threshold:['🌴 Low balance badge'],
  leave_year_basis:          ['🌴 Balance year display', '🌴 Carry-forward timing'],
  carry_forward_month:       ['🌴 Carry-forward job timing'],
  pf_employee_percent:       ['💰 PF deduction in payslip'],
  pf_employer_percent:       ['💰 CTC calculation'],
  esi_threshold_salary:      ['💰 ESI eligibility check'],
  esi_employee_percent:      ['💰 ESI deduction in payslip'],
  esi_employer_percent:      ['💰 CTC calculation'],
  basic_salary_percent:      ['💰 Salary Config auto-fill'],
  hra_percent_metro:         ['💰 HRA in payslip (metro)'],
  hra_percent_nonmetro:      ['💰 HRA in payslip (non-metro)'],
  payroll_lock_day:          ['💰 Payroll Runs warning'],
  tds_flat_percent_contract: ['💰 TDS for contract employees'],
  pt_slab_json:              ['💰 PT deduction in payslip'],
  company_name:              ['🧾 Payslip header', '📧 Email subject'],
  fiscal_year_start_month:   ['💰 Payroll year', '🌴 Fiscal leave year'],
  probation_period_months:   ['🌴 EL eligibility for new employees'],
}

export default function SystemSettings() {
  const role    = useSelector(s => s.auth.role)
  const canEdit = ['superadmin', 'admin', 'hr'].includes(role)

  const [settings, setSettings] = useState({})
  const [edits,    setEdits]    = useState({})
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState('')
  const [openCats, setOpenCats] = useState({ attendance: true, leave: true, payroll: true, general: true })

  useEffect(() => {
    systemSettingsService.getAll()
      .then(res => setSettings(res.data))
      .catch(() => setError('Failed to load settings'))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (key, value) => {
    setEdits(p => ({ ...p, [key]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    if (!canEdit) return
    setSaving(true); setError('')
    try {
      await systemSettingsService.bulkUpdate(edits)
      const res = await systemSettingsService.getAll()
      setSettings(res.data)
      setEdits({})
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const getValue = s => edits[s.key] !== undefined ? edits[s.key] : s.value
  const hasChanges = Object.keys(edits).length > 0

  // Deduplicate settings per category
  const deduped = {}
  Object.entries(settings).forEach(([cat, items]) => {
    const seen = new Set()
    deduped[cat] = (items || []).filter(s => {
      if (seen.has(s.key)) return false
      seen.add(s.key)
      return true
    })
  })

  const renderInput = (setting) => {
    const value     = getValue(setting)
    const isChanged = edits[setting.key] !== undefined

    if (setting.value_type === 'boolean') {
      return (
        <div style={{ display: 'flex', gap: '8px' }}>
          {['true', 'false'].map(opt => (
            <button
              key={opt}
              onClick={() => canEdit && handleChange(setting.key, opt)}
              style={{
                flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid',
                cursor: canEdit ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: '13px',
                background: value === opt ? (opt === 'true' ? '#d1fae5' : '#fee2e2') : '#f9fafb',
                borderColor: value === opt ? (opt === 'true' ? '#6ee7b7' : '#fca5a5') : '#e5e7eb',
                color: value === opt ? (opt === 'true' ? '#065f46' : '#991b1b') : '#888',
              }}
              disabled={!canEdit} type="button"
            >
              {opt === 'true' ? '✓ Enabled' : '✗ Disabled'}
            </button>
          ))}
        </div>
      )
    }

    if (setting.value_type === 'json') {
      return (
        <textarea
          value={value} rows={3}
          onChange={e => canEdit && handleChange(setting.key, e.target.value)}
          disabled={!canEdit}
          style={{
            width: '100%', padding: '8px', borderRadius: '8px',
            border: `1px solid ${isChanged ? '#fde047' : '#ddd'}`,
            fontSize: '12px', fontFamily: 'monospace', boxSizing: 'border-box',
            resize: 'vertical', background: canEdit ? '#fff' : '#f9fafb',
          }}
        />
      )
    }

    return (
      <input
        value={value}
        type={['integer','decimal'].includes(setting.value_type) ? 'number' : 'text'}
        step={setting.value_type === 'decimal' ? '0.01' : '1'}
        onChange={e => canEdit && handleChange(setting.key, e.target.value)}
        disabled={!canEdit}
        style={{
          width: '100%', padding: '9px 12px', borderRadius: '8px',
          border: `1px solid ${isChanged ? '#fde047' : '#ddd'}`,
          fontSize: '13px', boxSizing: 'border-box',
          background: canEdit ? '#fff' : '#f9fafb',
        }}
      />
    )
  }

  const renderSetting = (setting) => {
    const isChanged = edits[setting.key] !== undefined
    const impacts   = KEY_IMPACT[setting.key] || []
    return (
      <div
        key={setting.key}
        style={{
          padding: '14px 16px', borderRadius: '10px', marginBottom: '8px',
          background: isChanged ? '#fffbeb' : '#fff',
          border: `1px solid ${isChanged ? '#fde68a' : '#e5e7eb'}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>{setting.label}</label>
              {isChanged && (
                <span style={{ fontSize: '10px', background: '#fde68a', color: '#92400e', padding: '2px 8px', borderRadius: '20px', fontWeight: 700 }}>
                  MODIFIED
                </span>
              )}
            </div>

            {setting.description && (
              <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#888', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                {setting.description.split('\n→')[0]}
              </p>
            )}

            {impacts.length > 0 && (
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '4px' }}>
                {impacts.map(tag => (
                  <span key={tag} style={{ fontSize: '10px', background: '#f0f9ff', color: '#0369a1', padding: '2px 7px', borderRadius: '4px', border: '1px solid #bae6fd', fontWeight: 500 }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div style={{ fontSize: '10px', color: '#ccc', marginTop: '5px' }}>
              key: <code style={{ background: '#f3f4f6', padding: '1px 4px', borderRadius: '3px' }}>{setting.key}</code>
              {' '}· {setting.value_type}
            </div>
          </div>

          <div style={{ minWidth: '200px' }}>
            {renderInput(setting)}
          </div>
        </div>
      </div>
    )
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#aaa' }}>Loading settings…</div>

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#111' }}>System Settings</h2>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: '13px' }}>
            {canEdit
              ? 'Changes apply immediately on next payroll run / calendar load / leave request.'
              : 'Read-only view. Contact Admin or HR to change settings.'}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={handleSave} disabled={!hasChanges || saving}
            style={{
              padding: '10px 22px', borderRadius: '8px', border: 'none',
              background: hasChanges ? '#1a1a2e' : '#e5e7eb',
              color: hasChanges ? '#fff' : '#9ca3af',
              cursor: hasChanges ? 'pointer' : 'not-allowed',
              fontWeight: 600, fontSize: '14px',
            }}
          >
            {saving ? 'Saving…' : saved ? '✓ Saved!' : `Save Changes${hasChanges ? ` (${Object.keys(edits).length})` : ''}`}
          </button>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#dc2626', fontSize: '13px' }}>
          {error}
        </div>
      )}
      {saved && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#16a34a', fontSize: '13px' }}>
          ✓ Settings saved! Changes will reflect in payroll runs, calendar, and leave forms immediately.
        </div>
      )}
      {hasChanges && (
        <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: '8px', padding: '10px 16px', marginBottom: '16px', color: '#92400e', fontSize: '12px' }}>
          ⚠ You have {Object.keys(edits).length} unsaved change(s). Click Save Changes to apply.
        </div>
      )}

      {/* Categories */}
      {Object.entries(CATEGORY_META).map(([cat, meta]) => {
        const items = deduped[cat] || []
        if (!items.length) return null
        const isOpen = openCats[cat]
        const changedCount = items.filter(s => edits[s.key] !== undefined).length

        return (
          <div key={cat} style={{ background: '#fff', borderRadius: '12px', border: `1px solid ${meta.border}`, marginBottom: '14px', overflow: 'hidden' }}>
            <div
              onClick={() => setOpenCats(p => ({ ...p, [cat]: !p[cat] }))}
              style={{
                padding: '14px 20px', background: meta.color,
                borderBottom: isOpen ? `1px solid ${meta.border}` : 'none',
                display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: '20px' }}>{meta.icon}</span>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#111' }}>{meta.label}</h3>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#888' }}>{meta.desc}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {changedCount > 0 && (
                  <span style={{ background: '#fde68a', color: '#92400e', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>
                    {changedCount} modified
                  </span>
                )}
                <span style={{ fontSize: '11px', color: '#888' }}>{items.length} settings</span>
                <span style={{ fontSize: '16px', color: '#888' }}>{isOpen ? '▲' : '▼'}</span>
              </div>
            </div>

            {isOpen && (
              <div style={{ padding: '12px 14px 4px' }}>
                {items.map(s => renderSetting(s))}
              </div>
            )}
          </div>
        )
      })}

      {!canEdit && (
        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '13px', padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          🔒 Only Admin and HR can modify system settings.
        </p>
      )}
    </div>
  )
}