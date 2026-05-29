// src/pages/employees/EmployeesPage.jsx
import { useEffect, useState } from 'react'
import { listEmployeesApi, deactivateEmployeeApi } from '../../api/services/employees'
import { listDepartmentsApi } from '../../api/services/departments'
import usePermission from '../../hooks/usePermission'
import toast from 'react-hot-toast'
import EmployeeModal from './EmployeeModal'

// ── Responsive breakpoint hook ────────────────────────────────────────────────
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

const ROLE_COLOR = {
  manager: '#1d4ed8',
  hr:      '#b45309',
  employee:'#374151',
  admin:   '#6d28d9',
}

export default function EmployeesPage() {
  const { can } = usePermission()
  const bp       = useBreakpoint()
  const isMobile = bp === 'mobile'

  const [employees,   setEmployees]  = useState([])
  const [departments, setDepartments]= useState([])
  const [loading,     setLoading]    = useState(false)
  const [search,      setSearch]     = useState('')
  const [deptFilter,  setDeptFilter] = useState('')
  const [showModal,   setShowModal]  = useState(false)
  const [editTarget,  setEditTarget] = useState(null)

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [empRes, deptRes] = await Promise.all([listEmployeesApi(), listDepartmentsApi()])
      setEmployees(empRes.data)
      setDepartments(deptRes.data)
    } catch { toast.error('Failed to load data') }
    finally { setLoading(false) }
  }

  const handleSearch = async () => {
    setLoading(true)
    try {
      const res = await listEmployeesApi({ search, department: deptFilter || undefined })
      setEmployees(res.data)
    } catch { toast.error('Search failed') }
    finally { setLoading(false) }
  }

  const handleDeactivate = async (emp) => {
    if (!window.confirm(`Deactivate ${emp.first_name} ${emp.last_name}?`)) return
    try {
      await deactivateEmployeeApi(emp.id)
      toast.success('Employee deactivated')
      loadAll()
    } catch { toast.error('Failed to deactivate') }
  }

  const openAdd  = () => { setEditTarget(null); setShowModal(true) }
  const openEdit = (emp) => { setEditTarget(emp); setShowModal(true) }
  const onSaved  = () => { setShowModal(false); loadAll() }

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', width: '100%', boxSizing: 'border-box' }}>

      {/* ── Header ── */}
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     isMobile ? 'flex-start' : 'center',
        flexDirection:  isMobile ? 'column' : 'row',
        gap:            '12px',
        marginBottom:   '20px',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: isMobile ? '18px' : '20px', fontWeight: 700, color: '#111' }}>
            Employees
          </h2>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: '13px' }}>
            {employees.length} total employees
          </p>
        </div>
        {can('create_employee') && (
          <button
            onClick={openAdd}
            style={{
              padding:      '10px 20px',
              background:   '#1a1a2e',
              color:        '#fff',
              border:       'none',
              borderRadius: '8px',
              fontSize:     '13px',
              fontWeight:   600,
              cursor:       'pointer',
              whiteSpace:   'nowrap',
              alignSelf:    isMobile ? 'stretch' : 'auto',
              textAlign:    'center',
            }}
          >
            + Add Employee
          </button>
        )}
      </div>

      {/* ── Filters ── */}
      <div style={{
        display:   'flex',
        gap:       '10px',
        marginBottom: '20px',
        flexWrap:  'wrap',
      }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Search name, email, code…"
          style={{
            ...inputStyle,
            flex:     '1 1 180px',
            minWidth: '0',
          }}
        />
        <select
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
          style={{
            ...inputStyle,
            flex:     isMobile ? '1 1 100%' : '0 0 180px',
            minWidth: '0',
          }}
        >
          <option value="">All Departments</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: '8px', flex: isMobile ? '1 1 100%' : '0 0 auto' }}>
          <button
            onClick={handleSearch}
            style={{
              ...btnSecondary,
              flex: isMobile ? 1 : '0 0 auto',
            }}
          >
            Search
          </button>
          <button
            onClick={() => { setSearch(''); setDeptFilter(''); loadAll() }}
            style={{
              ...btnSecondary,
              flex: isMobile ? 1 : '0 0 auto',
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          padding:        '60px 20px',
          color:          '#94a3b8',
          fontSize:       '14px',
          gap:            '10px',
        }}>
          <span style={{ fontSize: '20px' }}>⏳</span> Loading…
        </div>
      ) : (
        <div style={{
          background:   '#fff',
          borderRadius: '12px',
          border:       '1px solid #e5e7eb',
          /* KEY: allow horizontal scroll on small screens */
          overflowX:    'auto',
          overflowY:    'visible',
          WebkitOverflowScrolling: 'touch',
          /* subtle scroll hint shadow on right edge */
          boxShadow:    '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <table style={{
            width:           '100%',
            /* prevent table from shrinking below content — forces scroll */
            minWidth:        '760px',
            borderCollapse:  'collapse',
            fontSize:        '13px',
          }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                {['Emp Code', 'Name', 'Email', 'Role', 'Department', 'Designation', 'Work Mode', 'Status', 'Actions'].map(h => (
                  <th
                    key={h}
                    style={{
                      padding:       '12px 16px',
                      textAlign:     'left',
                      fontWeight:    600,
                      color:         '#555',
                      fontSize:      '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      whiteSpace:    'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      padding:   '48px',
                      textAlign: 'center',
                      color:     '#aaa',
                      fontSize:  '14px',
                    }}
                  >
                    No employees found
                  </td>
                </tr>
              ) : employees.map((emp, i) => (
                <tr
                  key={emp.id}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    background:   i % 2 === 0 ? '#fff' : '#fafafa',
                    transition:   'background 0.15s',
                  }}
                >
                  {/* Emp Code */}
                  <td style={tdStyle}>
                    <code style={{
                      background:   '#f3f4f6',
                      padding:      '2px 7px',
                      borderRadius: '4px',
                      fontSize:     '12px',
                      whiteSpace:   'nowrap',
                    }}>
                      {emp.emp_code}
                    </code>
                  </td>

                  {/* Name */}
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width:          '32px',
                        height:         '32px',
                        borderRadius:   '50%',
                        background:     '#1a1a2e',
                        color:          '#fff',
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                        fontSize:       '12px',
                        fontWeight:     700,
                        flexShrink:     0,
                      }}>
                        {emp.first_name?.[0]}{emp.last_name?.[0]}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 600, color: '#111', whiteSpace: 'nowrap' }}>
                          {emp.first_name} {emp.last_name}
                        </p>
                        <p style={{ margin: 0, color: '#aaa', fontSize: '11px', whiteSpace: 'nowrap' }}>
                          {emp.employee_type}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td style={{ ...tdStyle, maxWidth: '200px' }}>
                    <span style={{
                      display:      'block',
                      overflow:     'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace:   'nowrap',
                      color:        '#444',
                    }}>
                      {emp.email}
                    </span>
                  </td>

                  {/* Role */}
                  <td style={tdStyle}>
                    <span style={{
                      padding:       '3px 10px',
                      borderRadius:  '12px',
                      fontSize:      '11px',
                      fontWeight:    600,
                      background:    (ROLE_COLOR[emp.role] || '#374151') + '18',
                      color:         ROLE_COLOR[emp.role] || '#374151',
                      textTransform: 'capitalize',
                      whiteSpace:    'nowrap',
                    }}>
                      {emp.role}
                    </span>
                  </td>

                  {/* Department */}
                  <td style={tdStyle}>
                    <span style={{ whiteSpace: 'nowrap', color: '#333' }}>
                      {emp.department_name || '—'}
                    </span>
                  </td>

                  {/* Designation */}
                  <td style={tdStyle}>
                    <span style={{ whiteSpace: 'nowrap', color: '#333' }}>
                      {emp.designation?.replace(/_/g, ' ') || '—'}
                    </span>
                  </td>

                  {/* Work Mode */}
                  <td style={tdStyle}>
                    <span style={{
                      padding:      '3px 10px',
                      borderRadius: '12px',
                      fontSize:     '11px',
                      fontWeight:   600,
                      background:   emp.work_mode === 'work_from_home' ? '#e0f2fe' : '#f3f4f6',
                      color:        emp.work_mode === 'work_from_home' ? '#0369a1' : '#374151',
                      whiteSpace:   'nowrap',
                    }}>
                      {emp.work_mode === 'work_from_home' ? 'WFH' : 'Office'}
                    </span>
                  </td>

                  {/* Status */}
                  <td style={tdStyle}>
                    <span style={{
                      padding:      '3px 10px',
                      borderRadius: '12px',
                      fontSize:     '11px',
                      fontWeight:   600,
                      background:   emp.is_active ? '#dcfce7' : '#fee2e2',
                      color:        emp.is_active ? '#166534' : '#991b1b',
                      whiteSpace:   'nowrap',
                    }}>
                      {emp.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap' }}>
                      {can('edit_employee') && (
                        <button onClick={() => openEdit(emp)} style={btnAction('#1d4ed8')}>
                          Edit
                        </button>
                      )}
                      {can('delete_employee') && emp.is_active && (
                        <button onClick={() => handleDeactivate(emp)} style={btnAction('#dc2626')}>
                          Deactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Count footer ── */}
      {!loading && employees.length > 0 && (
        <p style={{
          margin:    '10px 0 0',
          fontSize:  '12px',
          color:     '#94a3b8',
          textAlign: 'right',
        }}>
          Showing {employees.length} employee{employees.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <EmployeeModal
          employee={editTarget}
          departments={departments}
          onClose={() => setShowModal(false)}
          onSaved={onSaved}
        />
      )}
    </div>
  )
}

// ── Style constants ───────────────────────────────────────────────────────────
const inputStyle = {
  padding:     '9px 14px',
  borderRadius:'8px',
  border:      '1px solid #ddd',
  fontSize:    '13px',
  outline:     'none',
  fontFamily:  'Inter, system-ui, sans-serif',
  boxSizing:   'border-box',
  width:       '100%',
}

const btnSecondary = {
  padding:      '9px 16px',
  background:   '#fff',
  color:        '#333',
  border:       '1px solid #ddd',
  borderRadius: '8px',
  fontSize:     '13px',
  cursor:       'pointer',
  whiteSpace:   'nowrap',
  fontFamily:   'Inter, system-ui, sans-serif',
}

const btnAction = (color) => ({
  padding:      '5px 12px',
  background:   color + '18',
  color,
  border:       'none',
  borderRadius: '6px',
  fontSize:     '12px',
  fontWeight:   600,
  cursor:       'pointer',
  whiteSpace:   'nowrap',
})

const tdStyle = {
  padding:       '12px 16px',
  color:         '#333',
  verticalAlign: 'middle',
}
