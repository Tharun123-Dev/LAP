// src/pages/payroll/PayrollRuns.jsx
import { useEffect, useState } from 'react'
import {
  getRunsApi, createRunApi, processRunApi,
  approveRunApi, getRunDetailApi, addAdjustmentApi
} from '../../api/services/payroll'
import usePermission from '../../hooks/usePermission'
import toast from 'react-hot-toast'

const MONTH_NAMES = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const fmt = v => `₹${parseFloat(v||0).toLocaleString('en-IN', {minimumFractionDigits:2})}`

const STATUS_STYLE = {
  draft:     { bg: '#f3f4f6', color: '#6b7280' },
  processed: { bg: '#fef9c3', color: '#854d0e' },
  approved:  { bg: '#dbeafe', color: '#1e40af' },
  locked:    { bg: '#dcfce7', color: '#166534' },
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
    setSelected(run)
    await loadDetail(run.id)
  }

  const handleCreate = async () => {
    setCreating(true)
    try {
      await createRunApi(newRun)
      toast.success('Payroll run created!')
      load()
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to create') }
    finally { setCreating(false) }
  }

  const handleProcess = async (id) => {
    try {
      const r = await processRunApi(id)
      toast.success(`Processed: ${r.data.created} employees`)
      load()
      loadDetail(id)
    } catch (e) { toast.error(e.response?.data?.error || 'Processing failed') }
  }

  const handleApprove = async (id) => {
    if (!window.confirm('Approve and lock this payroll? This cannot be undone.')) return
    try {
      await approveRunApi(id)
      toast.success('Payroll approved and locked!')
      load()
      loadDetail(id)
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

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? 'minmax(260px,1fr) 2fr' : '1fr', gap: '20px' }}>
      {/* Left — run list */}
      <div>
        {/* Create new run */}
        {can('process_payroll') && (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px', marginBottom: '16px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, color: '#111' }}>New Payroll Run</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <select
                value={newRun.month}
                onChange={e => setNewRun(p => ({ ...p, month: parseInt(e.target.value) }))}
                style={sel}
              >
                {MONTH_NAMES.slice(1).map((m, i) => (
                  <option key={i+1} value={i+1}>{m}</option>
                ))}
              </select>
              <input
                type="number"
                value={newRun.year}
                onChange={e => setNewRun(p => ({ ...p, year: parseInt(e.target.value) }))}
                style={{ ...sel, width: '80px' }}
              />
              <button onClick={handleCreate} disabled={creating} style={btnPrimary}>
                {creating ? '...' : 'Create'}
              </button>
            </div>
          </div>
        )}

        {/* Runs list */}
        {loading ? <p style={{ color: '#888' }}>Loading...</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {runs.map(run => {
              const st = STATUS_STYLE[run.status] || STATUS_STYLE.draft
              const isSelected = selected?.id === run.id
              return (
                <div
                  key={run.id}
                  onClick={() => handleSelect(run)}
                  style={{
                    background: '#fff', borderRadius: '10px', padding: '14px 16px',
                    border: `1px solid ${isSelected ? '#1a1a2e' : '#e5e7eb'}`,
                    cursor: 'pointer', boxShadow: isSelected ? '0 0 0 2px #1a1a2e20' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#111' }}>
                      {MONTH_NAMES[run.month]} {run.year}
                    </span>
                    <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: st.bg, color: st.color, textTransform: 'capitalize' }}>
                      {run.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#888', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{run.entry_count} employees</span>
                    <span style={{ fontWeight: 600, color: '#16a34a' }}>₹{parseFloat(run.total_net_pay).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Right — run detail */}
      {selected && detail && (
        <div>
          {/* Header */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '18px 20px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>
                  {MONTH_NAMES[detail.run.month]} {detail.run.year} Payroll
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#888' }}>
                  {detail.entries.length} employees · Status: <strong>{detail.run.status}</strong>
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {can('process_payroll') && detail.run.status === 'draft' && (
                  <button onClick={() => handleProcess(detail.run.id)} style={btnProcess}>
                    ▶ Process
                  </button>
                )}
                {can('approve_payroll') && detail.run.status === 'processed' && (
                  <button onClick={() => handleApprove(detail.run.id)} style={btnApprove}>
                    ✅ Approve & Lock
                  </button>
                )}
              </div>
            </div>

            {/* Summary row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px', marginTop: '14px' }}>
              {[
                { label: 'Total Gross', value: fmt(detail.entries.reduce((s,e) => s + parseFloat(e.gross||0), 0)), color: '#1d4ed8' },
                { label: 'Total Net',   value: fmt(detail.entries.reduce((s,e) => s + parseFloat(e.net_pay||0), 0)), color: '#16a34a' },
                { label: 'Total PF',    value: fmt(detail.entries.reduce((s,e) => s + parseFloat(e.pf_employee||0), 0)), color: '#7c3aed' },
                { label: 'Total TDS',   value: fmt(detail.entries.reduce((s,e) => s + parseFloat(e.tds||0), 0)), color: '#dc2626' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center', background: '#f8fafc', borderRadius: '8px', padding: '10px 6px' }}>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: s.color }}>{s.value}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#888' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Entries table */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Employee', 'Days', 'LOP', 'Gross', 'Deductions', 'Net Pay', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detail.entries.map((e, i) => (
                    <tr key={e.id} style={{ borderTop: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={td}>
                        <p style={{ margin: 0, fontWeight: 600, color: '#111' }}>{e.employee_name}</p>
                        <p style={{ margin: 0, color: '#aaa', fontSize: '10px' }}>{e.emp_code}</p>
                      </td>
                      <td style={td}>{e.present_days}/{e.working_days}</td>
                      <td style={td}>
                        <span style={{ color: parseFloat(e.lop_days) > 0 ? '#dc2626' : '#aaa' }}>
                          {e.lop_days}
                        </span>
                      </td>
                      <td style={td}>{fmt(e.gross)}</td>
                      <td style={{ ...td, color: '#dc2626' }}>{fmt(e.total_deductions)}</td>
                      <td style={{ ...td, fontWeight: 700, color: '#16a34a' }}>{fmt(e.net_pay)}</td>
                      <td style={td}>
                        {detail.run.status !== 'locked' && can('process_payroll') && (
                          <button
                            onClick={() => { setAdjEntry(e); setAdjForm({ type: 'bonus', amount: '', reason: '' }) }}
                            style={{ padding: '4px 10px', background: '#eff6ff', color: '#1d4ed8', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                          >
                            + Adjust
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Adjustment modal */}
      {adjEntry && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '380px' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700 }}>Add Adjustment</h3>
            <p style={{ margin: '0 0 18px', fontSize: '12px', color: '#888' }}>{adjEntry.employee_name}</p>

            <label style={lbl}>Type</label>
            <select value={adjForm.type} onChange={e => setAdjForm(p => ({...p, type: e.target.value}))} style={inp}>
              <option value="bonus">Bonus</option>
              <option value="reimbursement">Reimbursement</option>
              <option value="arrear">Arrear</option>
              <option value="deduction">Deduction</option>
            </select>

            <label style={{...lbl, marginTop: '12px'}}>Amount (₹)</label>
            <input type="number" value={adjForm.amount} onChange={e => setAdjForm(p => ({...p, amount: e.target.value}))} style={inp} placeholder="5000" />

            <label style={{...lbl, marginTop: '12px'}}>Reason</label>
            <textarea value={adjForm.reason} onChange={e => setAdjForm(p => ({...p, reason: e.target.value}))} style={{...inp, height: '70px', resize: 'vertical'}} placeholder="Performance bonus Q1..." />

            <div style={{ display: 'flex', gap: '10px', marginTop: '18px', justifyContent: 'flex-end' }}>
              <button onClick={() => setAdjEntry(null)} style={{ padding: '8px 16px', background: '#f3f4f6', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAdjust} style={{ padding: '8px 18px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const sel       = { padding: '8px 10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', outline: 'none' }
const btnPrimary = { padding: '8px 14px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }
const btnProcess = { padding: '8px 16px', background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }
const btnApprove = { padding: '8px 16px', background: '#dcfce7', color: '#166534', border: '1px solid #86efac', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }
const td = { padding: '10px 14px', color: '#333', verticalAlign: 'middle' }
const lbl = { fontSize: '12px', color: '#555', fontWeight: 500, display: 'block', marginBottom: '4px' }
const inp = { width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', display: 'block' }