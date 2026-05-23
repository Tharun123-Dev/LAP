// src/pages/employees/EmployeeModal.jsx
import { useState, useEffect } from 'react'
import { createEmployeeApi, updateEmployeeApi, listManagersApi } from '../../api/services/employees'
import toast from 'react-hot-toast'

const DESIGNATIONS = [
  'software_engineer', 'senior_engineer', 'team_lead',
  'project_manager', 'hr_executive', 'hr_manager',
  'accountant', 'analyst', 'intern', 'other',
]

export default function EmployeeModal({ employee, departments, onClose, onSaved }) {
  const isEdit = !!employee
  const [managers, setManagers] = useState([])
  const [saving,   setSaving]   = useState(false)

  const [form, setForm] = useState({
    username: '', email: '', first_name: '', last_name: '',
    password: '', role: 'employee', employee_type: 'regular',
    emp_code: '', department: '', designation: 'software_engineer',
    joining_date: new Date().toISOString().split('T')[0],
    phone: '', address: '', manager: '', date_of_birth: '',
  })

  useEffect(() => {
    listManagersApi().then(r => setManagers(r.data)).catch(() => {})
    if (isEdit) {
      setForm({
        username:      employee.username      || '',
        email:         employee.email         || '',
        first_name:    employee.first_name    || '',
        last_name:     employee.last_name     || '',
        password:      '',
        role:          employee.role          || 'employee',
        employee_type: employee.employee_type || 'regular',
        emp_code:      employee.emp_code      || '',
        department:    employee.department    || '',
        designation:   employee.designation  || 'other',
        joining_date:  employee.joining_date  || '',
        phone:         employee.phone         || '',
        address:       employee.address       || '',
        manager:       employee.manager       || '',
        date_of_birth: employee.date_of_birth || '',
      })
    }
  }, [])

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.first_name || !form.last_name || !form.email) {
      toast.error('First name, last name, and email are required')
      return
    }
    if (!isEdit && !form.password) {
      toast.error('Password is required for new employee')
      return
    }
    if (!form.emp_code || !form.joining_date) {
      toast.error('Employee code and joining date are required')
      return
    }

    setSaving(true)
    try {
      const payload = { ...form }
      if (!payload.department) delete payload.department
      if (!payload.manager)    delete payload.manager
      if (!payload.date_of_birth) delete payload.date_of_birth
      if (isEdit && !payload.password) delete payload.password

      if (isEdit) {
        await updateEmployeeApi(employee.id, payload)
        toast.success('Employee updated!')
      } else {
        await createEmployeeApi(payload)
        toast.success('Employee created!')
      }
      onSaved()
    } catch (err) {
      const errors = err.response?.data
      if (errors && typeof errors === 'object') {
        const first = Object.values(errors)[0]
        toast.error(Array.isArray(first) ? first[0] : first)
      } else {
        toast.error('Failed to save')
      }
    } finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '14px', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#111' }}>
            {isEdit ? 'Edit Employee' : 'Add New Employee'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          <Section title="Personal Info">
            <Row>
              <Field label="First Name *">
                <input value={form.first_name} onChange={set('first_name')} style={inp} placeholder="John" />
              </Field>
              <Field label="Last Name *">
                <input value={form.last_name} onChange={set('last_name')} style={inp} placeholder="Doe" />
              </Field>
            </Row>
            <Row>
              <Field label="Email *">
                <input value={form.email} onChange={set('email')} style={inp} placeholder="john@company.com" type="email" />
              </Field>
              <Field label="Phone">
                <input value={form.phone} onChange={set('phone')} style={inp} placeholder="9876543210" />
              </Field>
            </Row>
            <Row>
              <Field label="Date of Birth">
                <input value={form.date_of_birth} onChange={set('date_of_birth')} style={inp} type="date" />
              </Field>
              <Field label="Address">
                <input value={form.address} onChange={set('address')} style={inp} placeholder="City, State" />
              </Field>
            </Row>
          </Section>

          <Section title="Account">
            <Row>
              <Field label="Username *">
                <input value={form.username} onChange={set('username')} style={inp} placeholder="john.doe" disabled={isEdit} />
              </Field>
              <Field label={isEdit ? "New Password (leave blank to keep)" : "Password *"}>
                <input value={form.password} onChange={set('password')} style={inp} type="password" placeholder="Min 8 characters" />
              </Field>
            </Row>
            <Row>
              <Field label="Role">
                <select value={form.role} onChange={set('role')} style={inp}>
                  <option value="employee">Employee</option>
                  <option value="hr">HR</option>
                  <option value="manager">Manager</option>
                </select>
              </Field>
              <Field label="Employee Type">
                <select value={form.employee_type} onChange={set('employee_type')} style={inp}>
                  <option value="regular">Regular</option>
                  <option value="contract">Contract</option>
                  <option value="parttime">Part-Time</option>
                  <option value="intern">Intern</option>
                </select>
              </Field>
            </Row>
          </Section>

          <Section title="Job Details">
            <Row>
              <Field label="Employee Code *">
                <input value={form.emp_code} onChange={set('emp_code')} style={inp} placeholder="EMP001" disabled={isEdit} />
              </Field>
              <Field label="Joining Date *">
                <input value={form.joining_date} onChange={set('joining_date')} style={inp} type="date" />
              </Field>
            </Row>
            <Row>
              <Field label="Department">
                <select value={form.department} onChange={set('department')} style={inp}>
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </Field>
              <Field label="Designation">
                <select value={form.designation} onChange={set('designation')} style={inp}>
                  {DESIGNATIONS.map(d => <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>)}
                </select>
              </Field>
            </Row>
            <Row>
              <Field label="Reporting Manager">
                <select value={form.manager} onChange={set('manager')} style={inp}>
                  <option value="">No Manager</option>
                  {managers.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.first_name} {m.last_name} ({m.role})
                    </option>
                  ))}
                </select>
              </Field>
            </Row>
          </Section>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: '#f3f4f6', color: '#333', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving} style={{ padding: '10px 24px', background: saving ? '#999' : '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Employee'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Small helpers to keep form clean
const Section = ({ title, children }) => (
  <div style={{ marginBottom: '24px' }}>
    <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</p>
    {children}
  </div>
)
const Row = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
    {children}
  </div>
)
const Field = ({ label, children }) => (
  <div>
    <label style={{ fontSize: '12px', color: '#555', fontWeight: 500, display: 'block', marginBottom: '5px' }}>{label}</label>
    {children}
  </div>
)
const inp = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }