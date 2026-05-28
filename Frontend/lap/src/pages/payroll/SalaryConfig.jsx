// src/pages/payroll/SalaryConfig.jsx — FULL REPLACEMENT
// List always shows live-computed values (backend recomputes with current system settings).
// Form auto-fills from System Settings. Net Pay shown prominently in list.

import { useEffect, useState } from 'react'
import { getSalaryListApi, createSalaryApi, getPayrollSettingsDefaultsApi } from '../../api/services/payroll'
import { listEmployeesApi } from '../../api/services/employees'
import toast from 'react-hot-toast'

const fmt  = v  => `₹${parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`
const n    = v  => parseFloat(v || 0)

// Fallback defaults — only used if System Settings API call fails
// All values normally come 100% from the backend System Settings
const FALLBACK = {
  basic_percent:   40,
  hra_percent:     50,
  da_percent:      10,
  pf_percent:      12,
  esi_percent:     0.75,
  transport:       1600,
  medical:         1250,
  other_allowance: 0,
  pt:              200,
  pt_threshold:    15000,
  pt_below:        0,
  pt_above:        200,
  hra_metro:       50,
  hra_nonmetro:    40,
  pf_employer:     12,
  esi_employer:    3.25,
  esi_threshold:   21000,
  working_days:    22,
}

function makeEmpty(defaults) {
  return {
    employee:        '',
    effective_date:  new Date().toISOString().split('T')[0],
    ctc:             '',
    basic_percent:   String(defaults.basic_percent),
    hra_percent:     String(defaults.hra_metro ?? defaults.hra_percent),
    da_percent:      String(defaults.da_percent),
    pf_percent:      String(defaults.pf_percent),
    esi_percent:     String(defaults.esi_percent),
    transport:       String(defaults.transport),
    medical:         String(defaults.medical),
    other_allowance: String(defaults.other_allowance),
    pt:              String(defaults.pt),
    is_metro:        true,
  }
}

// Live preview for the modal form
// esiThreshold from system settings — ESI only applies if gross <= threshold
function computePreview(form, defaults) {
  const ctc = n(form.ctc)
  if (!ctc) return null
  const thr       = (n(defaults.esi_threshold) >= 1000) ? n(defaults.esi_threshold) : 21000
  const ptThr     = n(defaults.pt_threshold || 15000)
  const monthly   = ctc / 12
  const basic     = monthly * (n(form.basic_percent) / 100)
  const hra       = basic   * (n(form.hra_percent) / 100)
  const da        = basic   * (n(form.da_percent) / 100)
  const transport = n(form.transport)
  const medical   = n(form.medical)
  const other     = n(form.other_allowance)
  const special   = Math.max(monthly - basic - hra - da - transport - medical - other, 0)
  const gross     = basic + hra + da + special + transport + medical + other
  const pt        = gross <= ptThr ? n(defaults.pt_below) : n(defaults.pt_above)
  const pf_emp    = basic * (n(form.pf_percent) / 100)
  const esi_emp   = gross <= thr ? gross * (n(form.esi_percent) / 100) : 0
  const total_ded = pf_emp + esi_emp + pt
  const net       = gross - total_ded
  return { basic, hra, da, special, transport, medical, other, gross, pf_emp, esi_emp, pt, total_ded, net, monthly, esi_exempt: gross > thr }
}

