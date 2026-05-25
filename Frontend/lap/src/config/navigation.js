// src/config/navigation.js
// Permission codes must match exactly what seed_permissions.py defines.
// Sidebar items appear ONLY if the employee has the matching permission granted.

export const NAV_ITEMS = [
  { label: 'Dashboard',       path: '/dashboard',                 icon: '🏠', always: true },
  { label: 'Employees',       path: '/dashboard/employees',       icon: '👥', codes: ['view_employees', 'create_employee'] },
  { label: 'Departments',     path: '/dashboard/departments',     icon: '🏢', codes: ['view_departments', 'create_department'] },
  { label: 'Attendance',      path: '/dashboard/attendance',      icon: '📅', codes: ['view_attendance', 'view_team_attendance'] },
  { label: 'Leave',           path: '/dashboard/leave',           icon: '🌴', codes: ['view_leave', 'apply_leave', 'approve_leave', 'view_all_leave'] },
  { label: 'Payroll',         path: '/dashboard/payroll',         icon: '💰', codes: ['view_payslip', 'view_payroll', 'process_payroll'] },
  { label: 'Reports',         path: '/dashboard/reports',         icon: '📊', codes: ['view_reports'] },
  // { label: 'Permissions',     path: '/dashboard/permissions',     icon: '🔐', codes: ['manage_permissions'] },
  { label: 'Notifications',   path: '/dashboard/notifications',   icon: '🔔', always: true },
  { label: 'Settings',        path: '/dashboard/settings',        icon: '⚙️', always: true },
  { label: 'System Settings', path: '/dashboard/settings/system', icon: '🛠️', codes: ['manage_settings'] },
]

// Superadmin sees everything always (bypasses permission check)
export const SUPERADMIN_NAV = [
  { label: 'Dashboard',       path: '/dashboard',                 icon: '🏠' },
  { label: 'Employees',       path: '/dashboard/employees',       icon: '👥' },
  { label: 'Departments',     path: '/dashboard/departments',     icon: '🏢' },
  { label: 'Attendance',      path: '/dashboard/attendance',      icon: '📅' },
  { label: 'Leave',           path: '/dashboard/leave',           icon: '🌴' },
  { label: 'Payroll',         path: '/dashboard/payroll',         icon: '💰' },
  { label: 'Reports',         path: '/dashboard/reports',         icon: '📊' },
  // { label: 'Permissions',     path: '/dashboard/permissions',     icon: '🔐' },
  { label: 'Notifications',   path: '/dashboard/notifications',   icon: '🔔' },
  { label: 'Settings',        path: '/dashboard/settings',        icon: '⚙️' },
  { label: 'System Settings', path: '/dashboard/settings/system', icon: '🛠️' },
]

export default { superadmin: SUPERADMIN_NAV, admin: SUPERADMIN_NAV }