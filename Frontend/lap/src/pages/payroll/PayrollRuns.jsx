// src/pages/payroll/PayrollRuns.jsx — FULL REPLACEMENT v3
// Shows active payroll settings panel before processing,
// per-row deduction breakdown, OT column, detailed net pay formula
import { useEffect, useState } from 'react'
import {
  getRunsApi, createRunApi, processRunApi,
  approveRunApi, getRunDetailApi, addAdjustmentApi
} from '../../api/services/payroll'
import systemSettingsService from '../../api/services/systemsettings'
import usePermission from '../../hooks/usePermission'
import toast from 'react-hot-toast'

const MONTHS = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const fmt = v => `₹${parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:2})}`
const n   = v => parseFloat(v||0)

const STATUS_STYLE = {
  draft:     { bg:'#f3f4f6', color:'#6b7280', dot:'#9ca3af' },
  processed: { bg:'#fef9c3', color:'#854d0e', dot:'#eab308' },
  approved:  { bg:'#dbeafe', color:'#1e40af', dot:'#3b82f6' },
  locked:    { bg:'#dcfce7', color:'#166534', dot:'#22c55e' },
}

function DeductionPanel({ e }) {
  const items = [
    { label:`PF (12% of Basic, prorated)`, value:n(e.pf_employee),  color:'#7c3aed' },
    { label:'ESI (0.75%, prorated)',        value:n(e.esi_employee), color:'#2563eb' },
    { label:'Professional Tax',             value:n(e.pt),           color:'#0891b2' },
    { label:'TDS',                          value:n(e.tds),          color:'#dc2626' },
    { label:`LOP (${parseFloat(e.lop_days||0).toFixed(1)} days)`, value:n(e.lop_deduction), color:'#ea580c' },
  ].filter(i => i.value > 0)

  if (!items.length) return <span style={{ color:'#aaa', fontSize:'12px' }}>₹0.00</span>

  return (
    <div>
      {items.map(i => (
        <div key={i.label} style={{ display:'flex', justifyContent:'space-between', gap:'8px', fontSize:'11px', padding:'1px 0' }}>
          <span style={{ color:'#777' }}>{i.label}</span>
          <span style={{ color:i.color, fontWeight:600 }}>−{fmt(i.value)}</span>
        </div>
      ))}
      <div style={{ borderTop:'1px solid #e5e7eb', marginTop:'4px', paddingTop:'4px', display:'flex', justifyContent:'space-between', fontSize:'12px' }}>
        <span style={{ fontWeight:700 }}>Total</span>
        <span style={{ fontWeight:700, color:'#dc2626' }}>{fmt(e.total_deductions)}</span>
      </div>
    </div>
  )
}

