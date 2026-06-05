import { Routes, Route, Navigate, NavLink } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import Login from './pages/Login'
import Unauthorized from './pages/Unauthorized'
import Shell from './components/layout/Shell'
import Dashboard from './pages/Dashboard'
import PermissionManager from './pages/admin/PermissionManager'
import EmployeesPage from './pages/employees/EmployeesPage'
import DepartmentsPage from './pages/departments/DepartmentsPage'
import AttendancePage from './pages/attendance/AttendancePage'
import LeavePage from './pages/leave/LeavePage'
import PayrollPage from './pages/payroll/PayrollPage'
import ReportsPage from './pages/reports/ReportsMain'
import NotificationsPage from './pages/notifications/NotificationsMain'
import SupportTicketsPage from './pages/support/SupportTicketsPage'
import ProfileSettings from './pages/settings/ProfileSettings'
import SystemSettings from './pages/settings/SystemSettings'
import RevenuePage from './pages/revenue/RevenuePage'
import ProtectedRoute from './components/ProtectedRoute'
import AuthSync from './components/AuthSync'
import { AFFILIATE_NAV_ITEMS } from './config/navigation'

import AffiliateDashboard from './affiliate/pages/dashboard/DashboardHome'
import AffiliateReferrals from './affiliate/pages/referrals/ReferralsList'
import AffiliateReferralDet from './affiliate/pages/referrals/ReferralDetails'
import AffiliateRefLinks from './affiliate/pages/referral-links/ReferralLinkPage'
import AffiliateEarnings from './affiliate/pages/earnings/EarningsOverview'
import AffiliateCommissions from './affiliate/pages/earnings/CommissionHistory'
import AffiliatePayments from './affiliate/pages/payments/PaymentHistory'
import AffiliatePaymentDet from './affiliate/pages/payments/TransactionDetails'
import AffiliateInvoice from './affiliate/pages/payments/InvoicePage'
import AffiliateProfile from './affiliate/pages/profile/ProfilePage'
import AffiliateNotifs from './affiliate/pages/notifications/NotificationsPage'
import AffiliateSettings from './affiliate/pages/settings/AppearanceSettings'
import AffiliatePreferences from './affiliate/pages/settings/Preferences'
import AffiliateRegister from './affiliate/pages/auth/Register'
import CustomerRegister from './affiliate/pages/auth/CustomerRegister'
import AffiliateAuthShell from './affiliate/layouts/AffiliateAuthShell'
import { AffiliateAuthProvider } from './affiliate/context/AffiliateAuthContext'
import { ThemeProvider } from './affiliate/context/ThemeContext'
import { NotificationProvider } from './affiliate/context/NotificationContext'
import './affiliate/styles/globals.css'
import './affiliate/styles/theme.css'
import './affiliate/styles/animations.css'

import TaskShell from './tasks/TaskShell'
import LeadShell from './leads/LeadShell'

const AffiliateProviders = ({ children }) => (
  <ThemeProvider>
    <NotificationProvider>
      <AffiliateAuthProvider>{children}</AffiliateAuthProvider>
    </NotificationProvider>
  </ThemeProvider>
)

const affiliateGuard = ['view_affiliate', 'manage_affiliate']
const leadsGuard = ['view_leads', 'create_lead', 'view_followups', 'create_followup', 'view_lead_analytics', 'manage_lead_forms']
const tasksGuard = ['view_tasks', 'view_team_tasks', 'create_task', 'assign_task']
const revenueGuard = ['view_revenue', 'manage_revenue']

const AffiliateSectionShell = ({ children }) => (
  <AffiliateProviders>
    <div className="min-h-full">
      <div className="mb-6 flex flex-wrap items-center gap-1 border-b border-slate-200 pb-3 dark:border-slate-700">
        <span className="mr-2 text-xs font-bold uppercase tracking-wider text-slate-400">Affiliate</span>
        {AFFILIATE_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `rounded-lg px-3 py-1.5 text-sm font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
      {children}
    </div>
  </AffiliateProviders>
)

const withAffiliateAccess = (children) => (
  <ProtectedRoute requiredAny={affiliateGuard}>
    <AffiliateSectionShell>{children}</AffiliateSectionShell>
  </ProtectedRoute>
)

export default function App() {
  return (
    <>
      <AuthSync />
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/register" element={<AffiliateProviders><CustomerRegister /></AffiliateProviders>} />
        <Route path="/affiliate/register" element={<AffiliateProviders><AffiliateAuthShell><AffiliateRegister /></AffiliateAuthShell></AffiliateProviders>} />

        <Route path="tasks" element={<ProtectedRoute requiredAny={tasksGuard}><TaskShell /></ProtectedRoute>} />

        <Route path="/dashboard" element={<ProtectedRoute><Shell /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="employees" element={<ProtectedRoute requiredPermission="view_employees"><EmployeesPage /></ProtectedRoute>} />
          <Route path="departments" element={<ProtectedRoute requiredPermission="view_departments"><DepartmentsPage /></ProtectedRoute>} />
          <Route path="attendance" element={<ProtectedRoute requiredPermission="view_attendance"><AttendancePage /></ProtectedRoute>} />
          <Route path="leave" element={<ProtectedRoute requiredPermission="view_leave"><LeavePage /></ProtectedRoute>} />
          <Route path="payroll" element={<ProtectedRoute requiredPermission="view_payslip"><PayrollPage /></ProtectedRoute>} />
          <Route path="payslip" element={<ProtectedRoute requiredPermission="view_payslip"><PayrollPage /></ProtectedRoute>} />
          <Route path="support-tickets" element={<ProtectedRoute requiredAny={['raise_support_ticket', 'view_support_tickets', 'manage_support_tickets']}><SupportTicketsPage /></ProtectedRoute>} />
          <Route path="reports" element={<ProtectedRoute requiredPermission="view_reports"><ReportsPage forcedScope="all" /></ProtectedRoute>} />
          <Route path="self-reports" element={<ProtectedRoute requiredPermission="self_reports"><ReportsPage forcedScope="self" /></ProtectedRoute>} />
          <Route path="notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
          <Route path="settings/system" element={<ProtectedRoute requiredPermission="manage_settings"><SystemSettings /></ProtectedRoute>} />
          <Route path="permissions" element={<ProtectedRoute requiredPermission="manage_permissions"><PermissionManager /></ProtectedRoute>} />
          <Route path="tasks" element={<ProtectedRoute requiredAny={tasksGuard}><TaskShell /></ProtectedRoute>} />
          <Route path="leads/*" element={<ProtectedRoute requiredAny={leadsGuard}><LeadShell /></ProtectedRoute>} />
          <Route path="revenue" element={<ProtectedRoute requiredAny={revenueGuard}><RevenuePage /></ProtectedRoute>} />

          <Route path="affiliate" element={withAffiliateAccess(<AffiliateDashboard />)} />
          <Route path="affiliate/referrals" element={withAffiliateAccess(<AffiliateReferrals />)} />
          <Route path="affiliate/referrals/:id" element={withAffiliateAccess(<AffiliateReferralDet />)} />
          <Route path="affiliate/referral-links" element={withAffiliateAccess(<AffiliateRefLinks />)} />
          <Route path="affiliate/earnings" element={withAffiliateAccess(<AffiliateEarnings />)} />
          <Route path="affiliate/commissions" element={withAffiliateAccess(<AffiliateCommissions />)} />
          <Route path="affiliate/payments" element={withAffiliateAccess(<AffiliatePayments />)} />
          <Route path="affiliate/payments/:id" element={withAffiliateAccess(<AffiliatePaymentDet />)} />
          <Route path="affiliate/payments/invoice/:id" element={withAffiliateAccess(<AffiliateInvoice />)} />
          <Route path="affiliate/profile" element={withAffiliateAccess(<AffiliateProfile />)} />
          <Route path="affiliate/notifications" element={withAffiliateAccess(<AffiliateNotifs />)} />
          <Route path="affiliate/settings" element={withAffiliateAccess(<AffiliateSettings />)} />
          <Route path="affiliate/preferences" element={withAffiliateAccess(<AffiliatePreferences />)} />
        </Route>
      </Routes>
    </>
  )
}
