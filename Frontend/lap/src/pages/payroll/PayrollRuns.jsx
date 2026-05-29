// src/pages/payroll/PayrollRuns.jsx — FULL REPLACEMENT
// All 11 payroll settings shown dynamically from /api/payroll/settings-defaults/
// Lock day enforced: if today < lock_day and run month = current month → blocked
// Per-row deduction labels show ACTUAL % from settings (not hardcoded 12%/0.75%)
import { useEffect, useState } from 'react'
import {
  getRunsApi, createRunApi, processRunApi,
  approveRunApi, getRunDetailApi, addAdjustmentApi,
  getPayrollSettingsDefaultsApi,
} from '../../api/services/payroll'
import usePermission from '../../hooks/usePermission'
import toast from 'react-hot-toast'

// ── Responsive hook ───────────────────────────────────────────────────────────
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

const MONTHS      = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTHS_FULL = ['','January','February','March','April','May','June','July','August','September','October','November','December']
const fmt = v => `₹${parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:2})}`
const n   = v => parseFloat(v||0)
const runPeriodLabel = run => {
  if (!run?.period_start || !run?.period_end || run.period_label === 'Full month') return 'Full month'
  return `${run.period_start} to ${run.period_end}`
}

const STATUS_STYLE = {
  draft:     { bg:'#f3f4f6', color:'#6b7280', dot:'#9ca3af' },
  processed: { bg:'#fef9c3', color:'#854d0e', dot:'#eab308' },
  approved:  { bg:'#dbeafe', color:'#1e40af', dot:'#3b82f6' },
  locked:    { bg:'#dcfce7', color:'#166534', dot:'#22c55e' },
}

// ── Deduction panel ───────────────────────────────────────────────────────────
function DeductionPanel({ e, settings }) {
  const pfPct  = settings?.pf_employee_percent  ?? 12
  const esiPct = settings?.esi_employee_percent ?? 0.75

  const items = [
    { label:`PF (${pfPct}% of Basic, prorated)`,                                       value:n(e.pf_employee),  color:'#7c3aed' },
    { label:`ESI (${esiPct}% gross, prorated)`,                                        value:n(e.esi_employee), color:'#2563eb' },
    { label:'Professional Tax (slab)',                                                  value:n(e.pt),           color:'#0891b2' },
    { label:'TDS',                                                                      value:n(e.tds),          color:'#dc2626' },
    { label:`LOP (${parseFloat(e.lop_days||0).toFixed(1)} days × day-rate)`,          value:n(e.lop_deduction),color:'#ea580c' },
  ].filter(i => i.value > 0)

  if (!items.length) return <span style={{ color:'#aaa', fontSize:'12px' }}>No deductions</span>

  return (
    <div>
      {items.map(i => (
        <div key={i.label} style={{ display:'flex', justifyContent:'space-between', gap:'8px', fontSize:'11px', padding:'2px 0' }}>
          <span style={{ color:'#777' }}>{i.label}</span>
          <span style={{ color:i.color, fontWeight:600, whiteSpace:'nowrap' }}>−{fmt(i.value)}</span>
        </div>
      ))}
      <div style={{ borderTop:'1px solid #e5e7eb', marginTop:'4px', paddingTop:'4px', display:'flex', justifyContent:'space-between', fontSize:'12px' }}>
        <span style={{ fontWeight:700 }}>Total</span>
        <span style={{ fontWeight:700, color:'#dc2626' }}>{fmt(e.total_deductions)}</span>
      </div>
    </div>
  )
}

