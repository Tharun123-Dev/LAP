// src/api/services/payroll.js
import api from '../axios'
import ENDPOINTS from '../endpoints'

export const getSalaryListApi    = (emp)      => api.get(ENDPOINTS.PAYROLL.SALARY_LIST, { params: { employee: emp } })
export const createSalaryApi     = (data)     => api.post(ENDPOINTS.PAYROLL.SALARY_CREATE, data)
export const updateSalaryApi     = (id, data) => api.patch(ENDPOINTS.PAYROLL.SALARY_UPDATE(id), data)
export const getMySalaryApi      = ()         => api.get(ENDPOINTS.PAYROLL.MY_SALARY)

export const getRunsApi          = ()         => api.get(ENDPOINTS.PAYROLL.RUNS)
export const createRunApi        = (data)     => api.post(ENDPOINTS.PAYROLL.RUN_CREATE, data)
export const getRunDetailApi     = (id)       => api.get(ENDPOINTS.PAYROLL.RUN_DETAIL(id))
export const processRunApi       = (id)       => api.post(ENDPOINTS.PAYROLL.RUN_PROCESS(id))
export const approveRunApi       = (id)       => api.post(ENDPOINTS.PAYROLL.RUN_APPROVE(id))
export const getRunRegisterApi   = (id)       => api.get(ENDPOINTS.PAYROLL.RUN_REGISTER(id))

export const updateEntryApi      = (id, data) => api.patch(ENDPOINTS.PAYROLL.ENTRY_UPDATE(id), data)
export const addAdjustmentApi    = (id, data) => api.post(ENDPOINTS.PAYROLL.ENTRY_ADJUST(id), data)

export const getMyPayslipsApi    = ()         => api.get(ENDPOINTS.PAYROLL.MY_PAYSLIPS)
export const getPayslipDetailApi = (m, y)     => api.get(ENDPOINTS.PAYROLL.PAYSLIP(m, y))