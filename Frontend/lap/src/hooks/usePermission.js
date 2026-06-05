import { useSelector } from 'react-redux'

const usePermission = () => {
  const permissions = useSelector((s) => s.auth.permissions)
  const role        = useSelector((s) => s.auth.role)

  const can    = (code)   => permissions.includes(code)
  const canAny = (codes)  => codes.some(can)
  const canAll = (codes)  => codes.every(can)

  return { can, canAny, canAll, permissions, role }
}

export default usePermission
