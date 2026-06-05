// src/pages/settings/SystemSettings.jsx — FULL REPLACEMENT
// No duplicates. Each setting shows exactly which modules it affects.
import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import systemSettingsService from '../../api/services/systemsettings'

// ── Responsive breakpoint hook ────────────────────────────────────────────────
function useBreakpoint() {
  const [bp, setBp] = useState(() => {
    if (typeof window === 'undefined') return 'desktop'
    return window.innerWidth <= 640 ? 'mobile' : window.innerWidth <= 1024 ? 'tablet' : 'desktop'
  })
  useEffect(() => {
    const handler = () =>
      setBp(window.innerWidth <= 640 ? 'mobile' : window.innerWidth <= 1024 ? 'tablet' : 'desktop')
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return bp
}

const CATEGORY_META = {
  attendance: {
    label:  'Attendance Settings',
    icon:   '📅',
    desc:   'Affects: Monthly calendar week-off display, late/OT marking, payroll working days & LOP',
    color:  '#eff6ff',
    border: '#bfdbfe',
  },
  leave: {
    label:  'Leave Policies',
    icon:   '🌴',
    desc:   'Affects: Apply Leave form validation, Balance Dashboard, carry-forward, Monthly Calendar, Payroll LOP — also synced with Leave Types config',
    color:  '#f0fdf4',
    border: '#bbf7d0',
  },
  payroll: {
    label:  'Payroll Settings',
    icon:   '💰',
    desc:   'Affects: Payroll engine — PF/ESI/PT/TDS calculations, payslip deduction breakdown',
    color:  '#fefce8',
    border: '#fde047',
  },
  general: {
    label:  'General Settings',
    icon:   '⚙️',
    desc:   'Affects: Payslip header, email subjects, fiscal year, probation eligibility',
    color:  '#f5f3ff',
    border: '#ddd6fe',
  },
}

const KEY_IMPACT = {
  work_days_per_week:         ['📅 Calendar', '💰 Payroll working days', '🌴 Leave day count'],
  weekend_days:               ['📅 Calendar week-off cells', '💰 Payroll LOP days', '🌴 Apply Leave form'],
  work_start_time:            ['📅 Late marking'],
  work_end_time:              ['📅 OT calculation'],
  night_shift_enabled:        ['📅 Night shift attendance', '💰 Payroll present/LOP'],
  night_shift_start_time:     ['📅 Night check-in window', '📅 Late marking'],
  night_shift_end_time:       ['📅 Next-day checkout', '📅 OT calculation'],
  work_hours_per_day:         ['💰 OT pay rate'],
  grace_period_minutes:       ['📅 Late vs Present status'],
  half_day_hours:             ['📅 Half Day marking', '💰 LOP 0.5 day'],
  late_marks_per_half_day:    ['💰 LOP deduction (late marks)'],
  overtime_multiplier:        ['💰 OT pay rate in payroll'],
  regularization_window_days: ['📅 Regularize form date limit'],
  cl_days_per_year:           ['🌴 Balance init', '🌴 Apply form remaining'],
  cl_monthly_cap:             ['🌴 Apply Leave CL validation'],
  sl_days_per_year:           ['🌴 Balance init'],
  el_days_per_year:           ['🌴 Balance init'],
  el_max_carry_forward:       ['🌴 Carry-forward cap', '🌴 Balance dashboard'],
  sl_doc_required_after_days: ['🌴 Apply Leave document warning'],
  sandwich_rule_enabled:      ['🌴 Leave day count'],
  half_day_leave_enabled:     ['🌴 Apply Leave session field'],
  leave_balance_low_threshold:['🌴 Low balance badge'],
  leave_year_basis:           ['🌴 Balance year display', '🌴 Carry-forward timing'],
  carry_forward_month:        ['🌴 Carry-forward job timing'],
  sl_advance_notice_days:     ['🌴 Apply Leave SL date validation', '🌴 Leave Types Edit form'],
  el_advance_notice_days:     ['🌴 Apply Leave EL date validation', '🌴 Leave Types Edit form'],
  cl_is_paid:                 ['💰 Payslip LOP for CL', '🌴 Leave Types Edit form'],
  sl_is_paid:                 ['💰 Payslip LOP for SL', '🌴 Leave Types Edit form'],
  el_is_paid:                 ['💰 Payslip LOP for EL', '🌴 Leave Types Edit form'],
  el_carry_forward:           ['🌴 EL carry-forward', '🌴 Balance dashboard', '🌴 Leave Types Edit form'],
  pf_employee_percent:        ['💰 PF deduction in payslip'],
  pf_employer_percent:        ['💰 CTC calculation'],
  esi_threshold_salary:       ['💰 ESI eligibility check'],
  esi_employee_percent:       ['💰 ESI deduction in payslip'],
  esi_employer_percent:       ['💰 CTC calculation'],
  basic_salary_percent:       ['💰 Salary Config auto-fill'],
  hra_percent_metro:          ['💰 HRA in payslip (metro)'],
  hra_percent_nonmetro:       ['💰 HRA in payslip (non-metro)'],
  payroll_lock_day:           ['💰 Payroll Runs warning'],
  tds_flat_percent_contract:  ['💰 TDS for contract employees'],
  pt_flat_amount:             ['💰 PT deduction in payslip'],
  pt_threshold_salary:        ['PT slab cutoff', 'Salary Config preview'],
  pt_below_threshold_amount:  ['PT below cutoff', 'Payslip deduction'],
  pt_above_threshold_amount:  ['PT above cutoff', 'Payslip deduction'],
  company_name:               ['🧾 Payslip header', '📧 Email subject'],
  office_latitude:            ['Attendance check-in location', '300m office validation'],
  office_longitude:           ['Attendance check-out location', 'Office map marker'],
  office_radius_meters:       ['Allowed check-in radius', 'Allowed check-out radius'],
  fiscal_year_start_month:    ['💰 Payroll year', '🌴 Fiscal leave year'],
  probation_period_months:    ['🌴 EL eligibility for new employees'],
}

const PLACEHOLDER = {
  office_latitude: 'Enter office latitude',
  office_longitude: 'Enter office longitude',
  office_radius_meters: '300',
}

const HIDDEN_KEYS = [
  'work_days_per_week',
  'regularization_window_days',
  'cl_days_per_year',
  'cl_is_paid',
  'el_days_per_year',
  'el_advance_notice_days',
  'el_max_carry_forward',
  'nll_advance_notice_days',
  'maternity_leave_days',
  'nll_carry_forward',
  'nll_days_per_year',
  'nll_is_paid',
  'paternity_leave_days',
  'probation_earned_leave',
  'sl_days_per_year',
  'sl_advance_notice_days',
  'sl_is_paid',
  'pt_slab_json',
  'pt_flat_amount',
  'currency',
  'fiscal_year_start_month',
  'cl_advance_notice_days'
]

export default function SystemSettings() {
  const permissions = useSelector(s => s.auth.permissions) || []
  const canEdit = permissions.includes('manage_settings')
  const bp      = useBreakpoint()
  const isMobile = bp === 'mobile'

  const [settings, setSettings] = useState({})
  const [edits,    setEdits]    = useState({})
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState('')
  const [openCats, setOpenCats] = useState({
    attendance: true, leave: true, payroll: true, general: true,
  })

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

  const getValue    = s => edits[s.key] !== undefined ? edits[s.key] : s.value
  const hasChanges  = Object.keys(edits).length > 0

  // Deduplicate settings per category
  const deduped = {}
  Object.entries(settings).forEach(([cat, items]) => {
    const seen = new Set()
    deduped[cat] = (items || []).filter(s => {
      if (seen.has(s.key)) return false
      seen.add(s.key); return true
    })
  })

  const renderInput = (setting) => {
    const isFixedPayrollLock = setting.key === 'payroll_lock_day'
    const value     = isFixedPayrollLock ? '1' : getValue(setting)
    const isChanged = edits[setting.key] !== undefined

    if (setting.value_type === 'boolean') {
      return (
        <div style={{ display: 'flex', gap: '8px' }}>
          {['true', 'false'].map(opt => (
            <button
              key={opt}
              onClick={() => canEdit && handleChange(setting.key, opt)}
              type="button"
              disabled={!canEdit}
              style={{
                flex:        1,
                padding:     '8px 6px',
                borderRadius:'8px',
                border:      '1px solid',
                cursor:      canEdit ? 'pointer' : 'not-allowed',
                fontWeight:  600,
                fontSize:    '12px',
                whiteSpace:  'nowrap',
                background:  value === opt ? (opt === 'true' ? '#d1fae5' : '#fee2e2') : '#f9fafb',
                borderColor: value === opt ? (opt === 'true' ? '#6ee7b7' : '#fca5a5') : '#e5e7eb',
                color:       value === opt ? (opt === 'true' ? '#065f46' : '#991b1b') : '#888',
                transition:  'all 0.15s',
              }}
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
          value={value}
          rows={3}
          onChange={e => canEdit && handleChange(setting.key, e.target.value)}
          disabled={!canEdit}
          style={{
            width:      '100%',
            padding:    '8px',
            borderRadius:'8px',
            border:     `1px solid ${isChanged ? '#fde047' : '#ddd'}`,
            fontSize:   '12px',
            fontFamily: 'monospace',
            boxSizing:  'border-box',
            resize:     'vertical',
            background: canEdit ? '#fff' : '#f9fafb',
          }}
        />
      )
    }

    return (
      <input
        value={value}
        type={setting.value_type === 'time' ? 'time' : ['integer', 'decimal'].includes(setting.value_type) ? 'number' : 'text'}
        step={setting.value_type === 'decimal' ? '0.01' : '1'}
        placeholder={PLACEHOLDER[setting.key] || ''}
        onChange={e => canEdit && !isFixedPayrollLock && handleChange(setting.key, e.target.value)}
        disabled={!canEdit || isFixedPayrollLock}
        style={{
          width:       '100%',
          padding:     '9px 12px',
          borderRadius:'8px',
          border:      `1px solid ${isChanged ? '#fde047' : '#ddd'}`,
          fontSize:    '13px',
          boxSizing:   'border-box',
          background:  canEdit && !isFixedPayrollLock ? '#fff' : '#f9fafb',
          outline:     'none',
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
          padding:      '14px 16px',
          borderRadius: '10px',
          marginBottom: '8px',
          background:   isChanged ? '#fffbeb' : '#fff',
          border:       `1px solid ${isChanged ? '#fde68a' : '#e5e7eb'}`,
          boxSizing:    'border-box',
        }}
      >
        {/* On mobile: stack label + input vertically. On tablet+: side by side */}
        <div style={{
          display:       isMobile ? 'flex' : 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent:'space-between',
          alignItems:    isMobile ? 'stretch' : 'flex-start',
          gap:           isMobile ? '10px' : '16px',
        }}>
          {/* Label + meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display:    'flex',
              alignItems: 'center',
              gap:        '8px',
              marginBottom:'4px',
              flexWrap:   'wrap',
            }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>
                {setting.label}
              </label>
              {isChanged && (
                <span style={{
                  fontSize:    '10px',
                  background:  '#fde68a',
                  color:       '#92400e',
                  padding:     '2px 8px',
                  borderRadius:'20px',
                  fontWeight:  700,
                  whiteSpace:  'nowrap',
                }}>
                  MODIFIED
                </span>
              )}
            </div>

            {setting.description && (
              <p style={{
                margin:     '0 0 6px',
                fontSize:   '12px',
                color:      '#888',
                lineHeight: 1.5,
              }}>
                {setting.description.split('\n→')[0]}
              </p>
            )}

            {impacts.length > 0 && (
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '4px' }}>
                {impacts.map(tag => (
                  <span key={tag} style={{
                    fontSize:    '10px',
                    background:  '#f0f9ff',
                    color:       '#0369a1',
                    padding:     '2px 7px',
                    borderRadius:'4px',
                    border:      '1px solid #bae6fd',
                    fontWeight:  500,
                    whiteSpace:  'nowrap',
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div style={{ fontSize: '10px', color: '#ccc', marginTop: '5px' }}>
              key:{' '}
              <code style={{ background: '#f3f4f6', padding: '1px 4px', borderRadius: '3px' }}>
                {setting.key}
              </code>
              {' '}· {setting.value_type}
            </div>
          </div>

          {/* Input — full width on mobile, fixed on larger */}
          <div style={{
            width:     isMobile ? '100%' : '200px',
            flexShrink: 0,
            boxSizing: 'border-box',
          }}>
            {renderInput(setting)}
          </div>
        </div>
      </div>
    )
  }

  if (loading) return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '60px 20px',
      color:          '#94a3b8',
      fontSize:       '14px',
      gap:            '10px',
    }}>
      <span style={{ fontSize: '20px' }}>⏳</span> Loading settings…
    </div>
  )

  return (
    <div style={{
      maxWidth:  '820px',
      margin:    '0 auto',
      padding:   isMobile ? '16px 12px' : '24px 16px',
      boxSizing: 'border-box',
      width:     '100%',
    }}>

      {/* ── Header ── */}
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     isMobile ? 'flex-start' : 'center',
        flexDirection:  isMobile ? 'column' : 'row',
        gap:            '12px',
        marginBottom:   '20px',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: isMobile ? '18px' : '20px', fontWeight: 700, color: '#111' }}>
            System Settings
          </h2>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: '13px' }}>
            {canEdit
              ? 'Changes apply immediately on next payroll run / calendar load / leave request.'
              : 'Read-only view. Contact Admin or HR to change settings.'}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            style={{
              padding:      '10px 22px',
              borderRadius: '8px',
              border:       'none',
              background:   hasChanges ? '#1a1a2e' : '#e5e7eb',
              color:        hasChanges ? '#fff' : '#9ca3af',
              cursor:       hasChanges ? 'pointer' : 'not-allowed',
              fontWeight:   600,
              fontSize:     '14px',
              whiteSpace:   'nowrap',
              alignSelf:    isMobile ? 'stretch' : 'auto',
              textAlign:    'center',
              transition:   'background 0.2s',
            }}
          >
            {saving ? 'Saving…' : saved ? '✓ Saved!' : `Save Changes${hasChanges ? ` (${Object.keys(edits).length})` : ''}`}
          </button>
        )}
      </div>

      {/* ── Alerts ── */}
      {error && (
        <div style={alertStyle('#fee2e2', '#fca5a5', '#dc2626')}>
          ⚠ {error}
        </div>
      )}
      {saved && (
        <div style={alertStyle('#dcfce7', '#86efac', '#16a34a')}>
          ✓ Settings saved! Office location changes reflect in check-in/check-out immediately.
        </div>
      )}
      {hasChanges && (
        <div style={alertStyle('#fef9c3', '#fde047', '#92400e')}>
          ⚠ You have {Object.keys(edits).length} unsaved change(s). Click Save Changes to apply.
        </div>
      )}

      {/* ── Categories ── */}
      {Object.entries(CATEGORY_META).map(([cat, meta]) => {
        const items        = deduped[cat] || []
        const visible      = items.filter(s => !HIDDEN_KEYS.includes(s.key))
        if (!visible.length) return null
        const isOpen       = openCats[cat]
        const changedCount = visible.filter(s => edits[s.key] !== undefined).length

        return (
          <div
            key={cat}
            style={{
              background:   '#fff',
              borderRadius: '12px',
              border:       `1px solid ${meta.border}`,
              marginBottom: '14px',
              overflow:     'hidden',
            }}
          >
            {/* Category header */}
            <div
              onClick={() => setOpenCats(p => ({ ...p, [cat]: !p[cat] }))}
              style={{
                padding:      isMobile ? '12px 14px' : '14px 20px',
                background:   meta.color,
                borderBottom: isOpen ? `1px solid ${meta.border}` : 'none',
                display:      'flex',
                alignItems:   'flex-start',
                gap:          '10px',
                cursor:       'pointer',
                userSelect:   'none',
              }}
            >
              <span style={{ fontSize: isMobile ? '18px' : '20px', flexShrink: 0, marginTop: '1px' }}>
                {meta.icon}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{
                  margin:   0,
                  fontSize: isMobile ? '14px' : '15px',
                  fontWeight: 700,
                  color:    '#111',
                }}>
                  {meta.label}
                </h3>
                <p style={{
                  margin:     '2px 0 0',
                  fontSize:   '11px',
                  color:      '#888',
                  lineHeight: 1.4,
                  // hide desc on very small screens to save space
                  display:    isMobile ? 'none' : 'block',
                }}>
                  {meta.desc}
                </p>
              </div>
              <div style={{
                display:    'flex',
                alignItems: 'center',
                gap:        '6px',
                flexShrink: 0,
                flexWrap:   'wrap',
                justifyContent: 'flex-end',
              }}>
                {changedCount > 0 && (
                  <span style={{
                    background:   '#fde68a',
                    color:        '#92400e',
                    fontSize:     '11px',
                    fontWeight:   700,
                    padding:      '2px 8px',
                    borderRadius: '20px',
                    whiteSpace:   'nowrap',
                  }}>
                    {changedCount} modified
                  </span>
                )}
                <span style={{ fontSize: '11px', color: '#888', whiteSpace: 'nowrap' }}>
                  {visible.length} settings
                </span>
                <span style={{ fontSize: '16px', color: '#888' }}>
                  {isOpen ? '▲' : '▼'}
                </span>
              </div>
            </div>

            {/* Settings list */}
            {isOpen && (
              <div style={{ padding: isMobile ? '10px 10px 4px' : '12px 14px 4px' }}>
                {visible.map(s => renderSetting(s))}
              </div>
            )}
          </div>
        )
      })}

      {!canEdit && (
        <p style={{
          textAlign:    'center',
          color:        '#9ca3af',
          fontSize:     '13px',
          padding:      '16px',
          background:   '#f9fafb',
          borderRadius: '8px',
          border:       '1px solid #e5e7eb',
        }}>
          🔒 Only Admin and HR can modify system settings.
        </p>
      )}
    </div>
  )
}

// ── Style helpers ─────────────────────────────────────────────────────────────
const alertStyle = (bg, borderColor, color) => ({
  background:   bg,
  border:       `1px solid ${borderColor}`,
  borderRadius: '8px',
  padding:      '12px 16px',
  marginBottom: '16px',
  color,
  fontSize:     '13px',
  lineHeight:   1.5,
  boxSizing:    'border-box',
})
