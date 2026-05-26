// src/pages/payroll/SalaryConfig.jsx — FULL REPLACEMENT
// Auto-fill from System Settings: when CTC typed, all % fields compute from live settings.
// If admin changed da_percent to 15% in System Settings, form auto-fills 15% instantly.
import { useEffect, useState, useCallback } from 'react'
import { getSalaryListApi, createSalaryApi, getPayrollSettingsDefaultsApi } from '../../api/services/payroll'
import { listEmployeesApi } from '../../api/services/employees'
import toast from 'react-hot-toast'

const fmt = v => `₹${parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`
const n   = v => parseFloat(v || 0)

// Fallback defaults (overridden by system settings on load)
const FALLBACK = {
  basic_percent:  40,
  hra_percent:    50,
  da_percent:     10,
  pf_percent:     12,
  esi_percent:    0.75,
  transport:      1600,
  medical:        1250,
  other_allowance:0,
  pt:             200,
}

function makeEmpty(defaults) {
  return {
    employee:        '',
    effective_date:  new Date().toISOString().split('T')[0],
    ctc:             '',
    basic_percent:   String(defaults.basic_percent),
    hra_percent:     String(defaults.hra_percent),
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

// Live preview computation
function computePreview(form) {
  const ctc         = n(form.ctc)
  if (!ctc) return null
  const monthly     = ctc / 12
  const basicPct    = n(form.basic_percent) / 100
  const hraPct      = n(form.hra_percent)   / 100
  const daPct       = n(form.da_percent)    / 100
  const pfPct       = n(form.pf_percent)    / 100
  const esiPct      = n(form.esi_percent)   / 100
  const transport   = n(form.transport)
  const medical     = n(form.medical)
  const other       = n(form.other_allowance)
  const pt          = n(form.pt)

  const basic       = monthly * basicPct
  const hra         = basic   * hraPct
  const da          = basic   * daPct
  const gross       = basic + hra + da + transport + medical + other
  const pf_emp      = basic * pfPct
  const esi_emp     = gross <= 21000 ? gross * esiPct : 0
  const special     = Math.max(monthly - basic - hra - da - transport - medical - other, 0)
  const total_ded   = pf_emp + esi_emp + pt
  const net         = gross + special - total_ded

  return { basic, hra, da, special, transport, medical, other, gross: gross + special, pf_emp, esi_emp, pt, total_ded, net, monthly }
}

export default function SalaryConfig() {
  const [structures,    setStructures]    = useState([])
  const [employees,     setEmployees]     = useState([])
  const [showForm,      setShowForm]      = useState(false)
  const [form,          setForm]          = useState(() => makeEmpty(FALLBACK))
  const [saving,        setSaving]        = useState(false)
  const [empFilter,     setEmpFilter]     = useState('')
  const [sysDefaults,   setSysDefaults]   = useState(FALLBACK)
  const [settingsLoaded,setSettingsLoaded]= useState(false)
  const [preview,       setPreview]       = useState(null)

  // Load system setting defaults on mount
  useEffect(() => {
    getSalaryListApi().then(r => setStructures(r.data)).catch(() => {})
    listEmployeesApi().then(r => setEmployees(r.data)).catch(() => {})

    getPayrollSettingsDefaultsApi()
      .then(r => {
        const d = r.data
        const defaults = {
          basic_percent:   d.basic_percent  ?? 40,
          hra_percent:     d.hra_percent_metro ?? 50,
          da_percent:      d.da_percent     ?? 10,
          pf_percent:      d.pf_employee_percent ?? 12,
          esi_percent:     d.esi_employee_percent ?? 0.75,
          transport:       1600,
          medical:         1250,
          other_allowance: 0,
          pt:              200,
          esi_threshold:   d.esi_threshold  ?? 21000,
          hra_metro:       d.hra_percent_metro    ?? 50,
          hra_nonmetro:    d.hra_percent_nonmetro ?? 40,
          pf_employer:     d.pf_employer_percent  ?? 12,
          esi_employer:    d.esi_employer_percent ?? 3.25,
          overtime_mult:   d.overtime_multiplier  ?? 1.5,
        }
        setSysDefaults(defaults)
        setForm(makeEmpty(defaults))
        setSettingsLoaded(true)
      })
      .catch(() => { setSettingsLoaded(true) })
  }, [])

  // Recompute preview whenever form changes
  useEffect(() => {
    setPreview(computePreview(form))
  }, [form])

  const set  = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const setV = (k, v) => setForm(p => ({ ...p, [k]: v }))

  // When CTC changes → auto-fill hra based on metro/non-metro toggle
  const handleCtcChange = e => {
    const ctc = e.target.value
    setForm(p => ({ ...p, ctc }))
  }

  // Metro toggle changes HRA%
  const handleMetroToggle = isMetro => {
    setForm(p => ({
      ...p,
      is_metro:   isMetro,
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
      const r = await getSalaryListApi()
      setStructures(r.data)
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
      {/* Top bar */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', flexWrap:'wrap', gap:'12px' }}>
        <div>
          <h3 style={{ margin:0, fontSize:'16px', fontWeight:700 }}>Salary Structures</h3>
          {settingsLoaded && (
            <p style={{ margin:'3px 0 0', fontSize:'11px', color:'#7c3aed' }}>
              📐 Auto-fill from System Settings: Basic {sysDefaults.basic_percent}% · HRA {sysDefaults.hra_metro}% (metro) · DA {sysDefaults.da_percent}% · PF {sysDefaults.pf_percent}%
            </p>
          )}
        </div>
        <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
          <select value={empFilter} onChange={e => setEmpFilter(e.target.value)} style={sel}>
            <option value="">All Employees</option>
            {employees.map(e => (
              <option key={e.user_id} value={e.user_id}>{empLabel(e)} ({e.emp_code})</option>
            ))}
          </select>
          <button onClick={() => { setForm(makeEmpty(sysDefaults)); setShowForm(true) }} style={btnPrimary}>
            + Assign Salary
          </button>
        </div>
      </div>

      {/* Structures table */}
      <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #e5e7eb', overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
            <thead>
              <tr style={{ background:'#f8fafc' }}>
                {['Employee','Effective','CTC/yr','Basic/mo','HRA/mo','DA/mo','PF/mo','ESI/mo','Net Pay/mo'].map(h => (
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ padding:'40px', textAlign:'center', color:'#aaa' }}>No salary structures found</td></tr>
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
                  <td style={td}>{fmt(s.pf_employee)}</td>
                  <td style={td}>{fmt(s.esi_employee) || '—'}</td>
                  <td style={{ ...td, fontWeight:700, color:'#16a34a' }}>{fmt(s.net_pay)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create modal */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'16px', overflowY:'auto' }}>
          <div style={{ background:'#fff', borderRadius:'14px', width:'100%', maxWidth:'760px', maxHeight:'95vh', overflow:'hidden', display:'flex', flexDirection:'column' }}>

            {/* Modal header */}
            <div style={{ padding:'18px 22px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <h3 style={{ margin:0, fontSize:'16px', fontWeight:700 }}>Assign Salary Structure</h3>
                <p style={{ margin:'2px 0 0', fontSize:'11px', color:'#7c3aed' }}>
                  📐 All % values pre-filled from System Settings — change there to update defaults
                </p>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#888' }}>✕</button>
            </div>

            <div style={{ display:'flex', flex:1, overflow:'hidden', minHeight:0 }}>
              {/* Left: form */}
              <div style={{ flex:1, padding:'20px 22px', overflowY:'auto' }}>

                {/* Employee + Date */}
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

                {/* CTC */}
                <F label="Annual CTC (₹) *">
                  <input type="number" value={form.ctc} onChange={handleCtcChange} style={{ ...inp, fontSize:'15px', fontWeight:600 }} placeholder="720000" />
                  {form.ctc && <p style={{ margin:'4px 0 0', fontSize:'11px', color:'#888' }}>Monthly CTC = {fmt(n(form.ctc)/12)}/mo</p>}
                </F>

                {/* Metro toggle */}
                <div style={{ margin:'12px 0', display:'flex', gap:'8px', alignItems:'center' }}>
                  <span style={{ fontSize:'12px', color:'#555', fontWeight:500 }}>City type:</span>
                  {['Metro', 'Non-Metro'].map((label, i) => {
                    const isM = i === 0
                    const active = form.is_metro === isM
                    return (
                      <button key={label} type="button"
                        onClick={() => handleMetroToggle(isM)}
                        style={{ padding:'5px 14px', borderRadius:'6px', border:'1px solid', fontSize:'12px', fontWeight:600, cursor:'pointer',
                          background: active ? '#eff6ff' : '#f9fafb',
                          borderColor: active ? '#3b82f6' : '#e5e7eb',
                          color: active ? '#1d4ed8' : '#888' }}>
                        {label} (HRA {isM ? sysDefaults.hra_metro : sysDefaults.hra_nonmetro}%)
                      </button>
                    )
                  })}
                </div>

                {/* Percentage settings — all from system settings */}
                <Sect title={`Salary % Settings (from System Settings)`}>
                  <div style={{ background:'#f5f3ff', border:'1px solid #ede9fe', borderRadius:'8px', padding:'10px 14px', marginBottom:'10px', fontSize:'11px', color:'#7c3aed' }}>
                    ⚙️ These % values are auto-loaded from System Settings → Payroll Settings. Change them there to update all future salary configs.
                  </div>
                  <Grid3>
                    <F label={`Basic % of CTC monthly`}>
                      <input type="number" value={form.basic_percent} onChange={set('basic_percent')} style={inp} step="0.5" />
                      <p style={hint}>Default: {sysDefaults.basic_percent}%</p>
                    </F>
                    <F label={`HRA % of Basic`}>
                      <input type="number" value={form.hra_percent} onChange={set('hra_percent')} style={inp} step="0.5" />
                      <p style={hint}>Metro: {sysDefaults.hra_metro}% / Non-metro: {sysDefaults.hra_nonmetro}%</p>
                    </F>
                    <F label={`DA % of Basic`}>
                      <input type="number" value={form.da_percent} onChange={set('da_percent')} style={inp} step="0.5" />
                      <p style={hint}>Default: {sysDefaults.da_percent}%</p>
                    </F>
                    <F label={`PF Employee % of Basic`}>
                      <input type="number" value={form.pf_percent} onChange={set('pf_percent')} style={inp} step="0.01" />
                      <p style={hint}>Default: {sysDefaults.pf_percent}%</p>
                    </F>
                    <F label={`ESI Employee % of Gross`}>
                      <input type="number" value={form.esi_percent} onChange={set('esi_percent')} style={inp} step="0.01" />
                      <p style={hint}>Default: {sysDefaults.esi_percent}% (if gross ≤ ₹{sysDefaults.esi_threshold?.toLocaleString('en-IN')})</p>
                    </F>
                  </Grid3>
                </Sect>

                {/* Fixed allowances */}
                <Sect title="Fixed Monthly Allowances">
                  <Grid3>
                    <F label="Transport (₹/mo)">
                      <input type="number" value={form.transport} onChange={set('transport')} style={inp} />
                    </F>
                    <F label="Medical (₹/mo)">
                      <input type="number" value={form.medical} onChange={set('medical')} style={inp} />
                    </F>
                    <F label="Other Allowance (₹/mo)">
                      <input type="number" value={form.other_allowance} onChange={set('other_allowance')} style={inp} />
                    </F>
                  </Grid3>
                </Sect>

                {/* PT */}
                <Sect title="Professional Tax">
                  <F label="PT (₹/mo) — override if needed">
                    <input type="number" value={form.pt} onChange={set('pt')} style={inp} />
                    <p style={hint}>Auto-computed by engine from PT slabs in System Settings. Set 0 to use slab.</p>
                  </F>
                </Sect>

              </div>

              {/* Right: live preview */}
              {preview && (
                <div style={{ width:'260px', background:'#f8fafc', borderLeft:'1px solid #e5e7eb', padding:'18px 16px', overflowY:'auto', flexShrink:0 }}>
                  <p style={{ margin:'0 0 14px', fontSize:'11px', fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                    📊 Live Preview (Monthly)
                  </p>

                  {/* Earnings */}
                  <p style={sT}>Earnings</p>
                  {[
                    ['Basic',           preview.basic],
                    ['HRA',             preview.hra],
                    ['DA',              preview.da],
                    ['Special Allow.',  preview.special],
                    ['Transport',       preview.transport],
                    ['Medical',         preview.medical],
                    ['Other',           preview.other],
                  ].filter(r => r[1] > 0).map(r => (
                    <PRow key={r[0]} label={r[0]} value={fmt(r[1])} />
                  ))}
                  <PRow label="Gross" value={fmt(preview.gross)} bold color="#1d4ed8" />

                  <div style={{ margin:'12px 0 8px', borderTop:'1px solid #e5e7eb' }} />

                  {/* Deductions */}
                  <p style={sT}>Deductions</p>
                  {[
                    [`PF (${form.pf_percent}% of Basic)`, preview.pf_emp,  '#7c3aed'],
                    [`ESI (${form.esi_percent}% of Gross)`,preview.esi_emp,'#2563eb'],
                    ['Professional Tax',                    preview.pt,     '#0891b2'],
                  ].filter(r => r[1] > 0).map(r => (
                    <PRow key={r[0]} label={r[0]} value={`−${fmt(r[1])}`} color={r[2]} />
                  ))}
                  <PRow label="Total Deductions" value={`−${fmt(preview.total_ded)}`} bold color="#dc2626" />

                  <div style={{ margin:'12px 0 8px', borderTop:'2px solid #e5e7eb' }} />

                  {/* Net pay */}
                  <div style={{ background:'#f0fdf4', borderRadius:'8px', padding:'10px 12px', textAlign:'center', marginTop:'8px' }}>
                    <p style={{ margin:0, fontSize:'11px', color:'#16a34a', fontWeight:600, textTransform:'uppercase' }}>Est. Net Pay</p>
                    <p style={{ margin:'4px 0 0', fontSize:'20px', fontWeight:800, color:'#166534' }}>{fmt(preview.net)}</p>
                    <p style={{ margin:'2px 0 0', fontSize:'10px', color:'#86efac' }}>per month (excl. OT, LOP, TDS)</p>
                  </div>

                  {/* Employer cost note */}
                  <div style={{ background:'#fef9c3', borderRadius:'8px', padding:'8px 12px', marginTop:'10px' }}>
                    <p style={{ margin:0, fontSize:'10px', color:'#92400e', fontWeight:600 }}>
                      Employer also contributes:<br />
                      PF {sysDefaults.pf_employer}% + ESI {sysDefaults.esi_employer}% on top of gross
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div style={{ padding:'14px 22px', borderTop:'1px solid #e5e7eb', display:'flex', justifyContent:'flex-end', gap:'10px' }}>
              <button onClick={() => setShowForm(false)} style={{ padding:'9px 18px', background:'#f3f4f6', border:'none', borderRadius:'8px', fontSize:'13px', cursor:'pointer' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ padding:'9px 22px', background:'#1a1a2e', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
                {saving ? 'Saving…' : 'Save Structure'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Sub-components
const Sect  = ({ title, children }) => (
  <div style={{ marginBottom:'16px' }}>
    <p style={{ margin:'0 0 8px', fontSize:'11px', fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'0.05em' }}>{title}</p>
    {children}
  </div>
)
const Grid2 = ({ children }) => <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'12px', marginBottom:'12px' }}>{children}</div>
const Grid3 = ({ children }) => <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'10px', marginBottom:'8px' }}>{children}</div>
const F     = ({ label, children }) => <div><label style={{ fontSize:'12px', color:'#555', fontWeight:500, display:'block', marginBottom:'4px' }}>{label}</label>{children}</div>
const PRow  = ({ label, value, bold, color }) => (
  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', padding:'2px 0' }}>
    <span style={{ color:'#777' }}>{label}</span>
    <span style={{ fontWeight: bold ? 700 : 500, color: color || '#333' }}>{value}</span>
  </div>
)

const sel       = { padding:'8px 10px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'13px', outline:'none' }
const btnPrimary= { padding:'9px 18px', background:'#1a1a2e', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:600, cursor:'pointer' }
const td        = { padding:'10px 14px', color:'#333', verticalAlign:'middle' }
const TH        = { padding:'11px 14px', textAlign:'left', fontWeight:600, color:'#555', fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.04em', whiteSpace:'nowrap' }
const inp       = { width:'100%', padding:'8px 12px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'13px', outline:'none', boxSizing:'border-box', fontFamily:'Inter,sans-serif', display:'block' }
const hint      = { margin:'3px 0 0', fontSize:'10px', color:'#aaa' }
const sT        = { margin:'0 0 6px', fontSize:'10px', fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'0.05em' }