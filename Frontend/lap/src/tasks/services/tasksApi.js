import api from '../../api/axios'

export const fetchTasks = () => api.get('/tasks/')
export const createTask = (data) => api.post('/tasks/', data)
export const updateTaskApi = (id, data) => api.patch(`/tasks/${id}/`, data)
export const deleteTaskApi = (id) => api.delete(`/tasks/${id}/`)
export const archiveTaskApi = (id) => api.post(`/tasks/${id}/archive/`)
export const addTaskCommentApi = (id, content) => api.post(`/tasks/${id}/comment/`, { content })
export const fetchTaskMembers = () => api.get('/tasks/members/')
export const fetchTaskNotifications = () => api.get('/tasks/notifications/')
export const markTaskNotificationsRead = () => api.post('/tasks/mark_notifications_read/')
