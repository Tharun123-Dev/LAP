import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'

const ProtectedRoute = ({ children, requiredPermission, requiredAny }) => {
  const { access, permissions = [], role } = useSelector((s) => s.auth)
  const roleKey = String(role || '').toLowerCase()

  if (!access) return <Navigate to="/login" replace />

  if (requiredPermission) {
    const allowed = roleKey === 'superadmin' || roleKey === 'admin' || permissions.includes(requiredPermission)
    if (!allowed) return <Navigate to="/unauthorized" replace />
  }

  if (requiredAny?.length) {
    const allowed = roleKey === 'superadmin' || roleKey === 'admin' || requiredAny.some((code) => permissions.includes(code))
    if (!allowed) return <Navigate to="/unauthorized" replace />
  }

  return children
}

export default ProtectedRoute
