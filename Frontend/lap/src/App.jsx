// src/App.jsx

import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Auth Pages
import Login from './pages/Login'
import Unauthorized from './pages/Unauthorized'

// Layout
import Shell from './components/layout/Shell'

// Main Pages
import Dashboard from './pages/Dashboard'
import ComingSoon from './pages/ComingSoon'

// Admin
import PermissionManager from './pages/admin/PermissionManager'

// Employee Management
import EmployeesPage from './pages/employees/EmployeesPage'
import DepartmentsPage from './pages/departments/DepartmentsPage'

// Attendance
import AttendancePage from './pages/attendance/AttendancePage'

// Leave
import LeavePage from './pages/leave/LeavePage'

// Payroll
import PayrollPage from './pages/payroll/PayrollPage'

// Reports
import ReportsPage from './pages/reports/ReportsPage'

// Notifications
import NotificationsPage from './pages/notifications/NotificationsPage.jsx'

// Settings
import ProfileSettings from './pages/settings/ProfileSettings'
import SystemSettings from './pages/settings/SystemSettings'

// Protected Route
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <>
      <Toaster position="top-right" />

      <Routes>
        {/* Default Route */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected Dashboard Layout */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Shell />
            </ProtectedRoute>
          }
        >
          {/* Dashboard Home */}
          <Route index element={<Dashboard />} />

          {/* Employees */}
          <Route
            path="employees"
            element={
              <ProtectedRoute requiredPermission="view_employees">
                <EmployeesPage />
              </ProtectedRoute>
            }
          />

          {/* Departments */}
          <Route
            path="departments"
            element={
              <ProtectedRoute requiredPermission="view_departments">
                <DepartmentsPage />
              </ProtectedRoute>
            }
          />

          {/* Attendance */}
          <Route
            path="attendance"
            element={
              <ProtectedRoute requiredPermission="view_attendance">
                <AttendancePage />
              </ProtectedRoute>
            }
          />

          {/* Leave */}
          <Route
            path="leave"
            element={
              <ProtectedRoute requiredPermission="view_leave">
                <LeavePage />
              </ProtectedRoute>
            }
          />

          {/* Payroll */}
          <Route
            path="payroll"
            element={
              <ProtectedRoute requiredPermission="view_payslip">
                <PayrollPage />
              </ProtectedRoute>
            }
          />

          {/* Payslip */}
          <Route
            path="payslip"
            element={
              <ProtectedRoute requiredPermission="view_payslip">
                <PayrollPage />
              </ProtectedRoute>
            }
          />

          {/* Reports */}
          <Route
            path="reports"
            element={
              <ProtectedRoute requiredPermission="view_reports">
                <ReportsPage />
              </ProtectedRoute>
            }
          />

          {/* Notifications */}
          <Route
            path="notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          {/* Profile Settings */}
          <Route
            path="settings"
            element={
              <ProtectedRoute>
                <ProfileSettings />
              </ProtectedRoute>
            }
          />

          {/* System Settings */}
          <Route
            path="settings/system"
            element={
              <ProtectedRoute>
                <SystemSettings />
              </ProtectedRoute>
            }
          />

          {/* Permissions */}
          <Route
            path="permissions"
            element={
              <ProtectedRoute requiredPermission="manage_permissions">
                <PermissionManager />
              </ProtectedRoute>
            }
          />

          {/* Future Pages */}
          <Route path="coming-soon" element={<ComingSoon />} />
        </Route>

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  )
}