// ── Settings panel ────────────────────────────────────────────────────────────
function SettingsPanel({ settings }) {
  if (!settings) return (
    <div style={{ background:'#f3f4f6', borderRadius:'8px', padding:'10px 14px', marginBottom:'12px' }}>
      <p style={{ margin:0, fontSize:'12px', color:'#aaa' }}>Loading payroll settings…</p>
    </div>
  )

  const panels = [
    { label:'Basic %',         value:`${settings.basic_percent}% of CTC`,                                 color:'#1d4ed8', icon:'🏦' },
    { label:'HRA (Metro)',     value:`${settings.hra_percent_metro}% of Basic`,                            color:'#0891b2', icon:'🏙' },
    { label:'HRA (Non-Metro)', value:`${settings.hra_percent_nonmetro}% of Basic`,                         color:'#0891b2', icon:'🏘' },
    { label:'DA %',            value:`${settings.da_percent}% of Basic`,                                   color:'#059669', icon:'📈' },
    { label:'PF Employee',     value:`${settings.pf_employee_percent}% of Basic`,                          color:'#7c3aed', icon:'🛡' },
    { label:'PF Employer',     value:`${settings.pf_employer_percent}% of Basic`,                          color:'#7c3aed', icon:'🏢' },
    { label:'ESI Employee',    value:`${settings.esi_employee_percent}% of Gross`,                         color:'#2563eb', icon:'🏥' },
    { label:'ESI Employer',    value:`${settings.esi_employer_percent}% of Gross`,                         color:'#2563eb', icon:'🏢' },
    { label:'ESI Threshold',   value:`≤ ₹${n(settings.esi_threshold).toLocaleString('en-IN')}`,           color:'#0891b2', icon:'📊' },
    { label:'PT Slabs',        value:`<= ${fmt(settings.pt_threshold_salary)}: ${fmt(settings.pt_below_threshold_amount)} / >: ${fmt(settings.pt_above_threshold_amount)}`, color:'#0891b2', icon:'📋' },
    { label:'TDS Contract',    value:`${settings.tds_flat_contract}% flat`,                                color:'#dc2626', icon:'📑' },
    { label:'OT Multiplier',   value:`${settings.overtime_multiplier}×`,                                   color:'#7c3aed', icon:'⏱' },
    { label:'Payroll Lock Day',value:`Day ${settings.payroll_lock_day} of month`,                          color:'#ea580c', icon:'🔒' },
  ]

  return (
    <div style={{ background:'#f5f3ff', border:'1px solid #ede9fe', borderRadius:'10px', padding:'14px 16px', marginBottom:'14px' }}>
      <p style={{ margin:'0 0 10px', fontSize:'11px', fontWeight:700, color:'#7c3aed', textTransform:'uppercase', letterSpacing:'0.05em' }}>
        📐 All 11 Payroll Settings — Applied This Run (Live from System Settings)
      </p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))', gap:'7px' }}>
        {panels.map(s => (
          <div key={s.label} style={{ background:'#fff', borderRadius:'7px', padding:'7px 10px', display:'flex', alignItems:'flex-start', gap:'6px' }}>
            <span style={{ fontSize:'14px', marginTop:'1px' }}>{s.icon}</span>
            <div>
              <p style={{ margin:0, fontSize:'11px', fontWeight:700, color:s.color, lineHeight:1.3 }}>{s.value}</p>
              <p style={{ margin:'2px 0 0', fontSize:'9px', color:'#aaa', textTransform:'uppercase', letterSpacing:'0.04em' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>
      <p style={{ margin:'10px 0 0', fontSize:'10px', color:'#a78bfa', fontStyle:'italic' }}>
        ✏️ Change any value in System Settings → Payroll Settings. Changes take effect on the next payroll run immediately.
      </p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PayrollRuns() {
  const { can } = usePermission()
  const bp      = useBreakpoint()
  const isMobile = bp === 'mobile'
  const isTablet = bp === 'tablet'

  const [runs,      setRuns]      = useState([])
  const [loading,   setLoading]   = useState(false)
  const [creating,  setCreating]  = useState(false)
  const [newRun,    setNewRun]    = useState({ month: new Date().getMonth()+1, year: new Date().getFullYear(), period_start:'', period_end:'' })
  const [selected,  setSelected]  = useState(null)
  const [detail,    setDetail]    = useState(null)
  const [adjEntry,  setAdjEntry]  = useState(null)
  const [adjForm,   setAdjForm]   = useState({ type:'bonus', amount:'', reason:'' })
  const [expandRow, setExpandRow] = useState(null)
  const [settings,  setSettings]  = useState(null)
  const [lockWarn,  setLockWarn]  = useState(null)
  const [processEmployee, setProcessEmployee] = useState('all')
  // mobile: show list or detail view
  const [mobileView, setMobileView] = useState('list') // 'list' | 'detail'

  useEffect(() => {
    load()
    getPayrollSettingsDefaultsApi().then(r => setSettings(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!settings || !selected) { setLockWarn(null); return }
    const today    = new Date()
    const lockDay  = settings.payroll_lock_day ?? 25
    const isCurrent = today.getFullYear() === selected.year && today.getMonth()+1 === selected.month
    if (isCurrent && today.getDate() < lockDay && selected.status === 'draft') {
      const sfx = ['th','st','nd','rd'][Math.min(today.getDate()%10,3)] || 'th'
      setLockWarn(
        `⏳ Payroll for ${MONTHS_FULL[selected.month]} ${selected.year} cannot be processed until day ${lockDay} of this month. ` +
        `Today is ${today.getDate()}${sfx} — ${lockDay - today.getDate()} day(s) remaining. ` +
        `(Change payroll_lock_day in System Settings → Payroll Settings)`
      )
    } else {
      setLockWarn(null)
    }
  }, [selected, settings])

  const load = async () => {
    setLoading(true)
    try { const r = await getRunsApi(); setRuns(r.data) }
    catch { toast.error('Failed to load runs') }
    finally { setLoading(false) }
  }

  const loadDetail = async id => {
    try { const r = await getRunDetailApi(id); setDetail(r.data) }
    catch { toast.error('Failed to load detail') }
  }

  const handleSelect = async run => {
    setSelected(run); setExpandRow(null)
    setProcessEmployee('all')
    await loadDetail(run.id)
    if (isMobile) setMobileView('detail')
  }

  const handleCreate = async () => {
    setCreating(true)
    try {
      const payload = { month:newRun.month, year:newRun.year }
      if (newRun.period_start && newRun.period_end) {
        payload.period_start = newRun.period_start
        payload.period_end = newRun.period_end
      }
      const r = await createRunApi(payload)
      toast.success(r.data?.existing ? 'Payroll run already exists - opened it.' : 'Payroll run created!')
      await load()
      if (r.data?.id) {
        setSelected(r.data)
        setProcessEmployee('all')
        await loadDetail(r.data.id)
        if (isMobile) setMobileView('detail')
      }
    }
    catch (e) { toast.error(e.response?.data?.error || 'Failed to create') }
    finally { setCreating(false) }
  }

  const handleProcess = async (id, employee = 'all') => {
    try {
      const payload = employee && employee !== 'all' ? { employee } : {}
      const r = await processRunApi(id, payload)
      toast.success(`Processed: ${r.data.created} employees`)
      setProcessEmployee('all')
      load(); loadDetail(id)
    } catch (e) { toast.error(e.response?.data?.error || 'Processing failed') }
  }

  const handleApprove = async id => {
    if (!window.confirm('Approve and lock this payroll? This cannot be undone.')) return
    try { await approveRunApi(id); toast.success('Approved & locked!'); load(); loadDetail(id) }
    catch (e) { toast.error(e.response?.data?.error || 'Approval failed') }
  }

  const handleAdjust = async () => {
    if (!adjForm.amount || !adjForm.reason) { toast.error('Amount and reason required'); return }
    try {
      await addAdjustmentApi(adjEntry.id, adjForm)
      toast.success('Adjustment added!')
      setAdjEntry(null); setAdjForm({ type:'bonus', amount:'', reason:'' })
      loadDetail(selected.id)
    } catch (e) { toast.error(e.response?.data?.error || 'Failed') }
  }

  const totals = detail ? {
    gross:  detail.entries.reduce((s,e) => s+n(e.gross), 0),
    net:    detail.entries.reduce((s,e) => s+n(e.net_pay), 0),
    pf:     detail.entries.reduce((s,e) => s+n(e.pf_employee), 0),
    esi:    detail.entries.reduce((s,e) => s+n(e.esi_employee), 0),
    pt:     detail.entries.reduce((s,e) => s+n(e.pt), 0),
    tds:    detail.entries.reduce((s,e) => s+n(e.tds), 0),
    lop:    detail.entries.reduce((s,e) => s+n(e.lop_deduction), 0),
    ot_pay: detail.entries.reduce((s,e) => s+n(e.ot_pay), 0),
    extra:  detail.entries.reduce((s,e) => s+n(e.extra_work_pay), 0),
  } : null

  const payrollEmployees = detail?.available_employees || []
  const remainingPayrollEmployees = payrollEmployees.filter(e => !e.processed && e.has_salary)
  const noRemainingEmployees = detail && remainingPayrollEmployees.length === 0

  // ── Layout decision ───────────────────────────────────────────────────────
  // Desktop/tablet: side-by-side grid when detail is open
  // Mobile: single-column, toggle between list and detail
  const showSideBySide = !isMobile && selected

  // ── Run list ──────────────────────────────────────────────────────────────
  const RunList = (
    <div>
      {can('process_payroll') && (
        <div style={CARD}>
          <p style={{ margin:'0 0 10px', fontSize:'13px', fontWeight:700 }}>➕ New Payroll Run</p>
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
            <select
              value={newRun.month}
              onChange={e => setNewRun(p=>({...p, month:parseInt(e.target.value)}))}
              style={{ ...SEL, flex:'1 1 90px', minWidth:0 }}
            >
              {MONTHS.slice(1).map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
            <input
              type="number" value={newRun.year}
              onChange={e => setNewRun(p=>({...p, year:parseInt(e.target.value)}))}
              style={{ ...SEL, width:'80px', flex:'0 0 80px' }}
            />
            <input
              type="date" value={newRun.period_start}
              onChange={e => setNewRun(p=>({...p, period_start:e.target.value}))}
              title="Split start date"
              style={{ ...SEL, flex:'1 1 142px', minWidth:0 }}
            />
            <input
              type="date" value={newRun.period_end}
              onChange={e => setNewRun(p=>({...p, period_end:e.target.value}))}
              title="Split end date"
              style={{ ...SEL, flex:'1 1 142px', minWidth:0 }}
            />
            <button onClick={handleCreate} disabled={creating} style={{ ...BP, flex:'0 0 auto' }}>
              {creating ? '…' : 'Create'}
            </button>
          </div>
          <p style={{ margin:'8px 0 0', fontSize:'10px', color:'#64748b' }}>
            Leave dates blank for the normal full-month payroll. Select dates for split payroll, for example 1-15 and then 16-end after salary changes.
          </p>
          {settings && (
            <p style={{ margin:'8px 0 0', fontSize:'10px', color:'#ea580c' }}>
              Lock day: <strong>Day 1</strong> - fixed from System Settings
            </p>
          )}
        </div>
      )}

      {loading ? (
        <p style={{ color:'#888', fontSize:'13px', textAlign:'center', padding:'24px 0' }}>Loading…</p>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {runs.map(run => {
            const st    = STATUS_STYLE[run.status] || STATUS_STYLE.draft
            const isSel = selected?.id === run.id
            return (
              <div
                key={run.id}
                onClick={() => handleSelect(run)}
                style={{
                  background:  '#fff',
                  borderRadius:'10px',
                  padding:     '14px 16px',
                  border:      `1px solid ${isSel ? '#1a1a2e' : '#e5e7eb'}`,
                  cursor:      'pointer',
                  boxShadow:   isSel ? '0 0 0 3px rgba(26,26,46,0.12)' : 'none',
                  transition:  'border-color 0.15s, box-shadow 0.15s',
                }}
              >
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                  <span style={{ fontWeight:700, fontSize:'14px' }}>{MONTHS[run.month]} {run.year}</span>
                  <span style={{
                    padding:'2px 8px', borderRadius:'6px', fontSize:'11px', fontWeight:600,
                    background:st.bg, color:st.color,
                    display:'flex', alignItems:'center', gap:'4px', textTransform:'capitalize',
                  }}>
                    <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:st.dot, display:'inline-block' }} />
                    {run.status}
                  </span>
                </div>
                <div style={{ fontSize:'12px', color:'#888', display:'flex', justifyContent:'space-between' }}>
                  <span>{run.entry_count||0} employees</span>
                  <span style={{ fontWeight:600, color:'#16a34a' }}>₹{n(run.total_net_pay).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ fontSize:'11px', color:'#64748b', marginTop:'4px' }}>{runPeriodLabel(run)}</div>
              </div>
            )
          })}
          {!runs.length && (
            <div style={{ textAlign:'center', padding:'40px', color:'#aaa', background:'#fff', borderRadius:'10px', border:'1px solid #e5e7eb' }}>
              No payroll runs yet.
            </div>
          )}
        </div>
      )}
    </div>
  )

  // ── Detail panel ──────────────────────────────────────────────────────────
  const DetailPanel = selected && detail ? (
    <div style={{ minWidth:0 }}>

      {/* Mobile back button */}
      {isMobile && (
        <button
          onClick={() => setMobileView('list')}
          style={{ display:'flex', alignItems:'center', gap:'6px', background:'none', border:'none', color:'#1d4ed8', fontSize:'13px', fontWeight:600, cursor:'pointer', padding:'0 0 14px', fontFamily:'inherit' }}
        >
          ← Back to Runs
        </button>
      )}

      {/* Header card */}
      <div style={{ ...CARD, marginBottom:'14px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'12px' }}>
          <div>
            <h3 style={{ margin:0, fontSize:'17px', fontWeight:700 }}>
              {MONTHS_FULL[detail.run.month]} {detail.run.year} Payroll
            </h3>
            <p style={{ margin:'4px 0 0', fontSize:'12px', color:'#888' }}>
              {detail.entries.length} employees · <strong style={{ textTransform:'capitalize' }}>{detail.run.status}</strong>
              {detail.run.locked_at && <span> · Locked {new Date(detail.run.locked_at).toLocaleDateString()}</span>}
            </p>
            <p style={{ margin:'4px 0 0', fontSize:'11px', color:'#64748b' }}>{runPeriodLabel(detail.run)}</p>
          </div>
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', justifyContent:'flex-end' }}>
            {can('process_payroll') && detail.run.status !== 'locked' && (
              <>
              <select
                value={processEmployee}
                onChange={e => setProcessEmployee(e.target.value)}
                disabled={!!lockWarn || noRemainingEmployees}
                style={{ ...SEL, minWidth:'210px', background: (!!lockWarn || noRemainingEmployees) ? '#f3f4f6' : '#fff' }}
              >
                <option value="all">All remaining employees ({remainingPayrollEmployees.length})</option>
                {payrollEmployees.map(emp => (
                  <option key={emp.id} value={emp.id} disabled={emp.processed || !emp.has_salary}>
                    {emp.emp_code ? `${emp.emp_code} - ` : ''}{emp.name}{emp.processed ? ' - processed' : !emp.has_salary ? ' - no salary' : ''}
                  </option>
                ))}
              </select>
              <button
                onClick={() => !lockWarn && !noRemainingEmployees && handleProcess(detail.run.id, processEmployee)}
                disabled={!!lockWarn || noRemainingEmployees}
                style={{
                  padding:'8px 16px',
                  background: (lockWarn || noRemainingEmployees) ? '#f3f4f6' : '#fef9c3',
                  color:      (lockWarn || noRemainingEmployees) ? '#9ca3af' : '#854d0e',
                  border:     `1px solid ${(lockWarn || noRemainingEmployees) ? '#e5e7eb' : '#fde047'}`,
                  borderRadius:'8px', fontSize:'13px', fontWeight:600,
                  cursor: (lockWarn || noRemainingEmployees) ? 'not-allowed' : 'pointer',
                  whiteSpace:'nowrap',
                }}
              >
                {lockWarn ? 'Locked' : noRemainingEmployees ? 'All Processed' : processEmployee === 'all' ? 'Process All' : 'Process One'}
              </button>
              </>
            )}
            {can('approve_payroll') && detail.run.status === 'processed' && (
              <button
                onClick={() => handleApprove(detail.run.id)}
                style={{ padding:'8px 16px', background:'#dcfce7', color:'#166534', border:'1px solid #86efac', borderRadius:'8px', fontSize:'13px', fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}
              >
                ✅ Approve & Lock
              </button>
            )}
          </div>
        </div>

        {lockWarn && (
          <div style={{ marginTop:'12px', background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:'8px', padding:'11px 14px', fontSize:'12px', color:'#9a3412' }}>
            {lockWarn}
          </div>
        )}

        {detail.run.status !== 'locked' && (
          <div style={{ marginTop:'14px' }}>
            <SettingsPanel settings={settings} />
          </div>
        )}

        {/* Summary tiles */}
        {totals && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(108px,1fr))', gap:'10px', marginTop:'14px' }}>
            {[
              { l:'Gross Total',   v:fmt(totals.gross),  c:'#1d4ed8', bg:'#eff6ff' },
              { l:'OT Pay',        v:fmt(totals.ot_pay), c:'#7c3aed', bg:'#f5f3ff' },
              { l:'Extra Work',    v:fmt(totals.extra),  c:'#0f766e', bg:'#ccfbf1' },
              { l:'PF (Employee)', v:fmt(totals.pf),     c:'#7c3aed', bg:'#f5f3ff' },
              { l:'ESI (Emp.)',    v:fmt(totals.esi),    c:'#2563eb', bg:'#eff6ff' },
              { l:'Prof. Tax',     v:fmt(totals.pt),     c:'#0891b2', bg:'#ecfeff' },
              { l:'TDS',           v:fmt(totals.tds),    c:'#dc2626', bg:'#fef2f2' },
              { l:'LOP Ded.',      v:fmt(totals.lop),    c:'#ea580c', bg:'#fff7ed' },
              { l:'Net Pay Total', v:fmt(totals.net),    c:'#16a34a', bg:'#f0fdf4' },
            ].map(s => (
              <div key={s.l} style={{ background:s.bg, borderRadius:'8px', padding:'10px 8px', textAlign:'center' }}>
                <p style={{ margin:0, fontSize:'13px', fontWeight:800, color:s.c }}>{s.v}</p>
                <p style={{ margin:'2px 0 0', fontSize:'9px', color:'#888', textTransform:'uppercase', letterSpacing:'0.04em' }}>{s.l}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Entries table — horizontally scrollable */}
      <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #e5e7eb', overflow:'hidden' }}>
        <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
          <table style={{ width:'100%', minWidth:'760px', borderCollapse:'collapse', fontSize:'12px' }}>
            <thead>
              <tr style={{ background:'#f8fafc' }}>
                {['Employee','Days (Present/Working)','OT','Gross','Deductions (Live % breakdown)','Net Pay',''].map(h => (
                  <th key={h} style={{
                    padding:'10px 12px', textAlign:'left', fontWeight:600, color:'#555',
                    fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.04em', whiteSpace:'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {detail.entries.map((e, i) => {
                const isExp  = expandRow === e.id
                const hasLOP = n(e.lop_days) > 0
                const hasOT  = n(e.ot_hours) > 0
                const netZero= n(e.net_pay) === 0
                return (
                  <>
                    <tr
                      key={e.id}
                      style={{ borderTop:'1px solid #f1f5f9', background: isExp ? '#f0f9ff' : i%2===0 ? '#fff' : '#fafafa', cursor:'pointer' }}
                      onClick={() => setExpandRow(isExp ? null : e.id)}
                    >
                      <td style={TD}>
                        <p style={{ margin:0, fontWeight:600, color:'#111', fontSize:'13px', whiteSpace:'nowrap' }}>{e.employee_name}</p>
                        <p style={{ margin:0, color:'#aaa', fontSize:'10px', whiteSpace:'nowrap' }}>{e.emp_code} · {e.department}</p>
                      </td>
                      <td style={TD}>
                        <div style={{ fontSize:'12px', fontWeight:600, whiteSpace:'nowrap' }}>
                          {parseFloat(e.present_days).toFixed(1)}
                          <span style={{ color:'#aaa', fontWeight:400 }}>/{e.working_days}</span>
                        </div>
                        {(e.holiday_count > 0) && <div style={{ fontSize:'10px', color:'#1e40af', fontWeight:600, whiteSpace:'nowrap' }}>🗓 {e.holiday_count} holiday{e.holiday_count>1?'s':''}</div>}
                        {n(e.extra_work_days) > 0 && <div style={{ fontSize:'10px', color:'#0f766e', fontWeight:600, whiteSpace:'nowrap' }}>+{parseFloat(e.extra_work_days).toFixed(1)} extra work</div>}
                        {n(e.comp_off_days) > 0 && <div style={{ fontSize:'10px', color:'#6366f1', fontWeight:600, whiteSpace:'nowrap' }}>{parseFloat(e.comp_off_days).toFixed(1)} comp-off used</div>}
                        {hasLOP && <div style={{ fontSize:'10px', color:'#ea580c', fontWeight:600, whiteSpace:'nowrap' }}>⚡ {parseFloat(e.lop_days).toFixed(1)} LOP</div>}
                      </td>
                      <td style={TD}>
                        {hasOT
                          ? <div>
                              <div style={{ fontSize:'11px', color:'#7c3aed', fontWeight:700, whiteSpace:'nowrap' }}>{parseFloat(e.ot_hours).toFixed(1)}h</div>
                              <div style={{ fontSize:'10px', color:'#7c3aed', whiteSpace:'nowrap' }}>+{fmt(e.ot_pay)}</div>
                            </div>
                          : <span style={{ color:'#ddd' }}>—</span>
                        }
                      </td>
                      <td style={TD}>
                        <span style={{ fontWeight:600, color:'#1d4ed8', fontSize:'13px', whiteSpace:'nowrap' }}>{fmt(e.gross)}</span>
                        {hasLOP && <div style={{ fontSize:'10px', color:'#ea580c', marginTop:'2px', whiteSpace:'nowrap' }}>LOP −{fmt(e.lop_deduction)}</div>}
                      </td>
                      <td style={{ ...TD, minWidth:'200px' }}>
                        <DeductionPanel e={e} settings={settings} />
                      </td>
                      <td style={TD}>
                        <span style={{ fontWeight:800, fontSize:'14px', color: netZero ? '#dc2626' : '#16a34a', whiteSpace:'nowrap' }}>{fmt(e.net_pay)}</span>
                        {netZero && <div style={{ fontSize:'9px', color:'#dc2626' }}>CHECK</div>}
                      </td>
                      <td style={TD}>
                        <div style={{ display:'flex', gap:'4px', flexWrap:'nowrap' }}>
                          {detail.run.status !== 'locked' && can('process_payroll') && (
                            <button
                              onClick={ev => { ev.stopPropagation(); setAdjEntry(e); setAdjForm({type:'bonus',amount:'',reason:''}) }}
                              style={BA}
                            >
                              + Adj
                            </button>
                          )}
                          <button
                            onClick={ev => { ev.stopPropagation(); setExpandRow(isExp ? null : e.id) }}
                            style={{ ...BA, background: isExp ? '#e0e7ff' : '#f3f4f6', color: isExp ? '#4f46e5' : '#555' }}
                          >
                            {isExp ? '▲' : '▼'}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded row */}
                    {isExp && (
                      <tr key={`${e.id}-x`} style={{ background:'#f0f9ff', borderTop:'1px solid #bfdbfe' }}>
                        <td colSpan={7} style={{ padding:'18px 22px' }}>
                          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:'18px' }}>

                            {/* Earnings */}
                            <div>
                              <p style={ST}>💰 Earnings Breakdown</p>
                              {[
                                ['Basic',          e.basic],
                                ['HRA',            e.hra],
                                ['DA',             e.da],
                                ['Special Allow.', e.special_allowance],
                                ['Transport',      e.transport],
                                ['Medical',        e.medical],
                                ['Other',          e.other_allowance],
                                [`OT (${parseFloat(e.ot_hours||0).toFixed(1)}h × ${settings?.overtime_multiplier??1.5}×)`, e.ot_pay, '#7c3aed'],
                              ].filter(r => n(r[1]) > 0).map(r => (
                                <Row key={r[0]} label={r[0]} value={fmt(r[1])} color={r[2]} />
                              ))}
                              <Row label="Gross" value={fmt(e.gross)} bold color="#1d4ed8" />
                              {n(e.extra_work_pay)>0 && <Row label={`Extra work (${parseFloat(e.extra_work_days).toFixed(1)} day)`} value={fmt(e.extra_work_pay)} color="#0f766e" />}
                            </div>

                            {/* Deductions */}
                            <div>
                              <p style={ST}>📉 Deduction Breakdown</p>
                              {[
                                [`PF Employee (${settings?.pf_employee_percent??12}% of Basic, prorated by ${parseFloat(e.present_days).toFixed(1)}/${e.working_days} days)`, e.pf_employee, '#7c3aed'],
                                [n(e.esi_employee)>0
                                  ? `ESI Employee (${settings?.esi_employee_percent??0.75}% of gross, prorated — gross ≤ ₹${n(settings?.esi_threshold??21000).toLocaleString('en-IN')})`
                                  : 'ESI — Exempt (gross > ESI threshold)', e.esi_employee, '#2563eb'],
                                ['Professional Tax (slab on effective gross)', e.pt, '#0891b2'],
                                [`TDS${e.employee_type==='contract' ? ` (${settings?.tds_flat_contract??10}% flat, contract)` : ' (income slab)'}`, e.tds, '#dc2626'],
                                [`LOP — ${parseFloat(e.lop_days).toFixed(1)} days × (Gross÷${e.working_days} days)`, e.lop_deduction, '#ea580c'],
                              ].filter(r => n(r[1]) > 0).map(r => (
                                <Row key={r[0]} label={r[0]} value={`−${fmt(r[1])}`} color={r[2]} />
                              ))}
                              <Row label="Total Deductions" value={`−${fmt(e.total_deductions)}`} bold color="#dc2626" />
                            </div>

                            {/* Net pay formula */}
                            <div>
                              <p style={ST}>🧮 Net Pay Formula</p>
                              <div style={{ fontSize:'12px', lineHeight:2, background:'#fff', borderRadius:'8px', padding:'10px 12px', border:'1px solid #e5e7eb' }}>
                                <Row label="Gross Earnings" value={fmt(e.gross)} color="#1d4ed8" />
                                {hasLOP && <Row label={`LOP (${parseFloat(e.lop_days).toFixed(1)} days)`} value={`−${fmt(e.lop_deduction)}`} color="#ea580c" />}
                                {n(e.pf_employee)>0  && <Row label={`PF Emp (${settings?.pf_employee_percent??12}%)`}    value={`−${fmt(e.pf_employee)}`}  />}
                                {n(e.esi_employee)>0 && <Row label={`ESI Emp (${settings?.esi_employee_percent??0.75}%)`} value={`−${fmt(e.esi_employee)}`} />}
                                {n(e.pt)>0           && <Row label="PT"  value={`−${fmt(e.pt)}`}  />}
                                {n(e.tds)>0          && <Row label="TDS" value={`−${fmt(e.tds)}`} color="#dc2626" />}
                                <div style={{ borderTop:'2px dashed #cbd5e1', marginTop:'6px', paddingTop:'6px' }}>
                                  <Row label="✅ Net Take Home" value={fmt(e.net_pay)} bold color="#16a34a" />
                                </div>
                              </div>
                            </div>

                            {/* Adjustments */}
                            {e.adjustments?.length > 0 && (
                              <div>
                                <p style={ST}>⚙️ Manual Adjustments</p>
                                {e.adjustments.map((adj, idx) => (
                                  <Row key={idx}
                                    label={`${adj.type.charAt(0).toUpperCase()+adj.type.slice(1)} — ${adj.reason}`}
                                    value={`${adj.type==='deduction' ? '−' : '+'}${fmt(adj.amount)}`}
                                    color={adj.type==='deduction' ? '#dc2626' : '#16a34a'}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ) : null

  return (
    <div style={{ width:'100%', boxSizing:'border-box' }}>

      {/* ── Desktop / Tablet: side-by-side ── */}
      {!isMobile ? (
        <div style={{
          display:             showSideBySide ? 'grid' : 'block',
          gridTemplateColumns: showSideBySide ? `${isTablet ? '220px' : '290px'} 1fr` : undefined,
          gap:                 '20px',
          alignItems:          'start',
        }}>
          <div>{RunList}</div>
          {showSideBySide && DetailPanel}
        </div>
      ) : (
        /* ── Mobile: toggle between list and detail ── */
        <div>
          {mobileView === 'list' && RunList}
          {mobileView === 'detail' && DetailPanel}
        </div>
      )}

      {/* ── Adjustment modal ── */}
      {adjEntry && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.45)',
          display:'flex', alignItems:'center', justifyContent:'center',
          zIndex:1000, padding:'16px',
        }}>
          <div style={{
            background:'#fff', borderRadius:'14px', padding:'26px',
            width:'100%', maxWidth:'400px',
            boxShadow:'0 20px 60px rgba(0,0,0,0.2)',
            boxSizing:'border-box',
          }}>
            <h3 style={{ margin:'0 0 4px', fontSize:'16px', fontWeight:700 }}>Add Adjustment</h3>
            <p style={{ margin:'0 0 18px', fontSize:'12px', color:'#888' }}>{adjEntry.employee_name}</p>

            <label style={L}>Type</label>
            <select value={adjForm.type} onChange={e => setAdjForm(p=>({...p,type:e.target.value}))} style={INP}>
              <option value="bonus">🎁 Bonus</option>
              <option value="reimbursement">🧾 Reimbursement</option>
              <option value="arrear">📅 Arrear</option>
              <option value="deduction">➖ Deduction</option>
            </select>

            <label style={{ ...L, marginTop:'12px' }}>Amount (₹)</label>
            <input type="number" value={adjForm.amount} onChange={e => setAdjForm(p=>({...p,amount:e.target.value}))} style={INP} placeholder="5000" />

            <label style={{ ...L, marginTop:'12px' }}>Reason</label>
            <textarea value={adjForm.reason} onChange={e => setAdjForm(p=>({...p,reason:e.target.value}))} style={{ ...INP, height:'70px', resize:'vertical' }} placeholder="e.g. Q1 performance bonus" />

            <div style={{ display:'flex', gap:'10px', marginTop:'18px', justifyContent:'flex-end' }}>
              <button onClick={() => setAdjEntry(null)} style={{ padding:'9px 18px', background:'#f3f4f6', border:'none', borderRadius:'8px', fontSize:'13px', cursor:'pointer', fontFamily:'inherit' }}>
                Cancel
              </button>
              <button onClick={handleAdjust} style={{ padding:'9px 20px', background:'#1a1a2e', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────
const Row = ({ label, value, bold, color }) => (
  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', padding:'2px 0' }}>
    <span style={{ color:'#777', paddingRight:'8px' }}>{label}</span>
    <span style={{ fontWeight: bold ? 700 : 500, color: color || '#333', whiteSpace:'nowrap' }}>{value}</span>
  </div>
)

// ── Style constants ───────────────────────────────────────────────────────────
const CARD = { background:'#fff', borderRadius:'12px', border:'1px solid #e5e7eb', padding:'18px 20px', marginBottom:'14px', boxSizing:'border-box' }
const SEL  = { padding:'8px 10px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'13px', outline:'none', boxSizing:'border-box' }
const BP   = { padding:'8px 16px', background:'#1a1a2e', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }
const BA   = { padding:'4px 10px', background:'#eff6ff', color:'#1d4ed8', border:'none', borderRadius:'6px', fontSize:'11px', cursor:'pointer', fontWeight:600, whiteSpace:'nowrap' }
const TD   = { padding:'10px 12px', color:'#333', verticalAlign:'top' }
const L    = { fontSize:'12px', color:'#555', fontWeight:500, display:'block', marginBottom:'5px' }
const INP  = { width:'100%', padding:'9px 12px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'13px', outline:'none', boxSizing:'border-box', display:'block', fontFamily:'inherit' }
const ST   = { margin:'0 0 8px', fontSize:'11px', fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'0.05em' }
