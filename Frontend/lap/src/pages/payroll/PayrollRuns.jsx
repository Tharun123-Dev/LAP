// src/pages/payroll/PayrollRuns.jsx  — FULL REPLACEMENT v2
import { useEffect, useState } from 'react'
import {
  getRunsApi, createRunApi, processRunApi,
  approveRunApi, getRunDetailApi, addAdjustmentApi
} from '../../api/services/payroll'
import usePermission from '../../hooks/usePermission'
import toast from 'react-hot-toast'

const MONTH_NAMES = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const fmt  = v => `₹${parseFloat(v||0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
const n    = v => parseFloat(v||0)

const STATUS_STYLE = {
  draft:     { bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af' },
  processed: { bg: '#fef9c3', color: '#854d0e', dot: '#eab308' },
  approved:  { bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6' },
  locked:    { bg: '#dcfce7', color: '#166534', dot: '#22c55e' },
}

function DeductionPanel({ e }) {
  const items = [
    { label: 'PF (Employee)',     value: n(e.pf_employee),  color: '#7c3aed' },
    { label: 'ESI (Employee)',    value: n(e.esi_employee), color: '#2563eb' },
    { label: 'Professional Tax',  value: n(e.pt),           color: '#0891b2' },
    { label: 'TDS',               value: n(e.tds),          color: '#dc2626' },
    { label: `LOP (${parseFloat(e.lop_days||0).toFixed(1)} days)`,
      value: n(e.lop_deduction),  color: '#ea580c' },
  ].filter(i => i.value > 0)

  if (items.length === 0) return <span style={{ color: '#aaa', fontSize: '12px' }}>₹0.00</span>

  return (
    <div>
      {items.map(i => (
        <div key={i.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '11px', padding: '1px 0' }}>
          <span style={{ color: '#777' }}>{i.label}</span>
          <span style={{ color: i.color, fontWeight: 600 }}>−₹{i.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
      ))}
      <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '4px', paddingTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
        <span style={{ fontWeight: 700, color: '#111' }}>Total</span>
        <span style={{ fontWeight: 700, color: '#dc2626' }}>{fmt(e.total_deductions)}</span>
      </div>
    </div>
  )
}

function EarningsPanel({ e }) {
  const items = [
    { label: 'Basic',           value: n(e.basic) },
    { label: 'HRA',             value: n(e.hra) },
    { label: 'DA',              value: n(e.da) },
    { label: 'Special Allow.',  value: n(e.special_allowance) },
    { label: 'Transport',       value: n(e.transport) },
    { label: 'Medical',         value: n(e.medical) },
    { label: 'Other',           value: n(e.other_allowance) },
    { label: `OT Pay (${parseFloat(e.ot_hours||0).toFixed(1)}h)`,
      value: n(e.ot_pay), highlight: true },
  ].filter(i => i.value > 0)

  return (
    <div>
      {items.map(i => (
        <div key={i.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '11px', padding: '1px 0' }}>
          <span style={{ color: i.highlight ? '#7c3aed' : '#777' }}>{i.label}</span>
          <span style={{ color: i.highlight ? '#7c3aed' : '#333', fontWeight: i.highlight ? 700 : 500 }}>
            ₹{i.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      ))}
      <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '4px', paddingTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
        <span style={{ fontWeight: 700, color: '#111' }}>Gross</span>
        <span style={{ fontWeight: 700, color: '#1d4ed8' }}>{fmt(e.gross)}</span>
      </div>
    </div>
  )
}

export default function PayrollRuns() {
  const { can } = usePermission()
  const [runs,      setRuns]      = useState([])
  const [loading,   setLoading]   = useState(false)
  const [creating,  setCreating]  = useState(false)
  const [newRun,    setNewRun]    = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() })
  const [selected,  setSelected]  = useState(null)
  const [detail,    setDetail]    = useState(null)
  const [adjEntry,  setAdjEntry]  = useState(null)
  const [adjForm,   setAdjForm]   = useState({ type: 'bonus', amount: '', reason: '' })
  const [expandRow, setExpandRow] = useState(null)

  useEffect(() => { load() }, [])

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

  const handleSelect = async (run) => {
    setSelected(run); setExpandRow(null)
    await loadDetail(run.id)
  }

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
    try {
      await approveRunApi(id)
      toast.success('Payroll approved and locked!')
      load(); loadDetail(id)
    } catch (e) { toast.error(e.response?.data?.error || 'Approval failed') }
  }

  const handleAdjust = async () => {
    if (!adjForm.amount || !adjForm.reason) { toast.error('Amount and reason required'); return }
    try {
      await addAdjustmentApi(adjEntry.id, adjForm)
      toast.success('Adjustment added!')
      setAdjEntry(null)
      setAdjForm({ type: 'bonus', amount: '', reason: '' })
      loadDetail(selected.id)
    } catch (e) { toast.error(e.response?.data?.error || 'Failed') }
  }

  const totals = detail ? {
    gross:  detail.entries.reduce((s, e) => s + n(e.gross), 0),
    net:    detail.entries.reduce((s, e) => s + n(e.net_pay), 0),
    pf:     detail.entries.reduce((s, e) => s + n(e.pf_employee), 0),
    esi:    detail.entries.reduce((s, e) => s + n(e.esi_employee), 0),
    tds:    detail.entries.reduce((s, e) => s + n(e.tds), 0),
    lop:    detail.entries.reduce((s, e) => s + n(e.lop_deduction), 0),
    ot_pay: detail.entries.reduce((s, e) => s + n(e.ot_pay), 0),
  } : null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? 'minmax(240px,320px) 1fr' : '1fr', gap: '20px' }}>

      {/* Left: run list */}
      <div>
        {can('process_payroll') && (
          <div style={card}>
            <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, color: '#111' }}>➕ New Payroll Run</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <select value={newRun.month} onChange={e => setNewRun(p => ({ ...p, month: parseInt(e.target.value) }))} style={sel}>
                {MONTH_NAMES.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
              <input
                type="number" value={newRun.year}
                onChange={e => setNewRun(p => ({ ...p, year: parseInt(e.target.value) }))}
                style={{ ...sel, width: '80px' }}
              />
              <button onClick={handleCreate} disabled={creating} style={btnPrimary}>
                {creating ? '…' : 'Create'}
              </button>
            </div>
          </div>
        )}

        {loading ? <p style={{ color: '#888', fontSize: '13px' }}>Loading…</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {runs.map(run => {
              const st = STATUS_STYLE[run.status] || STATUS_STYLE.draft
              const isSelected = selected?.id === run.id
              return (
                <div
                  key={run.id} onClick={() => handleSelect(run)}
                  style={{
                    background: '#fff', borderRadius: '10px', padding: '14px 16px',
                    border: `1px solid ${isSelected ? '#1a1a2e' : '#e5e7eb'}`,
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 0 0 3px rgba(26,26,46,0.12)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#111' }}>
                      {MONTH_NAMES[run.month]} {run.year}
                    </span>
                    <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: st.bg, color: st.color, textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: st.dot, display: 'inline-block' }} />
                      {run.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#888', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{run.entry_count || 0} employees</span>
                    <span style={{ fontWeight: 600, color: '#16a34a' }}>₹{n(run.total_net_pay).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )
            })}
            {runs.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#aaa', background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                No payroll runs yet.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: run detail */}
      {selected && detail && (
        <div style={{ minWidth: 0 }}>
          <div style={{ ...card, marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>
                  {MONTH_NAMES[detail.run.month]} {detail.run.year} Payroll
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#888' }}>
                  {detail.entries.length} employees · Status: <strong style={{ textTransform: 'capitalize' }}>{detail.run.status}</strong>
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {can('process_payroll') && detail.run.status === 'draft' && (
                  <button onClick={() => handleProcess(detail.run.id)} style={btnProcess}>▶ Process</button>
                )}
                {can('approve_payroll') && detail.run.status === 'processed' && (
                  <button onClick={() => handleApprove(detail.run.id)} style={btnApprove}>✅ Approve & Lock</button>
                )}
              </div>
            </div>

            {totals && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px', marginTop: '16px' }}>
                {[
                  { label: 'Total Gross',   value: fmt(totals.gross),  color: '#1d4ed8', bg: '#eff6ff' },
                  { label: 'OT Pay',        value: fmt(totals.ot_pay), color: '#7c3aed', bg: '#f5f3ff' },
                  { label: 'Total PF',      value: fmt(totals.pf),     color: '#0891b2', bg: '#ecfeff' },
                  { label: 'Total TDS',     value: fmt(totals.tds),    color: '#dc2626', bg: '#fef2f2' },
                  { label: 'Total LOP Ded', value: fmt(totals.lop),    color: '#ea580c', bg: '#fff7ed' },
                  { label: 'Total Net Pay', value: fmt(totals.net),    color: '#16a34a', bg: '#f0fdf4' },
                ].map(s => (
                  <div key={s.label} style={{ background: s.bg, borderRadius: '8px', padding: '10px 8px', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: s.color }}>{s.value}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Employee', 'Attendance', 'OT', 'Earnings (Gross)', 'Deductions', 'Net Pay', ''].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detail.entries.map((e, i) => {
                    const isExpanded = expandRow === e.id
                    const hasLOP     = n(e.lop_days) > 0
                    const hasOT      = n(e.ot_hours) > 0
                    const netIsZero  = n(e.net_pay) === 0
                    return (
                      <>
                        <tr
                          key={e.id}
                          style={{ borderTop: '1px solid #f1f5f9', background: isExpanded ? '#f0f9ff' : (i % 2 === 0 ? '#fff' : '#fafafa'), cursor: 'pointer' }}
                          onClick={() => setExpandRow(isExpanded ? null : e.id)}
                        >
                          <td style={td}>
                            <p style={{ margin: 0, fontWeight: 600, color: '#111', fontSize: '13px' }}>{e.employee_name}</p>
                            <p style={{ margin: 0, color: '#aaa', fontSize: '10px' }}>{e.emp_code} · {e.department}</p>
                          </td>
                          <td style={td}>
                            <div style={{ fontSize: '12px', fontWeight: 500 }}>
                              {parseFloat(e.present_days).toFixed(1)}<span style={{ color: '#aaa' }}>/{e.working_days}</span>
                            </div>
                            {hasLOP && (
                              <div style={{ fontSize: '10px', color: '#ea580c', fontWeight: 600, marginTop: '2px' }}>
                                {parseFloat(e.lop_days).toFixed(1)} LOP
                              </div>
                            )}
                          </td>
                          <td style={td}>
                            {hasOT ? (
                              <div>
                                <div style={{ fontSize: '11px', color: '#7c3aed', fontWeight: 700 }}>{parseFloat(e.ot_hours).toFixed(1)}h</div>
                                <div style={{ fontSize: '10px', color: '#7c3aed' }}>+{fmt(e.ot_pay)}</div>
                              </div>
                            ) : <span style={{ color: '#ddd', fontSize: '11px' }}>—</span>}
                          </td>
                          <td style={td}>
                            <span style={{ fontWeight: 600, color: '#1d4ed8', fontSize: '13px' }}>{fmt(e.gross)}</span>
                            {hasLOP && (
                              <div style={{ fontSize: '10px', color: '#ea580c', marginTop: '2px' }}>LOP −{fmt(e.lop_deduction)}</div>
                            )}
                          </td>
                          <td style={{ ...td, minWidth: '160px' }}>
                            <DeductionPanel e={e} />
                          </td>
                          <td style={td}>
                            <span style={{ fontWeight: 800, fontSize: '14px', color: netIsZero ? '#dc2626' : '#16a34a' }}>
                              {fmt(e.net_pay)}
                            </span>
                            {netIsZero && <div style={{ fontSize: '9px', color: '#dc2626', marginTop: '2px' }}>CHECK DEDUCTIONS</div>}
                          </td>
                          <td style={td}>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {detail.run.status !== 'locked' && can('process_payroll') && (
                                <button
                                  onClick={ev => { ev.stopPropagation(); setAdjEntry(e); setAdjForm({ type: 'bonus', amount: '', reason: '' }) }}
                                  style={btnAdjust}
                                >+ Adjust</button>
                              )}
                              <button
                                onClick={ev => { ev.stopPropagation(); setExpandRow(isExpanded ? null : e.id) }}
                                style={{ ...btnAdjust, background: isExpanded ? '#e0e7ff' : '#f3f4f6', color: isExpanded ? '#4f46e5' : '#555' }}
                              >{isExpanded ? '▲ Less' : '▼ More'}</button>
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr key={`${e.id}-exp`} style={{ borderTop: '1px solid #e0e7ff', background: '#f0f9ff' }}>
                            <td colSpan={7} style={{ padding: '14px 20px' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                                <div>
                                  <p style={secTitle}>💰 Earnings Breakdown</p>
                                  <EarningsPanel e={e} />
                                </div>
                                <div>
                                  <p style={secTitle}>📉 Deduction Breakdown</p>
                                  <DeductionPanel e={e} />
                                </div>
                                <div>
                                  <p style={secTitle}>🧮 Net Pay Calculation</p>
                                  <div style={{ fontSize: '12px', lineHeight: '1.7' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <span style={{ color: '#555' }}>Gross Earnings</span>
                                      <span style={{ color: '#1d4ed8', fontWeight: 600 }}>{fmt(e.gross)}</span>
                                    </div>
                                    {n(e.lop_deduction) > 0 && (
                                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#ea580c' }}>LOP ({parseFloat(e.lop_days).toFixed(1)} days)</span>
                                        <span style={{ color: '#ea580c', fontWeight: 600 }}>−{fmt(e.lop_deduction)}</span>
                                      </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <span style={{ color: '#555' }}>PF + ESI + PT</span>
                                      <span style={{ color: '#555', fontWeight: 600 }}>−{fmt(n(e.pf_employee) + n(e.esi_employee) + n(e.pt))}</span>
                                    </div>
                                    {n(e.tds) > 0 && (
                                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#dc2626' }}>TDS</span>
                                        <span style={{ color: '#dc2626', fontWeight: 600 }}>−{fmt(e.tds)}</span>
                                      </div>
                                    )}
                                    <div style={{ borderTop: '1px dashed #cbd5e1', marginTop: '6px', paddingTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
                                      <span style={{ fontWeight: 700 }}>Net Pay (Take Home)</span>
                                      <span style={{ fontWeight: 800, color: '#16a34a', fontSize: '14px' }}>{fmt(e.net_pay)}</span>
                                    </div>
                                  </div>
                                </div>
                                {e.adjustments?.length > 0 && (
                                  <div>
                                    <p style={secTitle}>⚙️ Adjustments</p>
                                    {e.adjustments.map((adj, idx) => (
                                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '3px 0', borderBottom: '1px solid #e5e7eb' }}>
                                        <span style={{ color: '#555', textTransform: 'capitalize' }}>{adj.type} — {adj.reason}</span>
                                        <span style={{ color: adj.type === 'deduction' ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
                                          {adj.type === 'deduction' ? '−' : '+'}{fmt(adj.amount)}
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '26px', width: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700 }}>Add Adjustment</h3>
            <p style={{ margin: '0 0 20px', fontSize: '12px', color: '#888' }}>{adjEntry.employee_name} · {adjEntry.emp_code}</p>

            <label style={lbl}>Adjustment Type</label>
            <select value={adjForm.type} onChange={e => setAdjForm(p => ({...p, type: e.target.value}))} style={inp}>
              <option value="bonus">🎁 Bonus</option>
              <option value="reimbursement">🧾 Reimbursement</option>
              <option value="arrear">📅 Arrear</option>
              <option value="deduction">➖ Deduction</option>
            </select>

            <label style={{...lbl, marginTop: '14px'}}>Amount (₹)</label>
            <input type="number" value={adjForm.amount} onChange={e => setAdjForm(p => ({...p, amount: e.target.value}))} style={inp} placeholder="5000" />

            <label style={{...lbl, marginTop: '14px'}}>Reason / Note</label>
            <textarea value={adjForm.reason} onChange={e => setAdjForm(p => ({...p, reason: e.target.value}))} style={{...inp, height: '80px', resize: 'vertical'}} placeholder="e.g. Performance bonus Q1…" />

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button onClick={() => setAdjEntry(null)} style={{ padding: '9px 18px', background: '#f3f4f6', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAdjust} style={{ padding: '9px 20px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Add Adjustment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const card       = { background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '18px 20px', marginBottom: '16px' }
const sel        = { padding: '8px 10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', outline: 'none' }
const btnPrimary = { padding: '8px 16px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }
const btnProcess = { padding: '8px 16px', background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }
const btnApprove = { padding: '8px 16px', background: '#dcfce7', color: '#166534', border: '1px solid #86efac', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }
const btnAdjust  = { padding: '4px 10px', background: '#eff6ff', color: '#1d4ed8', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }
const td         = { padding: '10px 14px', color: '#333', verticalAlign: 'top' }
const lbl        = { fontSize: '12px', color: '#555', fontWeight: 500, display: 'block', marginBottom: '5px' }
const inp        = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', display: 'block' }
const secTitle   = { margin: '0 0 10px', fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }