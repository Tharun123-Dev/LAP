import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'

const ProtectedRoute = ({ children, requiredPermission, requiredAny }) => {
  const { access, permissions = [] } = useSelector((s) => s.auth)

  if (!access) return <Navigate to="/login" replace />

  if (requiredPermission) {
    const allowed = permissions.includes(requiredPermission)
    if (!allowed) return <Navigate to="/unauthorized" replace />
  }

  if (requiredAny?.length) {
    const allowed = requiredAny.some((code) => permissions.includes(code))
    if (!allowed) return <Navigate to="/unauthorized" replace />
  }

  return children
}

export default ProtectedRoute
