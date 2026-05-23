// src/pages/employees/EmployeesPage.jsx
import { useEffect, useState } from 'react'
import { listEmployeesApi, deactivateEmployeeApi } from '../../api/services/employees'
import { listDepartmentsApi } from '../../api/services/departments'
import usePermission from '../../hooks/usePermission'
import toast from 'react-hot-toast'
import EmployeeModal from './EmployeeModal'

export default function EmployeesPage() {
  const { can } = usePermission()
  const [employees,    setEmployees]   = useState([])
  const [departments,  setDepartments] = useState([])
  const [loading,      setLoading]     = useState(false)
  const [search,       setSearch]      = useState('')
  const [deptFilter,   setDeptFilter]  = useState('')
  const [showModal,    setShowModal]   = useState(false)
  const [editTarget,   setEditTarget]  = useState(null)

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [empRes, deptRes] = await Promise.all([
        listEmployeesApi(),
        listDepartmentsApi(),
      ])
      setEmployees(empRes.data)
      setDepartments(deptRes.data)
    } catch {
      toast.error('Failed to load data')
    } finally { setLoading(false) }
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

  const ROLE_COLOR = {
    manager: '#1d4ed8', hr: '#b45309',
    employee: '#374151', admin: '#6d28d9',
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#111' }}>Employees</h2>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: '13px' }}>
            {employees.length} total employees
          </p>
        </div>
        {can('create_employee') && (
          <button onClick={openAdd} style={btnPrimary}>
            + Add Employee
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Search name, email, code..."
          style={{ ...inputStyle, flex: 1, minWidth: '200px' }}
        />
        <select
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
          style={{ ...inputStyle, width: '180px' }}
        >
          <option value="">All Departments</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <button onClick={handleSearch} style={btnSecondary}>Search</button>
        <button onClick={() => { setSearch(''); setDeptFilter(''); loadAll() }} style={btnSecondary}>
          Clear
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <p style={{ color: '#888', textAlign: 'center', padding: '40px' }}>Loading...</p>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                {['Emp Code', 'Name', 'Email', 'Role', 'Department', 'Designation', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#aaa' }}>
                    No employees found
                  </td>
                </tr>
              ) : employees.map((emp, i) => (
                <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={td}><code style={{ background: '#f3f4f6', padding: '2px 7px', borderRadius: '4px', fontSize: '12px' }}>{emp.emp_code}</code></td>
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1a1a2e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                        {emp.first_name?.[0]}{emp.last_name?.[0]}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, color: '#111' }}>{emp.first_name} {emp.last_name}</p>
                        <p style={{ margin: 0, color: '#aaa', fontSize: '11px' }}>{emp.employee_type}</p>
                      </div>
                    </div>
                  </td>
                  <td style={td}>{emp.email}</td>
                  <td style={td}>
                    <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, background: (ROLE_COLOR[emp.role] || '#374151') + '18', color: ROLE_COLOR[emp.role] || '#374151', textTransform: 'capitalize' }}>
                      {emp.role}
                    </span>
                  </td>
                  <td style={td}>{emp.department_name || '—'}</td>
                  <td style={td} >{emp.designation?.replace(/_/g, ' ') || '—'}</td>
                  <td style={td}>
                    <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, background: emp.is_active ? '#dcfce7' : '#fee2e2', color: emp.is_active ? '#166534' : '#991b1b' }}>
                      {emp.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {can('edit_employee') && (
                        <button onClick={() => openEdit(emp)} style={btnAction('#1d4ed8')}>Edit</button>
                      )}
                      {can('delete_employee') && emp.is_active && (
                        <button onClick={() => handleDeactivate(emp)} style={btnAction('#dc2626')}>Deactivate</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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

const inputStyle = { padding: '9px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', outline: 'none', fontFamily: 'Inter, sans-serif' }
const btnPrimary  = { padding: '10px 20px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }
const btnSecondary = { padding: '9px 16px', background: '#fff', color: '#333', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }
const btnAction = (color) => ({ padding: '5px 12px', background: color + '18', color, border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' })
const td = { padding: '12px 16px', color: '#333', verticalAlign: 'middle' }