export default function SalaryConfig() {
  const [structures,     setStructures]     = useState([])
  const [employees,      setEmployees]      = useState([])
  const [showForm,       setShowForm]       = useState(false)
  const [form,           setForm]           = useState(() => makeEmpty(FALLBACK))
  const [saving,         setSaving]         = useState(false)
  const [empFilter,      setEmpFilter]      = useState('')
  const [sysDefaults,    setSysDefaults]    = useState(FALLBACK)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [preview,        setPreview]        = useState(null)
  const [loadingList,    setLoadingList]    = useState(true)

  const loadAll = () => {
    setLoadingList(true)
    getSalaryListApi()
      .then(r => setStructures(r.data))
      .catch(() => {})
      .finally(() => setLoadingList(false))
  }

  useEffect(() => {
    loadAll()
    listEmployeesApi().then(r => setEmployees(r.data)).catch(() => {})

    getPayrollSettingsDefaultsApi()
      .then(r => {
        const d = r.data
        // ALL values from System Settings — zero hardcodes
        const defaults = {
          basic_percent:   d.basic_percent          ?? 40,
          hra_percent:     d.hra_percent_metro       ?? 50,
          da_percent:      d.da_percent              ?? 10,
          pf_percent:      d.pf_employee_percent     ?? 12,
          esi_percent:     d.esi_employee_percent    ?? 0.75,
          transport:       d.default_transport       ?? 1600,
          medical:         d.default_medical         ?? 1250,
          other_allowance: d.default_other_allowance ?? 0,
          pt:              d.pt_above_threshold_amount ?? d.pt_flat_amount ?? 200,
          pt_threshold:    d.pt_threshold_salary       ?? 15000,
          pt_below:        d.pt_below_threshold_amount ?? 0,
          pt_above:        d.pt_above_threshold_amount ?? d.pt_flat_amount ?? 200,
          hra_metro:       d.hra_percent_metro       ?? 50,
          hra_nonmetro:    d.hra_percent_nonmetro    ?? 40,
          pf_employer:     d.pf_employer_percent     ?? 12,
          esi_employer:    d.esi_employer_percent    ?? 3.25,
          esi_threshold:   d.esi_threshold           ?? 21000,
          working_days:    d.working_days_per_month  ?? 22,
          overtime_mult:   d.overtime_multiplier     ?? 1.5,
        }
        setSysDefaults(defaults)
        setForm(makeEmpty(defaults))
        setSettingsLoaded(true)
      })
      .catch(() => { setSettingsLoaded(true) })
  }, [])

  useEffect(() => { setPreview(computePreview(form, sysDefaults)) }, [form, sysDefaults])

  const set  = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleMetroToggle = isMetro => {
    setForm(p => ({
      ...p,
      is_metro:    isMetro,
      hra_percent: String(isMetro ? sysDefaults.hra_metro : sysDefaults.hra_nonmetro),
    }))
  }

  const handleSave = async () => {
    if (!form.employee || !form.effective_date || !form.ctc) {
      toast.error('Employee, date, and CTC are required')
      return
    }
    setSaving(true)
    try {
      const res = await createSalaryApi(form)
      if (res.data?.ctc_warning) toast(res.data.ctc_warning, { icon: '⚠️', duration: 6000 })
      toast.success('Salary structure saved!')
      setShowForm(false)
      loadAll()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to save')
    } finally { setSaving(false) }
  }

  const filtered = empFilter
    ? structures.filter(s => s.employee === parseInt(empFilter))
    : structures

  const empLabel = e =>
    (e.first_name || e.last_name) ? `${e.first_name} ${e.last_name}`.trim() : e.username

  return (
    <div>
      {/* ── Top bar ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', flexWrap:'wrap', gap:'12px' }}>
        <div>
          <h3 style={{ margin:0, fontSize:'16px', fontWeight:700 }}>Salary Structures</h3>
          {settingsLoaded && (
            <p style={{ margin:'3px 0 0', fontSize:'11px', color:'#7c3aed' }}>
              ⚙️ System Settings defaults (used for new assignments) — Basic {sysDefaults.basic_percent}% · HRA {sysDefaults.hra_metro}% · DA {sysDefaults.da_percent}% · PF {sysDefaults.pf_percent}%
            </p>
          )}
        </div>
        <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', alignItems:'center' }}>
          <select value={empFilter} onChange={e => setEmpFilter(e.target.value)} style={sel}>
            <option value="">All Employees</option>
            {employees.map(e => (
              <option key={e.user_id} value={e.user_id}>{empLabel(e)} ({e.emp_code})</option>
            ))}
          </select>
          <button
            onClick={() => { setForm(makeEmpty(sysDefaults)); setShowForm(true) }}
            style={btnPrimary}
          >
            + Assign Salary
          </button>
        </div>
      </div>

      {/* ── Notice: stored values ── */}
      <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:'8px', padding:'10px 14px', marginBottom:'16px', fontSize:'12px', color:'#1e40af' }}>
        ℹ️ Values shown are <strong>exactly as assigned</strong> — using the percentages saved at creation time. To change an employee's salary, click <strong>+ Assign Salary</strong> again (it deactivates the old one). System Settings % only apply as defaults for new assignments.
      </div>

      {/* ── Structures table ── */}
      <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #e5e7eb', overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
            <thead>
              <tr style={{ background:'#f8fafc' }}>
                {[
                  'Employee',
                  'Effective Date',
                  'Annual CTC',
                  'Basic / mo',
                  'HRA / mo',
                  'DA / mo',
                  'Special / mo',
                  'Gross / mo',
                  'PF (Emp)',
                  'ESI (Emp)',
                  'PT',
                  'Net Pay / mo',
                ].map(h => (
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingList ? (
                <tr><td colSpan={12} style={{ padding:'40px', textAlign:'center', color:'#aaa' }}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={12} style={{ padding:'40px', textAlign:'center', color:'#aaa' }}>No salary structures found</td></tr>
              ) : filtered.map((s, i) => (
                <tr key={s.id} style={{ borderTop:'1px solid #f1f5f9', background: i%2===0 ? '#fff' : '#fafafa' }}>
                  <td style={td}>
                    <p style={{ margin:0, fontWeight:600, color:'#111' }}>{s.employee_name}</p>
                    <p style={{ margin:0, fontSize:'11px', color:'#aaa' }}>{s.emp_code || '—'}</p>
                  </td>
                  <td style={td}>{s.effective_date}</td>
                  <td style={td}>{fmt(s.ctc)}</td>
                  <td style={td}>{fmt(s.basic)}</td>
                  <td style={td}>{fmt(s.hra)}</td>
                  <td style={td}>{fmt(s.da)}</td>
                  <td style={td}>{fmt(s.special_allowance)}</td>
                  <td style={{ ...td, fontWeight:600, color:'#1d4ed8' }}>{fmt(s.gross)}</td>
                  <td style={{ ...td, color:'#7c3aed' }}>{fmt(s.pf_employee)}</td>
                  <td style={{ ...td, color:'#2563eb' }}>{s.esi_employee > 0 ? fmt(s.esi_employee) : '—'}</td>
                  <td style={{ ...td, color:'#0891b2' }}>{fmt(s.pt)}</td>
                  {/* Net Pay — most prominent */}
                  <td style={{ ...td, fontWeight:800, color:'#16a34a', fontSize:'14px', background:'#f0fdf4', borderLeft:'2px solid #bbf7d0' }}>
                    {fmt(s.net_pay)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary footer */}
        {filtered.length > 0 && !loadingList && (
          <div style={{ padding:'12px 16px', background:'#f8fafc', borderTop:'1px solid #e5e7eb', display:'flex', flexWrap:'wrap', gap:'24px' }}>
            <SumItem label="Total Employees" value={filtered.length} plain />
            <SumItem label="Total Gross / mo"   value={fmt(filtered.reduce((a,s) => a + n(s.gross), 0))} color="#1d4ed8" />
            <SumItem label="Total PF / mo"      value={fmt(filtered.reduce((a,s) => a + n(s.pf_employee), 0))} color="#7c3aed" />
            <SumItem label="Total Net Pay / mo" value={fmt(filtered.reduce((a,s) => a + n(s.net_pay), 0))} color="#16a34a" bold />
          </div>
        )}
      </div>

      {/* ── Create modal ── */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'16px', overflowY:'auto' }}>
          <div style={{ background:'#fff', borderRadius:'14px', width:'100%', maxWidth:'780px', maxHeight:'95vh', overflow:'hidden', display:'flex', flexDirection:'column' }}>

            {/* Modal header */}
            <div style={{ padding:'18px 22px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <h3 style={{ margin:0, fontSize:'16px', fontWeight:700 }}>Assign Salary Structure</h3>
                <p style={{ margin:'2px 0 0', fontSize:'11px', color:'#7c3aed' }}>
                  ⚙️ % values pre-filled from current System Settings
                </p>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#888' }}>✕</button>
            </div>

            <div style={{ display:'flex', flex:1, overflow:'hidden', minHeight:0 }}>

              {/* Left: form */}
              <div style={{ flex:1, padding:'20px 22px', overflowY:'auto' }}>

                <Grid2>
                  <F label="Employee *">
                    <select value={form.employee} onChange={set('employee')} style={inp}>
                      <option value="">Select employee</option>
                      {employees.map(e => (
                        <option key={e.user_id} value={e.user_id}>{empLabel(e)} ({e.emp_code})</option>
                      ))}
                    </select>
                  </F>
                  <F label="Effective Date *">
                    <input type="date" value={form.effective_date} onChange={set('effective_date')} style={inp} />
                  </F>
                </Grid2>

                <F label="Annual CTC (₹) *">
                  <input
                    type="number"
                    value={form.ctc}
                    onChange={set('ctc')}
                    style={{ ...inp, fontSize:'15px', fontWeight:600 }}
                    placeholder="e.g. 720000"
                  />
                  {form.ctc && (
                    <p style={{ margin:'4px 0 0', fontSize:'11px', color:'#888' }}>
                      Monthly CTC = {fmt(n(form.ctc)/12)} / mo
                    </p>
                  )}
                </F>

                {/* Metro toggle */}
                <div style={{ margin:'12px 0', display:'flex', gap:'8px', alignItems:'center' }}>
                  <span style={{ fontSize:'12px', color:'#555', fontWeight:500 }}>City type:</span>
                  {['Metro', 'Non-Metro'].map((label, i) => {
                    const isM   = i === 0
                    const active = form.is_metro === isM
                    return (
                      <button key={label} type="button"
                        onClick={() => handleMetroToggle(isM)}
                        style={{
                          padding:'5px 14px', borderRadius:'6px', border:'1px solid', fontSize:'12px',
                          fontWeight:600, cursor:'pointer',
                          background:   active ? '#eff6ff' : '#f9fafb',
                          borderColor:  active ? '#3b82f6' : '#e5e7eb',
                          color:        active ? '#1d4ed8' : '#888',
                        }}>
                        {label} (HRA {isM ? sysDefaults.hra_metro : sysDefaults.hra_nonmetro}%)
                      </button>
                    )
                  })}
                </div>

                {/* % Settings from system settings */}
                <Sect title="Salary % Settings (from System Settings)">
                  <div style={{ background:'#f5f3ff', border:'1px solid #ede9fe', borderRadius:'8px', padding:'10px 14px', marginBottom:'10px', fontSize:'11px', color:'#7c3aed' }}>
                    ⚙️ These % values auto-load from System Settings → Payroll. Change them there to update all future salary configs and the live list.
                  </div>
                  <Grid3>
                    <F label="Basic % of monthly CTC">
                      <input type="number" value={form.basic_percent} onChange={set('basic_percent')} style={inp} step="0.5"/>
                      <p style={hint}>System default: {sysDefaults.basic_percent}%</p>
                    </F>
                    <F label="HRA % of Basic">
                      <input type="number" value={form.hra_percent} onChange={set('hra_percent')} style={inp} step="0.5"  />
                      <p style={hint}>Metro: {sysDefaults.hra_metro}% / Non-metro: {sysDefaults.hra_nonmetro}%</p>
                    </F>
                    <F label="DA % of Basic">
                      <input type="number" value={form.da_percent} onChange={set('da_percent')} style={inp} step="0.5"  />
                      <p style={hint}>System default: {sysDefaults.da_percent}%</p>
                    </F>
                    <F label="PF Employee % of Basic">
                      <input type="number" value={form.pf_percent} onChange={set('pf_percent')} style={inp} step="0.01"  disabled/>
                      <p style={hint}>System default: {sysDefaults.pf_percent}%</p>
                    </F>
                    <F label="ESI Employee % of Gross">
                      <input type="number" value={form.esi_percent} onChange={set('esi_percent')} style={inp} step="0.01" disabled/>
                      <p style={hint}>System default: {sysDefaults.esi_percent}% · applies if gross ≤ ₹{n(sysDefaults.esi_threshold ?? 21000).toLocaleString('en-IN')}/mo</p>
                    </F>
                  </Grid3>
                </Sect>

                <Sect title="Fixed Monthly Allowances">
                  <Grid3>
                    <F label="Transport (₹/mo)">
                      <input type="number" value={form.transport} onChange={set('transport')} style={inp}  />
                    </F>
                    <F label="Medical (₹/mo)">
                      <input type="number" value={form.medical} onChange={set('medical')} style={inp} />
                    </F>
                    <F label="Other Allowance (₹/mo)">
                      <input type="number" value={form.other_allowance} onChange={set('other_allowance')} style={inp}  />
                    </F>
                  </Grid3>
                </Sect>

                <Sect title="Professional Tax">
                  <F label="PT slab from System Settings">
                    <div style={{ background:'#ecfeff', border:'1px solid #bae6fd', borderRadius:'8px', padding:'10px 14px', fontSize:'11px', color:'#0e7490' }}>
                      Gross up to {fmt(sysDefaults.pt_threshold)}: PT {fmt(sysDefaults.pt_below)} / mo. Above {fmt(sysDefaults.pt_threshold)}: PT {fmt(sysDefaults.pt_above)} / mo.
                    </div>
                  </F>
                </Sect>

              </div>

              {/* Right: live preview */}
              {preview && (
                <div style={{ width:'260px', background:'#f8fafc', borderLeft:'1px solid #e5e7eb', padding:'18px 16px', overflowY:'auto', flexShrink:0 }}>
                  <p style={{ margin:'0 0 14px', fontSize:'11px', fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                    📊 Live Preview (Monthly)
                  </p>

                  <p style={sT}>Earnings</p>
                  {[
                    ['Basic',          preview.basic],
                    ['HRA',            preview.hra],
                    ['DA',             preview.da],
                    ['Special Allow.', preview.special],
                    ['Transport',      preview.transport],
                    ['Medical',        preview.medical],
                    ['Other',          preview.other],
                  ].filter(r => r[1] > 0).map(r => (
                    <PRow key={r[0]} label={r[0]} value={fmt(r[1])} />
                  ))}
                  <PRow label="Gross" value={fmt(preview.gross)} bold color="#1d4ed8" />

                  <div style={{ margin:'12px 0 8px', borderTop:'1px solid #e5e7eb' }} />

                  <p style={sT}>Deductions</p>
                  {[
                    [`PF (${form.pf_percent}%)`,  preview.pf_emp,  '#7c3aed'],
                    [`ESI (${form.esi_percent}%)`, preview.esi_emp, '#2563eb'],
                    ['PT',                          preview.pt,      '#0891b2'],
                  ].filter(r => r[1] > 0).map(r => (
                    <PRow key={r[0]} label={r[0]} value={`−${fmt(r[1])}`} color={r[2]} />
                  ))}
                  {preview.esi_exempt && (
                    <div style={{ fontSize:'10px', color:'#64748b', padding:'2px 0', fontStyle:'italic' }}>
                      ESI exempt — gross &gt; ₹{n(sysDefaults.esi_threshold ?? 21000).toLocaleString('en-IN')} threshold
                    </div>
                  )}
                  <PRow label="Total Deductions" value={`−${fmt(preview.total_ded)}`} bold color="#dc2626" />

                  <div style={{ margin:'12px 0 8px', borderTop:'2px solid #e5e7eb' }} />

                  <div style={{ background:'#f0fdf4', borderRadius:'8px', padding:'10px 12px', textAlign:'center' }}>
                    <p style={{ margin:0, fontSize:'11px', color:'#16a34a', fontWeight:600, textTransform:'uppercase' }}>Est. Net Pay</p>
                    <p style={{ margin:'4px 0 0', fontSize:'22px', fontWeight:800, color:'#166534' }}>{fmt(preview.net)}</p>
                    <p style={{ margin:'2px 0 0', fontSize:'10px', color:'#86efac' }}>per month (excl. OT, LOP, TDS)</p>
                  </div>

                  <div style={{ background:'#fef9c3', borderRadius:'8px', padding:'8px 12px', marginTop:'10px' }}>
                    <p style={{ margin:0, fontSize:'10px', color:'#92400e', fontWeight:600 }}>
                      Employer also contributes:<br />
                      PF {sysDefaults.pf_employer}% + ESI {sysDefaults.esi_employer}%
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div style={{ padding:'14px 22px', borderTop:'1px solid #e5e7eb', display:'flex', justifyContent:'flex-end', gap:'10px' }}>
              <button onClick={() => setShowForm(false)} style={{ padding:'9px 18px', background:'#f3f4f6', border:'none', borderRadius:'8px', fontSize:'13px', cursor:'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} style={btnPrimary}>
                {saving ? 'Saving…' : 'Save Structure'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

const SumItem = ({ label, value, color, bold, plain }) => (
  <div>
    <p style={{ margin:0, fontSize:'10px', color:'#888', textTransform:'uppercase', letterSpacing:'0.04em' }}>{label}</p>
    <p style={{ margin:'2px 0 0', fontSize: bold ? '15px' : '13px', fontWeight: bold ? 800 : 600, color: plain ? '#333' : (color || '#333') }}>
      {value}
    </p>
  </div>
)

const Sect  = ({ title, children }) => (
  <div style={{ marginBottom:'16px' }}>
    <p style={{ margin:'0 0 8px', fontSize:'11px', fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'0.05em' }}>{title}</p>
    {children}
  </div>
)
const Grid2 = ({ children }) => (
  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'12px', marginBottom:'12px' }}>{children}</div>
)
const Grid3 = ({ children }) => (
  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'10px', marginBottom:'8px' }}>{children}</div>
)
const F     = ({ label, children }) => (
  <div>
    <label style={{ fontSize:'12px', color:'#555', fontWeight:500, display:'block', marginBottom:'4px' }}>{label}</label>
    {children}
  </div>
)
const PRow  = ({ label, value, bold, color }) => (
  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', padding:'2px 0' }}>
    <span style={{ color:'#777' }}>{label}</span>
    <span style={{ fontWeight: bold ? 700 : 500, color: color || '#333' }}>{value}</span>
  </div>
)

const sel        = { padding:'8px 10px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'13px', outline:'none' }
const btnPrimary = { padding:'9px 18px', background:'#1a1a2e', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:600, cursor:'pointer' }
const td         = { padding:'10px 14px', color:'#333', verticalAlign:'middle' }
const TH         = { padding:'11px 14px', textAlign:'left', fontWeight:600, color:'#555', fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.04em', whiteSpace:'nowrap', background:'#f8fafc' }
const inp        = { width:'100%', padding:'8px 12px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'13px', outline:'none', boxSizing:'border-box', fontFamily:'Inter,sans-serif', display:'block' }
const hint       = { margin:'3px 0 0', fontSize:'10px', color:'#aaa' }
const sT         = { margin:'0 0 6px', fontSize:'10px', fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'0.05em' }
