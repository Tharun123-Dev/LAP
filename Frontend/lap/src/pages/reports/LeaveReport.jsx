// src/pages/reports/LeaveReport.jsx
import { useEffect, useState } from 'react'
import { getLeaveReportApi, downloadReportCsv } from '../../api/services/reports'
import toast from 'react-hot-toast'

const STATUS_STYLE = {
  approved:  { bg: '#dcfce7', color: '#166534' },
  rejected:  { bg: '#fee2e2', color: '#991b1b' },
  pending:   { bg: '#fef9c3', color: '#854d0e' },
  cancelled: { bg: '#f3f4f6', color: '#6b7280' },
}

export default function LeaveReport({ scope = 'all' }) {
  const [year,    setYear]    = useState(new Date().getFullYear())
  const [month,   setMonth]   = useState('')
  const [status,  setStatus]  = useState('approved')
  const [search,  setSearch]  = useState('')
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { load() }, [year, month, status, scope])

  const load = () => {
    setLoading(true)
    getLeaveReportApi({ year, month: month || undefined, status, scope })
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }

  const MONTH_NAMES = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const rows = (data?.data || []).filter(r => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return [r.emp_code, r.name, r.department, r.leave_type, r.status].some(v => String(v || '').toLowerCase().includes(q))
  })

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
        <select value={year} onChange={e => setYear(+e.target.value)} style={sel}>
          {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={month} onChange={e => setMonth(e.target.value)} style={sel}>
          <option value="">All Months</option>
          {MONTH_NAMES.slice(1).map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} style={sel}>
          {['approved','pending','rejected','cancelled'].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
          ))}
        </select>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name, code, dept..."
          style={{ ...sel, minWidth: '210px' }}
        />
        <button onClick={() => downloadReportCsv('leave', { year, month: month || undefined, status, scope })} style={btnDl}>⬇ CSV</button>
      </div>

      {data?.summary?.length > 0 && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {data.summary.map(s => (
            <div key={s.name} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 16px', minWidth: '120px' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>{s.name}</p>
              <p style={{ margin: '3px 0 0', fontSize: '18px', fontWeight: 800, color: '#6366f1' }}>{s.total_days}</p>
              <p style={{ margin: '1px 0 0', fontSize: '10px', color: '#aaa' }}>{s.count} requests</p>
            </div>
          ))}
        </div>
      )}

      {loading && <p style={{ color: '#888' }}>Loading...</p>}

      {data?.data && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Code','Name','Dept','Leave Type','Paid','Start','End','Days','Status','Approved By'].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const st = STATUS_STYLE[r.status] || STATUS_STYLE.pending
                  return (
                    <tr key={i} style={{ borderTop: '1px solid #f1f5f9', background: i%2===0?'#fff':'#fafafa' }}>
                      <td style={td}><code style={{ fontSize:'11px', background:'#f3f4f6', padding:'1px 5px', borderRadius:'3px' }}>{r.emp_code}</code></td>
                      <td style={{ ...td, fontWeight: 600 }}>{r.name}</td>
                      <td style={td}>{r.department}</td>
                      <td style={td}>{r.leave_type}</td>
                      <td style={td}>
                        <span style={{ fontSize: '11px', padding: '1px 7px', borderRadius: '4px', background: r.is_paid ? '#dcfce7' : '#fee2e2', color: r.is_paid ? '#166534' : '#991b1b', fontWeight: 600 }}>
                          {r.is_paid ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td style={td}>{r.start_date}</td>
                      <td style={td}>{r.end_date}</td>
                      <td style={{ ...td, fontWeight: 700 }}>{r.days}</td>
                      <td style={td}>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: st.bg, color: st.color, fontWeight: 600 }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={td}>{r.approved_by}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

const sel  = { padding: '7px 12px', borderRadius: '7px', border: '1px solid #ddd', fontSize: '13px', outline: 'none' }
const th   = { padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: '11px', textTransform: 'uppercase', whiteSpace: 'nowrap' }
const td   = { padding: '9px 12px', color: '#333', verticalAlign: 'middle' }
const btnDl = { padding: '7px 16px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }
