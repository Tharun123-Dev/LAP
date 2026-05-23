import api from '../axios'
import ENDPOINTS from '../endpoints'

export const getAllRolesPermissionsApi = () =>
  api.get(ENDPOINTS.PERMISSIONS.ALL_ROLES)

export const getRolePermissionsApi = (role) =>
  api.get(ENDPOINTS.PERMISSIONS.BY_ROLE(role))

export const updateRolePermissionsApi = (role, granted, revoked) =>
  api.post(ENDPOINTS.PERMISSIONS.UPDATE_ROLE(role), { granted, revoked })