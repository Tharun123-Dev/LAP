// src/pages/reports/AttendanceReport.jsx
import { useEffect, useState } from 'react'
import { getAttendanceReportApi, downloadReportCsv } from '../../api/services/reports'
import toast from 'react-hot-toast'

export default function AttendanceReport() {
  const now = new Date()
  const [month,   setMonth]   = useState(now.getMonth() + 1)
  const [year,    setYear]    = useState(now.getFullYear())
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { load() }, [month, year])

  const load = () => {
    setLoading(true)
    getAttendanceReportApi({ month, year })
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }

  const MONTH_NAMES = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
        <select value={month} onChange={e => setMonth(+e.target.value)} style={sel}>
          {MONTH_NAMES.slice(1).map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <select value={year} onChange={e => setYear(+e.target.value)} style={sel}>
          {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button
          onClick={() => downloadReportCsv('attendance', { month, year })}
          style={btnDownload}
        >
          ⬇ Download CSV
        </button>
      </div>

      {loading && <p style={{ color: '#888' }}>Loading...</p>}

      {data && (
        <>
          <p style={{ fontSize: '13px', color: '#888', marginBottom: '14px' }}>
            {MONTH_NAMES[month]} {year} · {data.working_days} working days · {data.data?.length} employees
          </p>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Code','Name','Dept','Role','Type','Present','Absent','Late','Half','Leave','Holiday','Hours','OT Hrs'].map(h => (
                      <th key={h} style={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.data?.map((r, i) => (
                    <tr key={r.emp_id} style={{ borderTop: '1px solid #f1f5f9', background: i%2===0?'#fff':'#fafafa' }}>
                      <td style={td}><code style={{ fontSize: '11px', background: '#f3f4f6', padding: '1px 5px', borderRadius: '3px' }}>{r.emp_code}</code></td>
                      <td style={{ ...td, fontWeight: 600 }}>{r.name}</td>
                      <td style={td}>{r.dept}</td>
                      <td style={{ ...td, textTransform: 'capitalize' }}>{r.role}</td>
                      <td style={{ ...td, textTransform: 'capitalize' }}>{r.emp_type}</td>
                      <td style={{ ...td, color: '#16a34a', fontWeight: 700 }}>{r.present}</td>
                      <td style={{ ...td, color: r.absent > 0 ? '#dc2626' : '#aaa', fontWeight: r.absent > 0 ? 700 : 400 }}>{r.absent}</td>
                      <td style={{ ...td, color: r.late > 0 ? '#d97706' : '#aaa' }}>{r.late}</td>
                      <td style={{ ...td, color: r.half_day > 0 ? '#b45309' : '#aaa' }}>{r.half_day}</td>
                      <td style={{ ...td, color: '#6366f1' }}>{r.leave}</td>
                      <td style={td}>{r.holiday}</td>
                      <td style={td}>{r.total_hours?.toFixed(1)}h</td>
                      <td style={{ ...td, color: r.ot_hours > 0 ? '#7c3aed' : '#aaa' }}>{r.ot_hours > 0 ? r.ot_hours.toFixed(1)+'h' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const sel = { padding: '7px 12px', borderRadius: '7px', border: '1px solid #ddd', fontSize: '13px', outline: 'none' }
const th  = { padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: '11px', textTransform: 'uppercase', whiteSpace: 'nowrap' }
const td  = { padding: '9px 12px', color: '#333', verticalAlign: 'middle' }
const btnDownload = { padding: '7px 16px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }