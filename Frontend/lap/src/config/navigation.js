// src/config/navigation.js
// Permission codes must match exactly what seed_permissions.py defines.
// Sidebar items appear ONLY if the employee has the matching permission granted.
//
// ── Icon images ──────────────────────────────────────────────────────────────
// Place these PNG files in /public/icons/  (48×48px, transparent background)
// Recommended sources: icons8.com · flaticon.com · heroicons.dev
//
//   /icons/dashboard.png
//   /icons/employees.png
//   /icons/departments.png
//   /icons/attendance.png
//   /icons/leave.png
//   /icons/payroll.png
//   /icons/reports.png
//   /icons/notifications.png
//   /icons/settings.png
//   /icons/system-settings.png
//   /icons/permissions.png
//
// The Sidebar auto-detects image paths (strings starting with "/") and renders
// them as <img> tags with CSS filter tinting. Emojis still work as fallback.

export const NAV_ITEMS = [
  { label: 'Dashboard',       path: '/dashboard',                 icon: '/icons/dashboard.png',       always: true },
  { label: 'Employees',       path: '/dashboard/employees',       icon: '/icons/employees.png',       codes: ['view_employees', 'create_employee'] },
  { label: 'Departments',     path: '/dashboard/departments',     icon: '/icons/departments.png',     codes: ['view_departments', 'create_department'] },
  { label: 'Attendance',      path: '/dashboard/attendance',      icon: '/icons/attendance.png',      codes: ['view_attendance', 'view_team_attendance'] },
  { label: 'Leave',           path: '/dashboard/leave',           icon: '/icons/leave.png',           codes: ['view_leave', 'apply_leave', 'approve_leave', 'view_all_leave'] },
  { label: 'Payroll',         path: '/dashboard/payroll',         icon: '/icons/payroll.png',         codes: ['view_payslip', 'view_payroll', 'process_payroll'] },
  { label: 'Support Tickets', path: '/dashboard/support-tickets', icon: '/icons/notifications.png',   codes: ['raise_support_ticket', 'view_support_tickets', 'manage_support_tickets'] },
  { label: 'Reports',         path: '/dashboard/reports',         icon: '/icons/reports.png',         codes: ['view_reports'] },
  { label: 'Self Reports',    path: '/dashboard/self-reports',    icon: '/icons/reports.png',         codes: ['self_reports'] },
  // { label: 'Permissions',  path: '/dashboard/permissions',     icon: '/icons/permissions.png',     codes: ['manage_permissions'] },
  { label: 'Notifications',   path: '/dashboard/notifications',   icon: '/icons/notifications.png',   always: true },
  { label: 'Settings',        path: '/dashboard/settings',        icon: '/icons/settings.png',        always: true },
  { label: 'System Settings', path: '/dashboard/settings/system', icon: '/icons/system-settings.png', codes: ['manage_settings'] },
]

// Superadmin sees everything always (bypasses permission check)
export const SUPERADMIN_NAV = [
  { label: 'Dashboard',       path: '/dashboard',                 icon: '/icons/dashboard.png'        },
  { label: 'Employees',       path: '/dashboard/employees',       icon: '/icons/employees.png'        },
  { label: 'Departments',     path: '/dashboard/departments',     icon: '/icons/departments.png'      },
  { label: 'Attendance',      path: '/dashboard/attendance',      icon: '/icons/attendance.png'       },
  { label: 'Leave',           path: '/dashboard/leave',           icon: '/icons/leave.png'            },
  { label: 'Payroll',         path: '/dashboard/payroll',         icon: '/icons/payroll.png'          },
  { label: 'Support Tickets', path: '/dashboard/support-tickets', icon: '/icons/notifications.png'    },
  { label: 'Reports',         path: '/dashboard/reports',         icon: '/icons/reports.png'          },
  { label: 'Self Reports',    path: '/dashboard/self-reports',    icon: '/icons/reports.png'          },
  // { label: 'Permissions',  path: '/dashboard/permissions',     icon: '/icons/permissions.png'      },
  { label: 'Notifications',   path: '/dashboard/notifications',   icon: '/icons/notifications.png'    },
  { label: 'Settings',        path: '/dashboard/settings',        icon: '/icons/settings.png'         },
  { label: 'System Settings', path: '/dashboard/settings/system', icon: '/icons/system-settings.png'  },
]

export default { superadmin: SUPERADMIN_NAV, admin: SUPERADMIN_NAV }