function SettingsPanel({ settings }) {
  if (!settings) return null
  const find = key => settings.find(s => s.key === key)?.value
  const items = [
    { label:'Work Days/Week',    value: find('work_days_per_week')    || '5',    color:'#1d4ed8' },
    { label:'Weekend Off',       value: (() => { try { const w = JSON.parse(find('weekend_days') || '["saturday","sunday"]'); return w.map(d=>d[0].toUpperCase()+d.slice(1)).join(', ') } catch { return 'Sat, Sun' } })(), color:'#0369a1' },
    { label:'PF Employee %',     value: (find('pf_employee_percent')  || '12') + '%', color:'#7c3aed' },
    { label:'ESI Employee %',    value: (find('esi_employee_percent') || '0.75') + '%', color:'#2563eb' },
    { label:'ESI Threshold',     value: '₹' + (find('esi_threshold_salary') || '21000'), color:'#0891b2' },
    { label:'OT Multiplier',     value: find('overtime_multiplier')   || '1.5'  + '×', color:'#7c3aed' },
    { label:'TDS (Contract)',     value: (find('tds_flat_percent_contract') || '10') + '%', color:'#dc2626' },
    { label:'Late → LOP',        value: `Every ${find('late_marks_per_half_day') || '3'} lates = 0.5 LOP`, color:'#ea580c' },
  ]
  return (
    <div style={{ background:'#f5f3ff', border:'1px solid #ede9fe', borderRadius:'10px', padding:'14px 16px', marginBottom:'14px' }}>
      <p style={{ margin:'0 0 10px', fontSize:'11px', fontWeight:700, color:'#7c3aed', textTransform:'uppercase', letterSpacing:'0.05em' }}>
        📐 Active Payroll Settings (applied in this run)
      </p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'8px' }}>
        {items.map(s => (
          <div key={s.label} style={{ background:'#fff', borderRadius:'7px', padding:'7px 10px' }}>
            <p style={{ margin:0, fontSize:'12px', fontWeight:700, color:s.color }}>{s.value}</p>
            <p style={{ margin:'1px 0 0', fontSize:'10px', color:'#aaa' }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PayrollRuns() {
  const { can } = usePermission()
  const [runs,      setRuns]      = useState([])
  const [loading,   setLoading]   = useState(false)
  const [creating,  setCreating]  = useState(false)
  const [newRun,    setNewRun]    = useState({ month: new Date().getMonth()+1, year: new Date().getFullYear() })
  const [selected,  setSelected]  = useState(null)
  const [detail,    setDetail]    = useState(null)
  const [adjEntry,  setAdjEntry]  = useState(null)
  const [adjForm,   setAdjForm]   = useState({ type:'bonus', amount:'', reason:'' })
  const [expandRow, setExpandRow] = useState(null)
  const [settings,  setSettings]  = useState(null)

  useEffect(() => {
    load()
    systemSettingsService.getAll().then(res => {
      setSettings(Object.values(res.data).flat())
    }).catch(() => {})
  }, [])

  const load = async () => {
    setLoading(true)
    try { const r = await getRunsApi(); setRuns(r.data) }
    catch { toast.error('Failed to load runs') }
    finally { setLoading(false) }
  }

  const loadDetail = async (id) => {
    try { const r = await getRunDetailApi(id); setDetail(r.data) }
    catch { toast.error('Failed to load detail') }
  }

  const handleSelect = async (run) => { setSelected(run); setExpandRow(null); await loadDetail(run.id) }

  const handleCreate = async () => {
    setCreating(true)
    try { await createRunApi(newRun); toast.success('Payroll run created!'); load() }
    catch (e) { toast.error(e.response?.data?.error || 'Failed to create') }
    finally { setCreating(false) }
  }

  const handleProcess = async (id) => {
    try {
      const r = await processRunApi(id)
      toast.success(`Processed: ${r.data.created} employees`)
      load(); loadDetail(id)
    } catch (e) { toast.error(e.response?.data?.error || 'Processing failed') }
  }

  const handleApprove = async (id) => {
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
  } : null

  return (
    <div style={{ display:'grid', gridTemplateColumns: selected ? 'minmax(240px,300px) 1fr' : '1fr', gap:'20px' }}>

      {/* Left — run list */}
      <div>
        {can('process_payroll') && (
          <div style={C}>
            <p style={{ margin:'0 0 10px', fontSize:'13px', fontWeight:700 }}>➕ New Payroll Run</p>
            <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
              <select value={newRun.month} onChange={e => setNewRun(p=>({...p,month:parseInt(e.target.value)}))} style={S}>
                {MONTHS.slice(1).map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
              <input type="number" value={newRun.year} onChange={e => setNewRun(p=>({...p,year:parseInt(e.target.value)}))} style={{...S, width:'80px'}} />
              <button onClick={handleCreate} disabled={creating} style={BP}>{creating ? '…' : 'Create'}</button>
            </div>
          </div>
        )}

        {loading ? <p style={{ color:'#888', fontSize:'13px' }}>Loading…</p> : (
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {runs.map(run => {
              const st = STATUS_STYLE[run.status] || STATUS_STYLE.draft
              const isSel = selected?.id === run.id
              return (
                <div key={run.id} onClick={() => handleSelect(run)} style={{ background:'#fff', borderRadius:'10px', padding:'14px 16px', border:`1px solid ${isSel ? '#1a1a2e' : '#e5e7eb'}`, cursor:'pointer', boxShadow: isSel ? '0 0 0 3px rgba(26,26,46,0.12)' : 'none' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                    <span style={{ fontWeight:700, fontSize:'14px' }}>{MONTHS[run.month]} {run.year}</span>
                    <span style={{ padding:'2px 8px', borderRadius:'6px', fontSize:'11px', fontWeight:600, background:st.bg, color:st.color, display:'flex', alignItems:'center', gap:'4px', textTransform:'capitalize' }}>
                      <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:st.dot, display:'inline-block' }} />{run.status}
                    </span>
                  </div>
                  <div style={{ fontSize:'12px', color:'#888', display:'flex', justifyContent:'space-between' }}>
                    <span>{run.entry_count||0} employees</span>
                    <span style={{ fontWeight:600, color:'#16a34a' }}>₹{n(run.total_net_pay).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )
            })}
            {!runs.length && (
              <div style={{ textAlign:'center', padding:'40px', color:'#aaa', background:'#fff', borderRadius:'10px', border:'1px solid #e5e7eb' }}>No payroll runs yet.</div>
            )}
          </div>
        )}
      </div>

      {/* Right — detail */}
      {selected && detail && (
        <div style={{ minWidth:0 }}>
          {/* Header */}
          <div style={{ ...C, marginBottom:'14px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'12px' }}>
              <div>
                <h3 style={{ margin:0, fontSize:'17px', fontWeight:700 }}>{MONTHS[detail.run.month]} {detail.run.year} Payroll</h3>
                <p style={{ margin:'4px 0 0', fontSize:'12px', color:'#888' }}>
                  {detail.entries.length} employees · <strong style={{ textTransform:'capitalize' }}>{detail.run.status}</strong>
                </p>
              </div>
              <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                {can('process_payroll') && detail.run.status === 'draft' && (
                  <button onClick={() => handleProcess(detail.run.id)} style={{ padding:'8px 16px', background:'#fef9c3', color:'#854d0e', border:'1px solid #fde047', borderRadius:'8px', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>▶ Process</button>
                )}
                {can('approve_payroll') && detail.run.status === 'processed' && (
                  <button onClick={() => handleApprove(detail.run.id)} style={{ padding:'8px 16px', background:'#dcfce7', color:'#166534', border:'1px solid #86efac', borderRadius:'8px', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>✅ Approve & Lock</button>
                )}
              </div>
            </div>

            {/* Active settings panel */}
            {detail.run.status !== 'locked' && <SettingsPanel settings={settings} />}

            {/* Summary tiles */}
            {totals && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))', gap:'10px', marginTop:'14px' }}>
                {[
                  { l:'Total Gross',  v:fmt(totals.gross),  c:'#1d4ed8', bg:'#eff6ff' },
                  { l:'OT Pay',       v:fmt(totals.ot_pay), c:'#7c3aed', bg:'#f5f3ff' },
                  { l:'PF Total',     v:fmt(totals.pf),     c:'#0891b2', bg:'#ecfeff' },
                  { l:'ESI Total',    v:fmt(totals.esi),    c:'#0891b2', bg:'#ecfeff' },
                  { l:'PT Total',     v:fmt(totals.pt),     c:'#0891b2', bg:'#ecfeff' },
                  { l:'TDS Total',    v:fmt(totals.tds),    c:'#dc2626', bg:'#fef2f2' },
                  { l:'LOP Deductions',v:fmt(totals.lop),   c:'#ea580c', bg:'#fff7ed' },
                  { l:'Total Net Pay',v:fmt(totals.net),    c:'#16a34a', bg:'#f0fdf4' },
                ].map(s => (
                  <div key={s.l} style={{ background:s.bg, borderRadius:'8px', padding:'10px 8px', textAlign:'center' }}>
                    <p style={{ margin:0, fontSize:'13px', fontWeight:800, color:s.c }}>{s.v}</p>
                    <p style={{ margin:'2px 0 0', fontSize:'9px', color:'#888', textTransform:'uppercase', letterSpacing:'0.04em' }}>{s.l}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Entries table */}
          <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #e5e7eb', overflow:'hidden' }}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
                <thead>
                  <tr style={{ background:'#f8fafc' }}>
                    {['Employee','Attendance','OT','Gross Earnings','Deductions (detail)','Net Pay',''].map(h => (
                      <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontWeight:600, color:'#555', fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.04em', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detail.entries.map((e, i) => {
                    const isExp    = expandRow === e.id
                    const hasLOP   = n(e.lop_days) > 0
                    const hasOT    = n(e.ot_hours) > 0
                    const netZero  = n(e.net_pay) === 0
                    return (
                      <>
                        <tr
                          key={e.id}
                          style={{ borderTop:'1px solid #f1f5f9', background: isExp ? '#f0f9ff' : i%2===0 ? '#fff' : '#fafafa', cursor:'pointer' }}
                          onClick={() => setExpandRow(isExp ? null : e.id)}
                        >
                          <td style={T}>
                            <p style={{ margin:0, fontWeight:600, color:'#111', fontSize:'13px' }}>{e.employee_name}</p>
                            <p style={{ margin:0, color:'#aaa', fontSize:'10px' }}>{e.emp_code} · {e.department}</p>
                          </td>
                          <td style={T}>
                            <div style={{ fontSize:'12px', fontWeight:500 }}>{parseFloat(e.present_days).toFixed(1)}<span style={{ color:'#aaa' }}>/{e.working_days}</span></div>
                            {hasLOP && <div style={{ fontSize:'10px', color:'#ea580c', fontWeight:600 }}>{parseFloat(e.lop_days).toFixed(1)} LOP</div>}
                          </td>
                          <td style={T}>
                            {hasOT
                              ? <div><div style={{ fontSize:'11px', color:'#7c3aed', fontWeight:700 }}>{parseFloat(e.ot_hours).toFixed(1)}h</div><div style={{ fontSize:'10px', color:'#7c3aed' }}>+{fmt(e.ot_pay)}</div></div>
                              : <span style={{ color:'#ddd' }}>—</span>}
                          </td>
                          <td style={T}>
                            <span style={{ fontWeight:600, color:'#1d4ed8', fontSize:'13px' }}>{fmt(e.gross)}</span>
                            {hasLOP && <div style={{ fontSize:'10px', color:'#ea580c', marginTop:'2px' }}>LOP −{fmt(e.lop_deduction)}</div>}
                          </td>
                          <td style={{ ...T, minWidth:'180px' }}>
                            <DeductionPanel e={e} />
                          </td>
                          <td style={T}>
                            <span style={{ fontWeight:800, fontSize:'14px', color: netZero ? '#dc2626' : '#16a34a' }}>{fmt(e.net_pay)}</span>
                            {netZero && <div style={{ fontSize:'9px', color:'#dc2626' }}>CHECK</div>}
                          </td>
                          <td style={T}>
                            <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
                              {detail.run.status !== 'locked' && can('process_payroll') && (
                                <button onClick={ev => { ev.stopPropagation(); setAdjEntry(e); setAdjForm({type:'bonus',amount:'',reason:''}) }} style={BA}>+ Adj</button>
                              )}
                              <button onClick={ev => { ev.stopPropagation(); setExpandRow(isExp ? null : e.id) }} style={{ ...BA, background: isExp ? '#e0e7ff' : '#f3f4f6', color: isExp ? '#4f46e5' : '#555' }}>
                                {isExp ? '▲' : '▼'}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded breakdown */}
                        {isExp && (
                          <tr key={`${e.id}-x`} style={{ background:'#f0f9ff', borderTop:'1px solid #bfdbfe' }}>
                            <td colSpan={7} style={{ padding:'16px 20px' }}>
                              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:'16px' }}>

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
                                    [`OT (${parseFloat(e.ot_hours||0).toFixed(1)}h)`, e.ot_pay, '#7c3aed'],
                                  ].filter(r => n(r[1]) > 0).map(r => (
                                    <div key={r[0]} style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', padding:'2px 0' }}>
                                      <span style={{ color: r[2] || '#777' }}>{r[0]}</span>
                                      <span style={{ color: r[2] || '#333', fontWeight:500 }}>{fmt(r[1])}</span>
                                    </div>
                                  ))}
                                  <div style={{ borderTop:'1px solid #e5e7eb', marginTop:'4px', paddingTop:'4px', display:'flex', justifyContent:'space-between', fontSize:'12px' }}>
                                    <span style={{ fontWeight:700 }}>Gross</span>
                                    <span style={{ fontWeight:700, color:'#1d4ed8' }}>{fmt(e.gross)}</span>
                                  </div>
                                </div>

                                {/* Deductions */}
                                <div>
                                  <p style={ST}>📉 Deduction Breakdown</p>
                                  <DeductionPanel e={e} />
                                </div>

                                {/* Net pay formula */}
                                <div>
                                  <p style={ST}>🧮 Net Pay Formula</p>
                                  <div style={{ fontSize:'12px', lineHeight:1.8 }}>
                                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                                      <span style={{ color:'#555' }}>Gross Earnings</span>
                                      <span style={{ color:'#1d4ed8', fontWeight:600 }}>{fmt(e.gross)}</span>
                                    </div>
                                    {hasLOP && (
                                      <div style={{ display:'flex', justifyContent:'space-between' }}>
                                        <span style={{ color:'#ea580c' }}>LOP ({parseFloat(e.lop_days).toFixed(1)} days)</span>
                                        <span style={{ color:'#ea580c', fontWeight:600 }}>−{fmt(e.lop_deduction)}</span>
                                      </div>
                                    )}
                                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                                      <span style={{ color:'#555' }}>PF (12% Basic, prorated)</span>
                                      <span style={{ fontWeight:600 }}>−{fmt(e.pf_employee)}</span>
                                    </div>
                                    {n(e.esi_employee) > 0 && (
                                      <div style={{ display:'flex', justifyContent:'space-between' }}>
                                        <span style={{ color:'#555' }}>ESI (0.75%, prorated)</span>
                                        <span style={{ fontWeight:600 }}>−{fmt(e.esi_employee)}</span>
                                      </div>
                                    )}
                                    {n(e.pt) > 0 && (
                                      <div style={{ display:'flex', justifyContent:'space-between' }}>
                                        <span style={{ color:'#555' }}>Professional Tax</span>
                                        <span style={{ fontWeight:600 }}>−{fmt(e.pt)}</span>
                                      </div>
                                    )}
                                    {n(e.tds) > 0 && (
                                      <div style={{ display:'flex', justifyContent:'space-between' }}>
                                        <span style={{ color:'#dc2626' }}>TDS</span>
                                        <span style={{ color:'#dc2626', fontWeight:600 }}>−{fmt(e.tds)}</span>
                                      </div>
                                    )}
                                    <div style={{ borderTop:'1px dashed #cbd5e1', marginTop:'6px', paddingTop:'6px', display:'flex', justifyContent:'space-between' }}>
                                      <span style={{ fontWeight:700 }}>Net Pay (Take Home)</span>
                                      <span style={{ fontWeight:800, color:'#16a34a', fontSize:'14px' }}>{fmt(e.net_pay)}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Adjustments */}
                                {e.adjustments?.length > 0 && (
                                  <div>
                                    <p style={ST}>⚙️ Adjustments</p>
                                    {e.adjustments.map((adj, idx) => (
                                      <div key={idx} style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', padding:'3px 0', borderBottom:'1px solid #e5e7eb' }}>
                                        <span style={{ color:'#555', textTransform:'capitalize' }}>{adj.type} — {adj.reason}</span>
                                        <span style={{ color: adj.type==='deduction' ? '#dc2626' : '#16a34a', fontWeight:600 }}>
                                          {adj.type==='deduction' ? '−' : '+'}{fmt(adj.amount)}
                                        </span>
                                      </div>
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
      )}

      {/* Adjustment modal */}
      {adjEntry && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'16px' }}>
          <div style={{ background:'#fff', borderRadius:'14px', padding:'26px', width:'400px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin:'0 0 4px', fontSize:'16px', fontWeight:700 }}>Add Adjustment</h3>
            <p style={{ margin:'0 0 18px', fontSize:'12px', color:'#888' }}>{adjEntry.employee_name}</p>

            <label style={L}>Type</label>
            <select value={adjForm.type} onChange={e => setAdjForm(p=>({...p,type:e.target.value}))} style={I}>
              <option value="bonus">🎁 Bonus</option>
              <option value="reimbursement">🧾 Reimbursement</option>
              <option value="arrear">📅 Arrear</option>
              <option value="deduction">➖ Deduction</option>
            </select>

            <label style={{...L, marginTop:'12px'}}>Amount (₹)</label>
            <input type="number" value={adjForm.amount} onChange={e => setAdjForm(p=>({...p,amount:e.target.value}))} style={I} placeholder="5000" />

            <label style={{...L, marginTop:'12px'}}>Reason</label>
            <textarea value={adjForm.reason} onChange={e => setAdjForm(p=>({...p,reason:e.target.value}))} style={{...I, height:'70px', resize:'vertical'}} placeholder="e.g. Q1 performance bonus" />

            <div style={{ display:'flex', gap:'10px', marginTop:'18px', justifyContent:'flex-end' }}>
              <button onClick={() => setAdjEntry(null)} style={{ padding:'9px 18px', background:'#f3f4f6', border:'none', borderRadius:'8px', fontSize:'13px', cursor:'pointer' }}>Cancel</button>
              <button onClick={handleAdjust} style={{ padding:'9px 20px', background:'#1a1a2e', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const C  = { background:'#fff', borderRadius:'12px', border:'1px solid #e5e7eb', padding:'18px 20px', marginBottom:'14px' }
const S  = { padding:'8px 10px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'13px', outline:'none' }
const BP = { padding:'8px 16px', background:'#1a1a2e', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:600, cursor:'pointer' }
const BA = { padding:'4px 10px', background:'#eff6ff', color:'#1d4ed8', border:'none', borderRadius:'6px', fontSize:'11px', cursor:'pointer', fontWeight:600 }
const T  = { padding:'10px 12px', color:'#333', verticalAlign:'top' }
const L  = { fontSize:'12px', color:'#555', fontWeight:500, display:'block', marginBottom:'5px' }
const I  = { width:'100%', padding:'9px 12px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'13px', outline:'none', boxSizing:'border-box', display:'block' }
const ST = { margin:'0 0 8px', fontSize:'11px', fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'0.05em' }