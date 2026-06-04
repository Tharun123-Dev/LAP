// src/api/endpoints.js
// ── REPLACEMENT FILE ──
// Replace: Frontend/lap/src/api/endpoints.js
// Change:  Added HOLIDAY_DETAIL: (id) => `…/holidays/${id}/`
//          (needed for PUT / DELETE on individual holidays)

const BASE = 'http://localhost:8000/api'
// const BASE = 'https://lap-b9vi.onrender.com/api'

const ENDPOINTS = {
  AUTH: {
    LOGIN:   `${BASE}/auth/login/`,
    LOGOUT:  `${BASE}/auth/logout/`,
    REFRESH: `${BASE}/auth/token/refresh/`,
  },
  USERS: {
    LIST:            `${BASE}/users/`,
    CREATE:          `${BASE}/users/create/`,
    ME:              `${BASE}/users/me/`,
    DETAIL:  (id) => `${BASE}/users/${id}/`,
  },
  PERMISSIONS: {
    LIST:                  `${BASE}/permissions/`,
    ALL_ROLES:             `${BASE}/permissions/roles/`,
    BY_ROLE:     (role) => `${BASE}/permissions/roles/${role}/`,
    UPDATE_ROLE: (role) => `${BASE}/permissions/roles/${role}/update/`,
  },
  EMPLOYEES: {
    LIST:                `${BASE}/employees/`,
    CREATE:              `${BASE}/employees/create/`,
    DETAIL:     (id) => `${BASE}/employees/${id}/`,
    UPDATE:     (id) => `${BASE}/employees/${id}/update/`,
    DEACTIVATE: (id) => `${BASE}/employees/${id}/deactivate/`,
    MANAGERS:            `${BASE}/employees/managers/`,
  },
  DEPARTMENTS: {
    LIST:          `${BASE}/departments/`,
    DETAIL: (id) => `${BASE}/departments/${id}/`,
  },
  ATTENDANCE: {
    CHECKIN:              `${BASE}/attendance/checkin/`,
    CHECKOUT:             `${BASE}/attendance/checkout/`,
    TODAY:                `${BASE}/attendance/today/`,
    MY_RECORDS:           `${BASE}/attendance/my/`,
    ALL:                  `${BASE}/attendance/all/`,
    REGULARIZE:           `${BASE}/attendance/regularize/`,
    MY_REGULARIZATIONS:   `${BASE}/attendance/regularize/my/`,
    ALL_REGULARIZATIONS:  `${BASE}/attendance/regularize/all/`,
    REGULARIZE_ACTION: (id) => `${BASE}/attendance/regularize/${id}/action/`,
    HOLIDAYS:             `${BASE}/attendance/holidays/`,
    HOLIDAY_DETAIL: (id) => `${BASE}/attendance/holidays/${id}/`,   // ← NEW
    OFFICE_LOCATION:      `${BASE}/attendance/office-location/`,
  },
  LEAVE: {
    TYPES:              `${BASE}/leave/types/`,
    TYPE_DETAIL: (id) => `${BASE}/leave/types/${id}/`,
    BALANCE:            `${BASE}/leave/balance/`,
    INIT_BALANCE:       `${BASE}/leave/balance/init/`,
    APPLY:              `${BASE}/leave/apply/`,
    MY_REQUESTS:        `${BASE}/leave/my/`,
    ALL_REQUESTS:       `${BASE}/leave/all/`,
    ACTION:       (id) => `${BASE}/leave/${id}/action/`,
    CANCEL:       (id) => `${BASE}/leave/${id}/cancel/`,
    PRIOR_USAGE:  (id) => `${BASE}/leave/${id}/prior-usage/`,
    POLICY_SETTINGS:    `${BASE}/leave/policy-settings/`,
  },
  PAYROLL: {
    SALARY_LIST:                   `${BASE}/payroll/salary/`,
    SALARY_CREATE:                 `${BASE}/payroll/salary/create/`,
    SALARY_UPDATE:       (id) => `${BASE}/payroll/salary/${id}/`,
    MY_SALARY:                     `${BASE}/payroll/salary/mine/`,

    SETTINGS_DEFAULTS:             `${BASE}/payroll/settings-defaults/`,

    RUNS:                          `${BASE}/payroll/runs/`,
    RUN_CREATE:                    `${BASE}/payroll/runs/create/`,
    RUN_DETAIL:          (id) => `${BASE}/payroll/runs/${id}/`,
    RUN_PROCESS:         (id) => `${BASE}/payroll/runs/${id}/process/`,
    RUN_APPROVE:         (id) => `${BASE}/payroll/runs/${id}/approve/`,
    RUN_REGISTER:        (id) => `${BASE}/payroll/runs/${id}/register/`,
    ENTRY_UPDATE:        (id) => `${BASE}/payroll/entries/${id}/`,
    ENTRY_ADJUST:        (id) => `${BASE}/payroll/entries/${id}/adjust/`,
    MY_PAYSLIPS:                   `${BASE}/payroll/payslips/`,
    PAYSLIP:          (m, y) => `${BASE}/payroll/payslips/${m}/${y}/`,
    MY_DEDUCTIONS:                 `${BASE}/payroll/deductions/mine/`,
    EMP_DEDUCTIONS:      (id) => `${BASE}/payroll/deductions/employee/${id}/`,
    DEDUCTION_SUMMARY:             `${BASE}/payroll/deductions/summary/`,
    DASHBOARD_STATS:               `${BASE}/payroll/dashboard-stats/`,
  },
  SUPPORT_TICKETS: {
    TYPES:              `${BASE}/support/ticket-types/`,
    TYPE_DETAIL: (id) => `${BASE}/support/ticket-types/${id}/`,
    RAISE:              `${BASE}/support/tickets/raise/`,
    MY:                 `${BASE}/support/tickets/my/`,
    ALL:                `${BASE}/support/tickets/all/`,
    SUMMARY:            `${BASE}/support/tickets/summary/`,
    ACTION:      (id) => `${BASE}/support/tickets/${id}/action/`,
    REQUESTER_ACTION: (id) => `${BASE}/support/tickets/${id}/requester-action/`,
  },
  REPORTS: {
    ATTENDANCE: `${BASE}/reports/attendance/`,
    LEAVE:      `${BASE}/reports/leave/`,
    PAYROLL:    `${BASE}/reports/payroll/`,
    HEADCOUNT:  `${BASE}/reports/headcount/`,
  },
  NOTIFICATIONS: {
    LIST:            `${BASE}/notifications/`,
    UNREAD_COUNT:    `${BASE}/notifications/unread-count/`,
    MARK_ALL_READ:   `${BASE}/notifications/read-all/`,
    MARK_READ: (id) => `${BASE}/notifications/${id}/read/`,
    DELETE:    (id) => `${BASE}/notifications/${id}/`,
  },
  SYSTEM_SETTINGS: {
    LIST:           `${BASE}/system-settings/`,
    DETAIL: (key) => `${BASE}/system-settings/${key}/`,
  },
}

export default ENDPOINTS
