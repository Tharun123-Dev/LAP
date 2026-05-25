// src/config/navigation.js

// Maps permission codes to sidebar nav items.
// 'always' = shown regardless of permissions.
export const NAV_ITEMS = [
  { label: 'Dashboard',       path: '/dashboard',                icon: '🏠', always: true },
  { label: 'Employees',       path: '/dashboard/employees',      icon: '👥', codes: ['employee.view', 'employee.create'] },
  { label: 'Departments',     path: '/dashboard/departments',    icon: '🏢', codes: ['department.view', 'department.create'] },
  { label: 'Attendance',      path: '/dashboard/attendance',     icon: '📅', codes: ['attendance.view', 'attendance.manage'] },
  { label: 'Leave',           path: '/dashboard/leave',          icon: '🌴', codes: ['leave.view', 'leave.apply', 'leave.approve'] },
  { label: 'Payroll',         path: '/dashboard/payroll',        icon: '💰', codes: ['payroll.view', 'payroll.manage'] },
  { label: 'Reports',         path: '/dashboard/reports',        icon: '📊', codes: ['report.view'] },
  { label: 'Permissions',     path: '/dashboard/permissions',    icon: '🔐', codes: ['permission.manage'] },
  { label: 'Notifications',   path: '/dashboard/notifications',  icon: '🔔', always: true },
  { label: 'Settings',        path: '/dashboard/settings',       icon: '⚙️', always: true },
  { label: 'System Settings', path: '/dashboard/settings/system',icon: '🛠️', codes: ['settings.system'] },
]

// Superadmin always sees everything
export const SUPERADMIN_NAV = [
  { label: 'Dashboard',       path: '/dashboard',                icon: '🏠' },
  { label: 'Employees',       path: '/dashboard/employees',      icon: '👥' },
  { label: 'Departments',     path: '/dashboard/departments',    icon: '🏢' },
  { label: 'Attendance',      path: '/dashboard/attendance',     icon: '📅' },
  { label: 'Leave',           path: '/dashboard/leave',          icon: '🌴' },
  { label: 'Payroll',         path: '/dashboard/payroll',        icon: '💰' },
  { label: 'Reports',         path: '/dashboard/reports',        icon: '📊' },
  { label: 'Permissions',     path: '/dashboard/permissions',    icon: '🔐' },
  { label: 'Notifications',   path: '/dashboard/notifications',  icon: '🔔' },
  { label: 'Settings',        path: '/dashboard/settings',       icon: '⚙️' },
  { label: 'System Settings', path: '/dashboard/settings/system',icon: '🛠️' },
]

// Default export so any file still using `import NAV from '...'` doesn't crash
const NAV = {
  superadmin: SUPERADMIN_NAV,
  // For non-superadmin roles, Topbar/Sidebar uses NAV_ITEMS + permissions filter
  // Keeping these as fallbacks for Topbar page title lookup
  admin:    SUPERADMIN_NAV,
  manager: [
    { label: 'Dashboard',     path: '/dashboard',               icon: '🏠' },
    { label: 'My Team',       path: '/dashboard/employees',     icon: '👥' },
    { label: 'Attendance',    path: '/dashboard/attendance',    icon: '📅' },
    { label: 'Leave',         path: '/dashboard/leave',         icon: '🌴' },
    { label: 'Reports',       path: '/dashboard/reports',       icon: '📊' },
    { label: 'Notifications', path: '/dashboard/notifications', icon: '🔔' },
    { label: 'Settings',      path: '/dashboard/settings',      icon: '⚙️' },
  ],
  hr: [
    { label: 'Dashboard',       path: '/dashboard',                icon: '🏠' },
    { label: 'Employees',       path: '/dashboard/employees',      icon: '👥' },
    { label: 'Attendance',      path: '/dashboard/attendance',     icon: '📅' },
    { label: 'Leave',           path: '/dashboard/leave',          icon: '🌴' },
    { label: 'Payroll',         path: '/dashboard/payroll',        icon: '💰' },
    { label: 'Reports',         path: '/dashboard/reports',        icon: '📊' },
    { label: 'Notifications',   path: '/dashboard/notifications',  icon: '🔔' },
    { label: 'Settings',        path: '/dashboard/settings',       icon: '⚙️' },
    { label: 'System Settings', path: '/dashboard/settings/system',icon: '🛠️' },
  ],
  employee: [
    { label: 'Dashboard',     path: '/dashboard',               icon: '🏠' },
    { label: 'Attendance',    path: '/dashboard/attendance',    icon: '📅' },
    { label: 'My Leave',      path: '/dashboard/leave',         icon: '🌴' },
    { label: 'My Payslip',    path: '/dashboard/payslip',       icon: '🧾' },
    { label: 'Notifications', path: '/dashboard/notifications', icon: '🔔' },
    { label: 'Settings',      path: '/dashboard/settings',      icon: '⚙️' },
  ],
}

export default NAV