import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'

const ProtectedRoute = ({ children, requiredPermission }) => {
  const { access, permissions, role } = useSelector((s) => s.auth)

  if (!access) return <Navigate to="/login" replace />

  if (requiredPermission) {
    const allowed = role === 'superadmin' || permissions.includes(requiredPermission)
    if (!allowed) return <Navigate to="/unauthorized" replace />
  }

  return children
}

export default ProtectedRoute