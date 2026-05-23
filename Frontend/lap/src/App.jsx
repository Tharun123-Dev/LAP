// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import Login             from './pages/Login'
import Unauthorized      from './pages/Unauthorized'
import Shell             from './components/layout/Shell'
import Dashboard         from './pages/Dashboard'
import ComingSoon        from './pages/ComingSoon'
import PermissionManager from './pages/admin/PermissionManager'
import EmployeesPage     from './pages/employees/EmployeesPage'
import DepartmentsPage   from './pages/departments/DepartmentsPage'
import ProtectedRoute    from './components/ProtectedRoute'
import AttendancePage from './pages/attendance/AttendancePage'
import LeavePage from './pages/leave/LeavePage'
import PayrollPage from './pages/payroll/PayrollPage'

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/"              element={<Navigate to="/login" replace />} />
        <Route path="/login"         element={<Login />} />
        <Route path="/unauthorized"  element={<Unauthorized />} />

        <Route path="/dashboard" element={<ProtectedRoute><Shell /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />

          {/* Phase 4 — now real pages */}
          <Route path="employees"   element={<ProtectedRoute requiredPermission="view_employees"><EmployeesPage /></ProtectedRoute>} />
          <Route path="departments" element={<ProtectedRoute requiredPermission="view_departments"><DepartmentsPage /></ProtectedRoute>} />

          {/* Phase 2 */}
          <Route path="permissions" element={<ProtectedRoute requiredPermission="manage_permissions"><PermissionManager /></ProtectedRoute>} />

          {/* Still placeholders — coming in next phases */}
         <Route path="attendance" element={
  <ProtectedRoute requiredPermission="view_attendance">
    <AttendancePage />
  </ProtectedRoute>
} />
          <Route path="leave" element={
  <ProtectedRoute requiredPermission="view_leave">
    <LeavePage />
  </ProtectedRoute>
} />
// In Shell routes, replace payroll + payslip placeholders:
<Route path="payroll" element={
  <ProtectedRoute requiredPermission="view_payroll">
    <PayrollPage />
  </ProtectedRoute>
} />
<Route path="payslip" element={
  <ProtectedRoute requiredPermission="view_payslip">
    <PayrollPage />
  </ProtectedRoute>
} />
          <Route path="reports"     element={<ProtectedRoute requiredPermission="view_reports"><ComingSoon title="Reports" /></ProtectedRoute>} />
        </Route>
      </Routes>
    </>
  )
}