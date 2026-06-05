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

export const AFFILIATE_NAV_ITEMS = [
  { label: 'Referrals', path: '/dashboard/affiliate/referrals' },
  { label: 'Referral Links', path: '/dashboard/affiliate/referral-links' },
  { label: 'Earnings', path: '/dashboard/affiliate/earnings' },
  { label: 'Commission History', path: '/dashboard/affiliate/commissions' },
  { label: 'Payments', path: '/dashboard/affiliate/payments' },
  { label: 'Notifications', path: '/dashboard/affiliate/notifications' },
  { label: 'Settings', path: '/dashboard/affiliate/settings' },
  { label: 'Preferences', path: '/dashboard/affiliate/preferences' },
  { label: 'Profile', path: '/dashboard/affiliate/profile' },
]

export const LEADS_NAV_ITEMS = [
  { label: 'All Leads', path: '/dashboard/leads', codes: ['view_leads'] },
  { label: 'Student Form', path: '/dashboard/leads/student-form', codes: ['create_lead'] },
  { label: 'Add Lead', path: '/dashboard/leads/add', codes: ['create_lead'] },
  { label: 'Follow Ups', path: '/dashboard/leads/follow-ups', codes: ['view_followups', 'create_followup'] },
  { label: 'Analytics', path: '/dashboard/leads/analytics', codes: ['view_lead_analytics'] },
  { label: 'Form Builder', path: '/dashboard/leads/form-builder', codes: ['manage_lead_forms'] },
]

export const TASK_NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard/tasks', codes: ['view_tasks', 'view_team_tasks'] },
  { label: 'Create Task', path: '/dashboard/tasks', codes: ['create_task'] },
  { label: 'My Tasks', path: '/dashboard/tasks', codes: ['view_tasks'] },
]

export const REVENUE_NAV_ITEMS = [
  { label: 'Overview', path: '/dashboard/revenue', codes: ['view_revenue'] },
]

export const NAV_ITEMS = [
  { label: 'Dashboard',       path: '/dashboard',                 icon: '/icons/dashboard.png',       always: true },
  { label: 'Affiliate Dashboard',path: '/dashboard/affiliate', icon: '/icons/affiliate.png', codes: ['view_affiliate', 'manage_affiliate'], children: AFFILIATE_NAV_ITEMS },
  { label: 'Employees',       path: '/dashboard/employees',       icon: '/icons/employees.png',       codes: ['view_employees', 'create_employee'] },
  { label: 'Departments',     path: '/dashboard/departments',     icon: '/icons/departments.png',     codes: ['view_departments', 'create_department'] },
  { label: 'Attendance',      path: '/dashboard/attendance',      icon: '/icons/attendance.png',      codes: ['view_attendance', 'view_team_attendance'] },
  { label: 'Leave',           path: '/dashboard/leave',           icon: '/icons/leave.png',           codes: ['view_leave', 'apply_leave', 'approve_leave', 'view_all_leave'] },
  { label: 'Payroll',         path: '/dashboard/payroll',         icon: '/icons/payroll.png',         codes: ['view_payslip', 'view_payroll', 'process_payroll'] },
  { label: 'Support Tickets', path: '/dashboard/support-tickets', icon: '/icons/notifications.png',   codes: ['raise_support_ticket', 'view_support_tickets', 'manage_support_tickets'] },
  { label: 'Reports',         path: '/dashboard/reports',         icon: '/icons/reports.png',         codes: ['view_reports'] },
  { label: 'Self Reports',    path: '/dashboard/self-reports',    icon: '/icons/reports.png',         codes: ['self_reports'] },
  { label: 'Permissions',     path: '/dashboard/permissions',     icon: '/icons/permissions.png',     codes: ['manage_permissions'] },
  { label: 'Notifications',   path: '/dashboard/notifications',   icon: '/icons/notifications.png',   always: true },
  { label: 'Settings',        path: '/dashboard/settings',        icon: '/icons/settings.png',        always: true },
  { label: 'System Settings', path: '/dashboard/settings/system', icon: '/icons/system-settings.png', codes: ['manage_settings'] },
  { label: 'Tasks', path: '/dashboard/tasks', icon: 'tasks', codes: ['view_tasks', 'view_team_tasks', 'create_task', 'assign_task'], children: TASK_NAV_ITEMS },
  { label: 'Leads', path: '/dashboard/leads', icon: '/icons/leads.png', codes: ['view_leads', 'create_lead', 'view_followups', 'create_followup', 'view_lead_analytics', 'manage_lead_forms'], children: LEADS_NAV_ITEMS },
  { label: 'Revenue', path: '/dashboard/revenue', icon: 'revenue', codes: ['view_revenue', 'manage_revenue'], children: REVENUE_NAV_ITEMS },
]

export default { items: NAV_ITEMS }
