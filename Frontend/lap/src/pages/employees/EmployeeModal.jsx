import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { createEmployeeApi, updateEmployeeApi, listManagersApi } from '../../api/services/employees'
import { getPermissionListApi, getCustomRolesApi, getUserPermissionsApi, saveUserPermissionsApi } from '../../api/services/permissions'
import { updatePermissions } from '../../store/authSlice'
import toast from 'react-hot-toast'

const DESIGNATIONS = [
  'software_engineer', 'senior_engineer', 'team_lead', 'project_manager',
  'hr_executive', 'hr_manager', 'accountant', 'analyst', 'intern', 'other',
]

const BASE_ROLES = [
  { value: 'employee', label: 'Employee' },
  { value: 'hr',       label: 'HR' },
  { value: 'manager',  label: 'Manager' },
]

const SUPERADMIN_ONLY_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'superadmin', label: 'Super Admin' },
]

export default function EmployeeModal({ employee, departments, onClose, onSaved }) {
  const isEdit = !!employee

  const dispatch      = useDispatch()
  const currentUserId = useSelector(s => s.auth.userId)
  const currentRole   = useSelector(s => s.auth.role)

  const [managers,     setManagers]     = useState([])
  const [customRoles,  setCustomRoles]  = useState([])
  const [allPerms,     setAllPerms]     = useState([])
  const [userPerms,    setUserPerms]    = useState(null)
  const [overrides,    setOverrides]    = useState({})
  const [activeTab,    setActiveTab]    = useState('info')
  const [saving,       setSaving]       = useState(false)
  const [loadingPerms, setLoadingPerms] = useState(false)

  const [form, setForm] = useState({
    username: '', email: '', first_name: '', last_name: '',
    password: '', role: 'employee', employee_type: 'regular',
    custom_role: '', emp_code: '', department: '',
    designation: 'software_engineer',
    joining_date: new Date().toISOString().split('T')[0],
    phone: '', address: '', manager: '', date_of_birth: '',
  })

  // Build available roles based on who is logged in
  // superadmin can assign admin, others cannot
  const allRoles = currentRole === 'superadmin'
    ? [...BASE_ROLES, ...SUPERADMIN_ONLY_ROLES]
    : BASE_ROLES

  // When editing, ensure the employee's current role always appears in the list
  // so the select box never shows blank
  const availableRoles = allRoles.some(r => r.value === (isEdit ? employee?.role : form.role))
    ? allRoles
    : isEdit && employee?.role
      ? [...allRoles, { value: employee.role, label: employee.role.charAt(0).toUpperCase() + employee.role.slice(1) }]
      : allRoles

  useEffect(() => {
    listManagersApi().then(r => setManagers(r.data)).catch(() => {})
    getCustomRolesApi().then(r => setCustomRoles(r.data)).catch(() => {})
    getPermissionListApi().then(r => setAllPerms(r.data)).catch(() => {})

    if (isEdit) {
      setForm({
        username:      employee.username      || '',
        email:         employee.email         || '',
        first_name:    employee.first_name    || '',
        last_name:     employee.last_name     || '',
        password:      '',
        role:          employee.role          || 'employee',
        employee_type: employee.employee_type || 'regular',
        custom_role:   employee.custom_role   || '',
        emp_code:      employee.emp_code      || '',
        department:    employee.department    || '',
        designation:   employee.designation   || 'other',
        joining_date:  employee.joining_date  || '',
        phone:         employee.phone         || '',
        address:       employee.address       || '',
        manager:       employee.manager       || '',
        date_of_birth: employee.date_of_birth || '',
      })

      if (employee.user_id) {
        setLoadingPerms(true)
        getUserPermissionsApi(employee.user_id)
          .then(r => {
            setUserPerms(r.data)
            const ov = {}
            r.data.permissions.forEach(p => {
              if (p.has_override) ov[p.code] = p.override_val
            })
            setOverrides(ov)
          })
          .catch(() => {})
          .finally(() => setLoadingPerms(false))
      }
    }
  }, [])

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  // Role change — updates form.role so select box reflects the new value immediately
  const handleRoleChange = (newRole) => {
    setForm(p => ({ ...p, role: newRole }))
  }

  const groupedPerms = allPerms.reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = []
    acc[p.module].push(p)
    return acc
  }, {})

  const handleSubmit = async () => {
    if (!form.first_name || !form.last_name || !form.email) {
      toast.error('First name, last name, and email are required'); return
    }
    if (!isEdit && !form.password) {
      toast.error('Password is required'); return
    }
    if (!form.emp_code || !form.joining_date) {
      toast.error('Employee code and joining date are required'); return
    }

    setSaving(true)
    try {
      const overridesList = Object.entries(overrides).map(([code, is_granted]) => ({
        code, is_granted
      }))

      const payload = {
        ...form,
        custom_role: form.custom_role || null,
        permission_overrides: overridesList,
      }
      if (!payload.department)    delete payload.department
      if (!payload.manager)       delete payload.manager
      if (!payload.date_of_birth) delete payload.date_of_birth
      if (isEdit && !payload.password) delete payload.password

      if (isEdit) {
        await updateEmployeeApi(employee.id, payload)

        if (employee.user_id) {
          await saveUserPermissionsApi(employee.user_id, {
            overrides: Object.entries(overrides).map(([code, val]) => ({ code, is_granted: val })),
            clear: [],
          })

          // If editing the currently logged-in user → update sidebar instantly
          const isSelf = String(employee.user_id) === String(currentUserId)
          if (isSelf) {
            try {
              const freshRes = await getUserPermissionsApi(employee.user_id)
              const effectiveCodes = freshRes.data.permissions
                .filter(p => p.has_override ? p.override_val : p.role_default)
                .map(p => p.code)
              dispatch(updatePermissions(effectiveCodes))
            } catch {}
          }
        }

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

  const tabs = [
    { id: 'info',        label: 'Personal Info' },
    { id: 'job',         label: 'Job & Role' },
    { id: 'permissions', label: '🔐 Permissions' },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '780px', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1a1a2e' }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#fff' }}>
            {isEdit ? `Edit: ${employee.first_name} ${employee.last_name}` : 'Add New Employee'}
          </h3>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: '16px' }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '12px 20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
              background: activeTab === tab.id ? '#fff' : 'transparent',
              color: activeTab === tab.id ? '#1a1a2e' : '#888',
              borderBottom: activeTab === tab.id ? '2px solid #1a1a2e' : '2px solid transparent',
              transition: 'all 0.15s',
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>

          {/* ── TAB: Personal Info ── */}
          {activeTab === 'info' && (
            <>
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

              <Section title="Account Credentials">
                <Row>
                  <Field label="Username *">
                    <input value={form.username} onChange={set('username')} style={inp} placeholder="john.doe" disabled={isEdit} />
                  </Field>
                  <Field label={isEdit ? 'New Password (blank = keep)' : 'Password *'}>
                    <input value={form.password} onChange={set('password')} style={inp} type="password" placeholder="Min 8 chars" />
                  </Field>
                </Row>
              </Section>
            </>
          )}

          {/* ── TAB: Job & Role ── */}
          {activeTab === 'job' && (
            <>
              <Section title="Role & Type">
                <Row>
                  <Field label="Base Role">
                    <select
                      value={form.role}
                      onChange={e => handleRoleChange(e.target.value)}
                      style={inp}
                    >
                      {availableRoles.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
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
                <Row>
                  <Field label="Job Title / Custom Role">
                    <select value={form.custom_role} onChange={set('custom_role')} style={inp}>
                      <option value="">— Use Base Role Label —</option>
                      {customRoles.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.display_name} ({r.base_role})
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Designation">
                    <select value={form.designation} onChange={set('designation')} style={inp}>
                      {DESIGNATIONS.map(d => (
                        <option key={d} value={d}>{d.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                      ))}
                    </select>
                  </Field>
                </Row>
                <div style={{ background: '#f0f4ff', border: '1px solid #c7d7fe', borderRadius: '8px', padding: '12px', marginTop: '8px', fontSize: '12px', color: '#3730a3' }}>
                  <strong>How roles work:</strong> Base Role controls default permissions.
                  Fine-tune individual permissions in the <strong>Permissions</strong> tab.
                </div>
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
            </>
          )}

          {/* ── TAB: Permissions ── */}
          {activeTab === 'permissions' && (
            <div>
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '12px', color: '#92400e' }}>
                <strong>📌 How this works:</strong> <em>Role Default</em> shows what the base role ({form.role}) normally gets.
                Use <strong>Grant</strong> to give extra access or <strong>Revoke</strong> to remove access for this employee only.
                <strong> Reset</strong> reverts to role default.
                {isEdit
                  ? ' Changes apply when you click Save Changes.'
                  : ' These permissions apply when the employee is created.'}
              </div>

              {loadingPerms ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading permissions...</div>
              ) : Object.keys(groupedPerms).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#aaa', fontSize: '13px' }}>
                  No permissions found. Make sure the backend is reachable.
                </div>
              ) : (
                Object.entries(groupedPerms).map(([module, perms]) => (
                  <div key={module} style={{ marginBottom: '20px' }}>
                    <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      {module}
                    </p>
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                      {perms.map((perm, i) => {
                        const roleDefault = userPerms
                          ? (userPerms.permissions.find(p => p.code === perm.code)?.role_default ?? false)
                          : null
                        const hasOverride = overrides[perm.code] !== undefined
                        const effective   = hasOverride ? overrides[perm.code] : (roleDefault ?? false)

                        return (
                          <div key={perm.code} style={{
                            display: 'grid', gridTemplateColumns: '1fr 90px 120px',
                            alignItems: 'center', padding: '10px 14px', gap: '8px',
                            background: i % 2 === 0 ? '#fff' : '#fafafa',
                            borderTop: i > 0 ? '1px solid #f3f4f6' : 'none',
                          }}>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 500, color: '#111' }}>{perm.label}</div>
                              <div style={{ fontSize: '11px', color: '#aaa' }}>{perm.code}</div>
                              <div style={{ marginTop: '3px' }}>
                                <span style={{ fontSize: '10px', color: roleDefault ? '#059669' : '#9ca3af', fontWeight: 500 }}>
                                  Role default: {roleDefault === null ? '—' : roleDefault ? '✓ Granted' : '✗ Denied'}
                                </span>
                              </div>
                            </div>

                            <div style={{ textAlign: 'center' }}>
                              <span style={{
                                fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px',
                                background: effective ? '#d1fae5' : '#f3f4f6',
                                color: effective ? '#065f46' : '#6b7280',
                                border: `1px solid ${effective ? '#6ee7b7' : '#e5e7eb'}`,
                                whiteSpace: 'nowrap',
                              }}>
                                {hasOverride ? '★ ' : ''}{effective ? 'ALLOWED' : 'DENIED'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => setOverrides(p => ({ ...p, [perm.code]: true }))}
                                style={{
                                  padding: '3px 8px', fontSize: '11px', borderRadius: '5px', border: '1px solid',
                                  cursor: 'pointer', fontWeight: 600,
                                  background: overrides[perm.code] === true ? '#d1fae5' : '#f9fafb',
                                  borderColor: overrides[perm.code] === true ? '#6ee7b7' : '#e5e7eb',
                                  color: overrides[perm.code] === true ? '#065f46' : '#888',
                                }}
                              >Grant</button>
                              <button
                                onClick={() => setOverrides(p => ({ ...p, [perm.code]: false }))}
                                style={{
                                  padding: '3px 8px', fontSize: '11px', borderRadius: '5px', border: '1px solid',
                                  cursor: 'pointer', fontWeight: 600,
                                  background: overrides[perm.code] === false ? '#fee2e2' : '#f9fafb',
                                  borderColor: overrides[perm.code] === false ? '#fca5a5' : '#e5e7eb',
                                  color: overrides[perm.code] === false ? '#991b1b' : '#888',
                                }}
                              >Revoke</button>
                              {hasOverride && (
                                <button
                                  onClick={() => setOverrides(p => { const n = { ...p }; delete n[perm.code]; return n })}
                                  style={{
                                    padding: '3px 8px', fontSize: '11px', borderRadius: '5px',
                                    border: '1px solid #e5e7eb', cursor: 'pointer',
                                    background: '#f9fafb', color: '#888', fontWeight: 500,
                                  }}
                                  title="Remove override — revert to role default"
                                >Reset</button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb' }}>
          <div style={{ fontSize: '12px', color: '#888' }}>
            {Object.keys(overrides).length > 0 && (
              <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                ⚠ {Object.keys(overrides).length} permission override{Object.keys(overrides).length > 1 ? 's' : ''} set
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={onClose} style={{ padding: '10px 20px', background: '#f3f4f6', color: '#333', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={saving} style={{
              padding: '10px 24px', background: saving ? '#999' : '#1a1a2e', color: '#fff',
              border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer'
            }}>
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Employee'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const Section = ({ title, children }) => (
  <div style={{ marginBottom: '24px' }}>
    <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{title}</p>
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
const inp = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }