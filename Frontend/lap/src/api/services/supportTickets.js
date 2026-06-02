import api from '../axios'

const supportTicketsService = {
  getTypes: () =>
    api.get('/support/ticket-types/'),
  createType: (data) =>
    api.post('/support/ticket-types/', data),
  updateType: (id, data) =>
    api.patch(`/support/ticket-types/${id}/`, data),
  deleteType: (id) =>
    api.delete(`/support/ticket-types/${id}/`),

  raise: (data) =>
    api.post('/support/tickets/raise/', data),
  myTickets: () =>
    api.get('/support/tickets/my/'),
  allTickets: (params = {}) =>
    api.get('/support/tickets/all/', { params }),
  summary: () =>
    api.get('/support/tickets/summary/'),
  action: (id, data) =>
    api.post(`/support/tickets/${id}/action/`, data),
  requesterAction: (id, data) =>
    api.post(`/support/tickets/${id}/requester-action/`, data),
}

export default supportTicketsService
