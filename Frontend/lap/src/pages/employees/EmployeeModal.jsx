import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { createEmployeeApi, updateEmployeeApi, listManagersApi } from '../../api/services/employees'
import { getCustomRolesApi, getUserPermissionsApi, saveUserPermissionsApi } from '../../api/services/permissions'
import { updatePermissions } from '../../store/authSlice'
import toast from 'react-hot-toast'

const DESIGNATIONS = [
  'software_engineer', 'senior_engineer', 'team_lead', 'project_manager',
  'hr_executive', 'hr_manager', 'accountant', 'analyst', 'intern', 'other',
]

const BASE_ROLES = [
  { value: 'employee', label: 'Employee' },
  { value: 'counselor', label: 'Counselor' },
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

  const [managers,      setManagers]      = useState([])
  const [customRoles,   setCustomRoles]   = useState([])
  // permState: { [code]: boolean } — true = granted, false = denied
  const [permState,     setPermState]     = useState({})
  // allPerms: [{code, label, module}] from getUserPermissionsApi
  const [allPerms,      setAllPerms]      = useState([])
  const [activeTab,     setActiveTab]     = useState('info')
  const [saving,        setSaving]        = useState(false)
  const [loadingPerms,  setLoadingPerms]  = useState(false)

  const [form, setForm] = useState({
    username: '', email: '', first_name: '', last_name: '',
    password: '', role: 'employee', employee_type: 'regular',
    custom_role: '', emp_code: '', department: '',
    designation: 'software_engineer',
    work_mode: 'office',
    joining_date: new Date().toISOString().split('T')[0],
    phone: '', address: '', manager: '', date_of_birth: '',
  })

  const allRoles = [...BASE_ROLES, ...SUPERADMIN_ONLY_ROLES]

  const availableRoles = allRoles.some(r => r.value === (isEdit ? employee?.role : form.role))
    ? allRoles
    : isEdit && employee?.role
      ? [...allRoles, { value: employee.role, label: employee.role.charAt(0).toUpperCase() + employee.role.slice(1) }]
      : allRoles

  // Load permissions for this employee (when editing)
  const loadEmployeePerms = (userId) => {
    setLoadingPerms(true)
    getUserPermissionsApi(userId)
      .then(r => {
        setAllPerms(r.data.permissions)
        // Build permState from is_granted
        const state = {}
        r.data.permissions.forEach(p => {
          state[p.code] = p.is_granted
        })
        setPermState(state)
      })
      .catch(() => toast.error('Failed to load permissions'))
      .finally(() => setLoadingPerms(false))
  }

  // For new employee: load all permissions (defaulting all to false)
  const loadAllPermsForNew = () => {
    setLoadingPerms(true)
    // Use a dummy fetch — we'll use the permissions list endpoint
    import('../../api/services/permissions').then(({ getPermissionListApi }) => {
      getPermissionListApi()
        .then(r => {
          const perms = r.data
          setAllPerms(perms)
          const state = {}
          perms.forEach(p => { state[p.code] = false })
          setPermState(state)
        })
        .catch(() => {})
        .finally(() => setLoadingPerms(false))
    })
  }

  useEffect(() => {
    listManagersApi().then(r => setManagers(r.data)).catch(() => {})
    getCustomRolesApi().then(r => setCustomRoles(r.data)).catch(() => {})

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
        work_mode:     employee.work_mode     || 'office',
        joining_date:  employee.joining_date  || '',
        phone:         employee.phone         || '',
        address:       employee.address       || '',
        manager:       employee.manager       || '',
        date_of_birth: employee.date_of_birth || '',
      })
      if (employee.user_id) {
        loadEmployeePerms(employee.user_id)
      }
    } else {
      loadAllPermsForNew()
    }
  }, [])

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  // Toggle single permission
  const togglePerm = (code) => {
    setPermState(prev => ({ ...prev, [code]: !prev[code] }))
  }

  // Select all / deselect all in a module
  const toggleModule = (moduleCodes, grantAll) => {
    setPermState(prev => {
      const next = { ...prev }
      moduleCodes.forEach(c => { next[c] = grantAll })
      return next
    })
  }

  // Group allPerms by module
  const groupedPerms = allPerms.reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = []
    acc[p.module].push(p)
    return acc
  }, {})

  const grantedCount = Object.values(permState).filter(Boolean).length

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
      // Build permissions list from permState
      const permissionsList = Object.entries(permState).map(([code, is_granted]) => ({
        code, is_granted
      }))

      const payload = {
        ...form,
        custom_role: form.custom_role || null,
        permission_overrides: permissionsList,
      }
      if (!payload.department)    delete payload.department
      if (!payload.manager)       delete payload.manager
      if (!payload.date_of_birth) delete payload.date_of_birth
      if (isEdit && !payload.password) delete payload.password

      if (isEdit) {
        await updateEmployeeApi(employee.id, payload)

        // Always save permissions when editing
        if (employee.user_id) {
          const saveRes = await saveUserPermissionsApi(employee.user_id, permissionsList)

          // If this employee IS the currently logged-in user → update their sidebar instantly
          const isSelf = String(employee.user_id) === String(currentUserId)
          if (isSelf && saveRes.data?.permissions) {
            dispatch(updatePermissions(saveRes.data.permissions))
          }
        }

        toast.success('Employee updated!')
      } else {
        // Create employee, then save permissions after getting user_id back
        const createRes = await createEmployeeApi(payload)
        const newUserId = createRes.data?.user_id || createRes.data?.id
        if (newUserId && permissionsList.some(p => p.is_granted)) {
          await saveUserPermissionsApi(newUserId, permissionsList)
        }
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
    { id: 'permissions', label: `🔐 Permissions ${grantedCount > 0 ? `(${grantedCount})` : ''}` },
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
                    <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} style={inp}>
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
                <Row>
                  <Field label="Work Mode">
                    <select value={form.work_mode} onChange={set('work_mode')} style={inp}>
                      <option value="office">Work From Office</option>
                      <option value="work_from_home">Work From Home</option>
                    </select>
                  </Field>
                  <Field label="Location Rule">
                    <input
                      value={form.work_mode === 'work_from_home' ? 'Any location allowed' : 'Office radius required'}
                      style={{ ...inp, background: '#f9fafb', color: '#666' }}
                      disabled
                    />
                  </Field>
                </Row>
                <div style={{ background: '#f0f4ff', border: '1px solid #c7d7fe', borderRadius: '8px', padding: '12px', marginTop: '8px', fontSize: '12px', color: '#3730a3' }}>
                  <strong>ℹ️ Note:</strong> Base Role is for identification only. All actual access is controlled via the <strong>Permissions tab</strong>.
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
              {/* Info banner */}
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '12px', color: '#1e40af' }}>
                <strong>🔐 Permission Control:</strong> Check the permissions you want to grant this employee.
                Only checked permissions will appear in their dashboard sidebar and be accessible.
                Uncheck to remove access instantly on next login.
              </div>

              {/* Stats bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 16px', marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', color: '#555' }}>
                  <strong style={{ color: '#16a34a' }}>{grantedCount}</strong> / {allPerms.length} permissions granted
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setPermState(Object.fromEntries(allPerms.map(p => [p.code, true])))}
                    style={{ padding: '4px 12px', fontSize: '11px', borderRadius: '6px', border: '1px solid #86efac', background: '#dcfce7', color: '#166534', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Grant All
                  </button>
                  <button
                    onClick={() => setPermState(Object.fromEntries(allPerms.map(p => [p.code, false])))}
                    style={{ padding: '4px 12px', fontSize: '11px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fee2e2', color: '#991b1b', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Revoke All
                  </button>
                </div>
              </div>

              {loadingPerms ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading permissions...</div>
              ) : Object.keys(groupedPerms).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#aaa', fontSize: '13px' }}>
                  No permissions found. Make sure the backend is reachable.
                </div>
              ) : (
                Object.entries(groupedPerms).map(([module, perms]) => {
                  const moduleGranted = perms.filter(p => permState[p.code]).length
                  const allGranted    = moduleGranted === perms.length

                  return (
                    <div key={module} style={{ marginBottom: '16px', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                      {/* Module header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {module}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '11px', color: '#aaa' }}>{moduleGranted}/{perms.length}</span>
                          <button
                            onClick={() => toggleModule(perms.map(p => p.code), !allGranted)}
                            style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', border: '1px solid #e5e7eb', background: allGranted ? '#fee2e2' : '#dcfce7', color: allGranted ? '#991b1b' : '#166534', cursor: 'pointer', fontWeight: 600 }}
                          >
                            {allGranted ? 'Revoke All' : 'Grant All'}
                          </button>
                        </div>
                      </div>

                      {/* Permission rows */}
                      {perms.map((perm, i) => {
                        const granted = !!permState[perm.code]
                        return (
                          <label key={perm.code} style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '11px 16px', cursor: 'pointer',
                            background: i % 2 === 0 ? '#fff' : '#fafafa',
                            borderTop: i > 0 ? '1px solid #f3f4f6' : 'none',
                            transition: 'background 0.1s',
                          }}>
                            {/* Checkbox */}
                            <input
                              type="checkbox"
                              checked={granted}
                              onChange={() => togglePerm(perm.code)}
                              style={{ width: 16, height: 16, accentColor: '#1a1a2e', cursor: 'pointer', flexShrink: 0 }}
                            />

                            {/* Label + code */}
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '13px', fontWeight: 500, color: '#111' }}>{perm.label}</div>
                              <div style={{ fontSize: '11px', color: '#aaa', fontFamily: 'monospace' }}>{perm.code}</div>
                            </div>

                            {/* Status badge */}
                            <span style={{
                              fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px',
                              background: granted ? '#d1fae5' : '#f3f4f6',
                              color: granted ? '#065f46' : '#9ca3af',
                              border: `1px solid ${granted ? '#6ee7b7' : '#e5e7eb'}`,
                              flexShrink: 0,
                            }}>
                              {granted ? '✓ GRANTED' : '✗ DENIED'}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb' }}>
          <div style={{ fontSize: '12px', color: '#888' }}>
            {grantedCount > 0 && (
              <span style={{ color: '#059669', fontWeight: 600 }}>
                ✓ {grantedCount} permission{grantedCount > 1 ? 's' : ''} will be granted
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
