// src/pages/reports/PayrollReport.jsx
import { useEffect, useState } from 'react'
import { getPayrollReportApi, getLopReportApi, getOvertimeReportApi, downloadReportCsv } from '../../api/services/reports'
import toast from 'react-hot-toast'

const fmt = v => `₹${parseFloat(v||0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
const MONTH_NAMES = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function PayrollReport({ scope = 'all' }) {
  const now = new Date()
  const [month,   setMonth]   = useState(now.getMonth()+1)
  const [year,    setYear]    = useState(now.getFullYear())
  const [view,    setView]    = useState('register')  // register | lop | ot
  const [search,  setSearch]  = useState('')
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { load() }, [month, year, view, scope])

  const load = () => {
    setLoading(true)
    const p = { month, year, scope }
    const fn = view === 'lop' ? getLopReportApi : view === 'ot' ? getOvertimeReportApi : getPayrollReportApi
    fn(p)
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }

  const rows = (data?.data || []).filter(r => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return [r.emp_code, r.name, r.department, r.dept, r.emp_type].some(v => String(v || '').toLowerCase().includes(q))
  })

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
        <select value={month} onChange={e => setMonth(+e.target.value)} style={sel}>
          {MONTH_NAMES.slice(1).map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <select value={year} onChange={e => setYear(+e.target.value)} style={sel}>
          {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { key: 'register', label: '📋 Register' },
            { key: 'lop',      label: '⚠ LOP' },
            { key: 'ot',       label: '🕐 Overtime' },
          ].map(v => (
            <button key={v.key} onClick={() => setView(v.key)} style={{
              padding: '7px 12px', border: 'none', borderRadius: '7px', fontSize: '12px', cursor: 'pointer',
              background: view === v.key ? '#1a1a2e' : '#f3f4f6',
              color: view === v.key ? '#fff' : '#555',
              fontWeight: view === v.key ? 600 : 400,
            }}>
              {v.label}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name, code, dept..."
          style={{ ...sel, minWidth: '210px' }}
        />
        <button onClick={() => downloadReportCsv(view === 'register' ? 'payroll' : view === 'lop' ? 'lop' : 'overtime', { month, year, scope })} style={btnDl}>
          ⬇ CSV
        </button>
      </div>

      {/* Totals bar */}
      {data?.totals && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: '10px', marginBottom: '16px' }}>
          {[
            { label: 'Employees',    value: data.totals.employees,         raw: true,  color: '#374151' },
            { label: 'Total Gross',  value: fmt(data.totals.gross),        raw: true,  color: '#1d4ed8' },
            { label: 'Total Net',    value: fmt(data.totals.net_pay),      raw: true,  color: '#16a34a' },
            { label: 'Total PF',     value: fmt(data.totals.pf),           raw: true,  color: '#7c3aed' },
            { label: 'Total TDS',    value: fmt(data.totals.tds),          raw: true,  color: '#dc2626' },
            { label: 'Total LOP',    value: fmt(data.totals.lop_deduction),raw: true,  color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 12px', borderLeft: `3px solid ${s.color}` }}>
              <p style={{ margin: 0, fontSize: '10px', color: '#888' }}>{s.label}</p>
              <p style={{ margin: '3px 0 0', fontSize: '14px', fontWeight: 800, color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {loading && <p style={{ color: '#888' }}>Loading...</p>}

      {data?.data && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            {view === 'register' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Code','Name','Dept','Days','LOP','OT Hrs','Gross','PF','TDS','LOP Ded','Net Pay'].map(h => (
                      <th key={h} style={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #f1f5f9', background: i%2===0?'#fff':'#fafafa' }}>
                      <td style={td}><code style={{ fontSize:'11px', background:'#f3f4f6', padding:'1px 5px', borderRadius:'3px' }}>{r.emp_code}</code></td>
                      <td style={{ ...td, fontWeight: 600 }}>{r.name}</td>
                      <td style={td}>{r.department}</td>
                      <td style={td}>{r.present_days}/{r.working_days}</td>
                      <td style={{ ...td, color: r.lop_days > 0 ? '#dc2626' : '#aaa', fontWeight: r.lop_days > 0 ? 700 : 400 }}>
                        {r.lop_days > 0 ? `${r.lop_days}d` : '—'}
                      </td>
                      <td style={{ ...td, color: r.ot_hours > 0 ? '#7c3aed' : '#aaa' }}>
                        {r.ot_hours > 0 ? `${r.ot_hours}h` : '—'}
                      </td>
                      <td style={td}>{fmt(r.gross)}</td>
                      <td style={{ ...td, color: '#7c3aed' }}>{fmt(r.pf_employee)}</td>
                      <td style={{ ...td, color: '#dc2626' }}>{r.tds > 0 ? fmt(r.tds) : '—'}</td>
                      <td style={{ ...td, color: r.lop_deduction > 0 ? '#f59e0b' : '#aaa' }}>
                        {r.lop_deduction > 0 ? fmt(r.lop_deduction) : '—'}
                      </td>
                      <td style={{ ...td, color: '#16a34a', fontWeight: 800 }}>{fmt(r.net_pay)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {view === 'lop' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#fef9c3' }}>
                    {['Code','Name','Dept','LOP Days','LOP Deduction','Working Days','Present Days'].map(h => (
                      <th key={h} style={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={td}><code style={{ fontSize:'11px' }}>{r.emp_code}</code></td>
                      <td style={{ ...td, fontWeight: 600 }}>{r.name}</td>
                      <td style={td}>{r.department}</td>
                      <td style={{ ...td, color: '#dc2626', fontWeight: 700 }}>{r.lop_days}d</td>
                      <td style={{ ...td, color: '#f59e0b', fontWeight: 700 }}>{fmt(r.lop_deduction)}</td>
                      <td style={td}>{r.working_days}</td>
                      <td style={td}>{r.present_days}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {view === 'ot' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#ede9fe' }}>
                    {['Code','Name','Dept','OT Hours','OT Pay','Gross','Net Pay'].map(h => (
                      <th key={h} style={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={td}><code style={{ fontSize:'11px' }}>{r.emp_code}</code></td>
                      <td style={{ ...td, fontWeight: 600 }}>{r.name}</td>
                      <td style={td}>{r.dept}</td>
                      <td style={{ ...td, color: '#7c3aed', fontWeight: 700 }}>{r.ot_hours}h</td>
                      <td style={{ ...td, color: '#6366f1', fontWeight: 700 }}>{fmt(r.ot_pay)}</td>
                      <td style={td}>{fmt(r.gross)}</td>
                      <td style={{ ...td, color: '#16a34a', fontWeight: 800 }}>{fmt(r.net_pay)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const sel   = { padding: '7px 12px', borderRadius: '7px', border: '1px solid #ddd', fontSize: '13px', outline: 'none' }
const th    = { padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: '11px', textTransform: 'uppercase', whiteSpace: 'nowrap' }
const td    = { padding: '9px 12px', color: '#333', verticalAlign: 'middle' }
const btnDl = { padding: '7px 16px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }
