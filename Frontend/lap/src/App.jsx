// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// ── LAP imports (unchanged) ───────────────────────────────────────────────
import Login              from './pages/Login'
import Unauthorized       from './pages/Unauthorized'
import Shell              from './components/layout/Shell'
import Dashboard          from './pages/Dashboard'
import ComingSoon         from './pages/ComingSoon'
import PermissionManager  from './pages/admin/PermissionManager'
import EmployeesPage      from './pages/employees/EmployeesPage'
import DepartmentsPage    from './pages/departments/DepartmentsPage'
import AttendancePage     from './pages/attendance/AttendancePage'
import LeavePage          from './pages/leave/LeavePage'
import PayrollPage        from './pages/payroll/PayrollPage'
import ReportsPage        from './pages/reports/ReportsMain'
import NotificationsPage  from './pages/notifications/NotificationsMain'
import SupportTicketsPage from './pages/support/SupportTicketsPage'
import ProfileSettings    from './pages/settings/ProfileSettings'
import SystemSettings     from './pages/settings/SystemSettings'
import ProtectedRoute     from './components/ProtectedRoute'

// ── Affiliate imports (new) ───────────────────────────────────────────────
import AffiliateShell       from './affiliate/layouts/AffiliateShell'
import AffiliateDashboard   from './affiliate/pages/dashboard/DashboardHome'
import AffiliateReferrals   from './affiliate/pages/referrals/ReferralsList'
import AffiliateReferralDet from './affiliate/pages/referrals/ReferralDetails'
import AffiliateRefLinks    from './affiliate/pages/referral-links/ReferralLinkPage'
import AffiliateEarnings    from './affiliate/pages/earnings/EarningsOverview'
import AffiliateCommissions from './affiliate/pages/earnings/CommissionHistory'
import AffiliatePayments    from './affiliate/pages/payments/PaymentHistory'
import AffiliatePaymentDet  from './affiliate/pages/payments/TransactionDetails'
import AffiliateInvoice     from './affiliate/pages/payments/InvoicePage'
import AffiliateProfile     from './affiliate/pages/profile/ProfilePage'
import AffiliateNotifs      from './affiliate/pages/notifications/NotificationsPage'
import AffiliateSettings    from './affiliate/pages/settings/AppearanceSettings'
import AffiliatePreferences from './affiliate/pages/settings/Preferences'
import AffiliateRegister    from './affiliate/pages/auth/Register'
import CustomerRegister     from './affiliate/pages/auth/CustomerRegister'
import AffiliateAuthShell   from './affiliate/layouts/AffiliateAuthShell'
import { AffiliateAuthProvider } from './affiliate/context/AffiliateAuthContext'
import { ThemeProvider } from './affiliate/context/ThemeContext'
import { NotificationProvider } from './affiliate/context/NotificationContext'
// ── Task Module import ────────────────────────────────────────────────────
import TaskShell from './tasks/TaskShell'
const AffiliateProviders = ({ children }) => (
  <ThemeProvider>
    <NotificationProvider>
      <AffiliateAuthProvider>{children}</AffiliateAuthProvider>
    </NotificationProvider>
  </ThemeProvider>
)

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/"             element={<Navigate to="/login" replace />} />
        <Route path="/login"        element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Public: customer referral register page */}
        <Route path="/register"     element={<AffiliateProviders><CustomerRegister /></AffiliateProviders>} />
        {/* ── Task Module ──────────────────────────────────────────── */}
          <Route path="tasks" element={
            <ProtectedRoute>
              <TaskShell />
            </ProtectedRoute>
          } />
        {/* Public: new affiliate self-register */}
        <Route path="/affiliate/register" element={<AffiliateProviders><AffiliateAuthShell><AffiliateRegister /></AffiliateAuthShell></AffiliateProviders>} />

        {/* ── LAP Dashboard (unchanged) ───────────────────────────────── */}
        <Route path="/dashboard" element={<ProtectedRoute><Shell /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="employees"      element={<ProtectedRoute requiredPermission="view_employees"><EmployeesPage /></ProtectedRoute>} />
          <Route path="departments"    element={<ProtectedRoute requiredPermission="view_departments"><DepartmentsPage /></ProtectedRoute>} />
          <Route path="attendance"     element={<ProtectedRoute requiredPermission="view_attendance"><AttendancePage /></ProtectedRoute>} />
          <Route path="leave"          element={<ProtectedRoute requiredPermission="view_leave"><LeavePage /></ProtectedRoute>} />
          <Route path="payroll"        element={<ProtectedRoute requiredPermission="view_payslip"><PayrollPage /></ProtectedRoute>} />
          <Route path="payslip"        element={<ProtectedRoute requiredPermission="view_payslip"><PayrollPage /></ProtectedRoute>} />
          <Route path="support-tickets" element={<ProtectedRoute requiredAny={['raise_support_ticket','view_support_tickets','manage_support_tickets']}><SupportTicketsPage /></ProtectedRoute>} />
          <Route path="reports"        element={<ProtectedRoute requiredPermission="view_reports"><ReportsPage forcedScope="all" /></ProtectedRoute>} />
          <Route path="self-reports"   element={<ProtectedRoute requiredPermission="self_reports"><ReportsPage forcedScope="self" /></ProtectedRoute>} />
          <Route path="notifications"  element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="settings"       element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
          <Route path="settings/system" element={<ProtectedRoute><SystemSettings /></ProtectedRoute>} />
          <Route path="permissions"    element={<ProtectedRoute requiredPermission="manage_permissions"><PermissionManager /></ProtectedRoute>} />
          <Route path="tasks"          element={<ProtectedRoute><TaskShell /></ProtectedRoute>} />

          {/* ── Affiliate Dashboard (new, nested inside LAP shell) ──── */}
          <Route path="affiliate" element={
            <ProtectedRoute>
              <AffiliateShell>
                <AffiliateDashboard />
              </AffiliateShell>
            </ProtectedRoute>
          } />
          <Route path="affiliate/referrals" element={
            <ProtectedRoute>
              <AffiliateShell><AffiliateReferrals /></AffiliateShell>
            </ProtectedRoute>
          } />
          <Route path="affiliate/referrals/:id" element={
            <ProtectedRoute>
              <AffiliateShell><AffiliateReferralDet /></AffiliateShell>
            </ProtectedRoute>
          } />
          <Route path="affiliate/referral-links" element={
            <ProtectedRoute>
              <AffiliateShell><AffiliateRefLinks /></AffiliateShell>
            </ProtectedRoute>
          } />
          <Route path="affiliate/earnings" element={
            <ProtectedRoute>
              <AffiliateShell><AffiliateEarnings /></AffiliateShell>
            </ProtectedRoute>
          } />
          <Route path="affiliate/commissions" element={
            <ProtectedRoute>
              <AffiliateShell><AffiliateCommissions /></AffiliateShell>
            </ProtectedRoute>
          } />
          <Route path="affiliate/payments" element={
            <ProtectedRoute>
              <AffiliateShell><AffiliatePayments /></AffiliateShell>
            </ProtectedRoute>
          } />
          <Route path="affiliate/payments/:id" element={
            <ProtectedRoute>
              <AffiliateShell><AffiliatePaymentDet /></AffiliateShell>
            </ProtectedRoute>
          } />
          <Route path="affiliate/payments/invoice/:id" element={
            <ProtectedRoute>
              <AffiliateShell><AffiliateInvoice /></AffiliateShell>
            </ProtectedRoute>
          } />
          <Route path="affiliate/profile" element={
            <ProtectedRoute>
              <AffiliateShell><AffiliateProfile /></AffiliateShell>
            </ProtectedRoute>
          } />
          <Route path="affiliate/notifications" element={
            <ProtectedRoute>
              <AffiliateShell><AffiliateNotifs /></AffiliateShell>
            </ProtectedRoute>
          } />
          <Route path="affiliate/settings" element={
            <ProtectedRoute>
              <AffiliateShell><AffiliateSettings /></AffiliateShell>
            </ProtectedRoute>
          } />
          <Route path="affiliate/preferences" element={
            <ProtectedRoute>
              <AffiliateShell><AffiliatePreferences /></AffiliateShell>
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </>
  )
}
