// src/pages/reports/HeadcountReport.jsx
import { useEffect, useState } from 'react'
import { getHeadcountReportApi, downloadReportCsv } from '../../api/services/reports'
import toast from 'react-hot-toast'

const ROLE_COLOR = { superadmin:'#6d28d9', admin:'#1d4ed8', manager:'#047857', hr:'#b45309', employee:'#374151' }

export default function HeadcountReport() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    getHeadcountReportApi()
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = data?.employees?.filter(e =>
    !search ||
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.emp_code.toLowerCase().includes(search.toLowerCase()) ||
    e.dept.toLowerCase().includes(search.toLowerCase())
  ) || []

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name, code, dept..."
          style={{ padding: '7px 12px', borderRadius: '7px', border: '1px solid #ddd', fontSize: '13px', outline: 'none', minWidth: '200px' }}
        />
        <button onClick={() => downloadReportCsv('headcount', {})} style={{ padding: '7px 16px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }}>
          ⬇ CSV
        </button>
      </div>

      {data && (
        <>
          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: '10px', marginBottom: '16px' }}>
            <div style={{ background: '#1a1a2e', borderRadius: '10px', padding: '14px 16px', color: '#fff' }}>
              <p style={{ margin: 0, fontSize: '28px', fontWeight: 900 }}>{data.total}</p>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Total Employees</p>
            </div>
            {Object.entries(data.by_role || {}).map(([role, count]) => (
              <div key={role} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px 16px', borderLeft: `3px solid ${ROLE_COLOR[role]||'#374151'}` }}>
                <p style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: ROLE_COLOR[role]||'#374151' }}>{count}</p>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#888', textTransform: 'capitalize' }}>{role}</p>
              </div>
            ))}
          </div>

          {/* Department breakdown */}
          {Object.keys(data.by_department||{}).length > 0 && (
            <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '16px', marginBottom: '16px' }}>
              <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>By Department</p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {Object.entries(data.by_department).map(([dept, count]) => (
                  <div key={dept} style={{ background: '#f8fafc', borderRadius: '7px', padding: '8px 14px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#1d4ed8' }}>{count}</span>
                    <span style={{ fontSize: '12px', color: '#555' }}>{dept}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {loading && <p style={{ color: '#888' }}>Loading...</p>}

      {filtered.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Code','Name','Email','Role','Type','Department','Designation','Joined'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: '11px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #f1f5f9', background: i%2===0?'#fff':'#fafafa' }}>
                    <td style={{ padding:'9px 12px' }}><code style={{ fontSize:'11px', background:'#f3f4f6', padding:'1px 5px', borderRadius:'3px' }}>{r.emp_code}</code></td>
                    <td style={{ padding:'9px 12px', fontWeight: 600 }}>{r.name}</td>
                    <td style={{ padding:'9px 12px', color: '#888', fontSize: '11px' }}>{r.email}</td>
                    <td style={{ padding:'9px 12px' }}>
                      <span style={{ padding:'2px 8px', borderRadius:'4px', fontSize:'11px', fontWeight:600, background:(ROLE_COLOR[r.role]||'#374151')+'18', color:ROLE_COLOR[r.role]||'#374151', textTransform:'capitalize' }}>
                        {r.role}
                      </span>
                    </td>
                    <td style={{ padding:'9px 12px', textTransform:'capitalize', fontSize:'11px' }}>{r.emp_type}</td>
                    <td style={{ padding:'9px 12px' }}>{r.dept}</td>
                    <td style={{ padding:'9px 12px', fontSize:'11px', textTransform:'capitalize' }}>{r.desig?.replace(/_/g,' ')}</td>
                    <td style={{ padding:'9px 12px', fontSize:'11px', color:'#888' }}>{r.joined}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}