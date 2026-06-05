// src/leads/services/leadsApi.js
//
// API bridge for the Lead Module inside LAP.
// Uses LAP's existing authenticated axios instance (src/api/axios.js)
// which already attaches the JWT token from Redux on every request.
// The Django backend is at /api/leads/* (no /v1/ prefix like FastAPI).

import apiClient from '../../api/axios';

// ── Lead Forms ─────────────────────────────────────────────────────────────

/** Get all lead forms (with their fields). */
export const fetchForms = () =>
  apiClient.get('/leads/forms/');

/** Create a new lead form. data: { name, description, is_active } */
export const createForm = (data) =>
  apiClient.post('/leads/forms/', data);

/**
 * Sync all fields for a form (replaces existing fields).
 * fields: array of field objects from FormBuilderPage.
 */
export const syncFormFields = (formId, fields) =>
  formId
    ? apiClient.put(`/leads/forms/${formId}/fields/`, { fields })
    : Promise.reject(new Error('A valid form is required before saving fields'));

export const fetchLeadOptions = () =>
  apiClient.get('/leads/options/');

export const saveLeadOptions = (data) =>
  apiClient.put('/leads/options/', data);

// ── Leads ──────────────────────────────────────────────────────────────────

/** Get all leads (admin: all, counselor: only assigned). */
export const fetchLeads = () =>
  apiClient.get('/leads/');

/** Get a single lead with field_values and followups. */
export const fetchLead = (id) =>
  apiClient.get(`/leads/${id}/`);

/**
 * Create a lead.
 * data: { full_name, email, phone, status, form_id, field_values: [{field_id, value}] }
 */
export const createLead = (data) =>
  apiClient.post('/leads/', data);

/** Update a lead. */
export const updateLead = (id, data) =>
  apiClient.put(`/leads/${id}/`, data);

/** Delete a lead. */
export const deleteLead = (id) =>
  apiClient.delete(`/leads/${id}/`);

/** Assign a counselor to a lead. */
export const assignCounselor = (leadId, counselorId) =>
  apiClient.post(`/leads/${leadId}/assign/${counselorId}/`);

// ── Follow-Ups ────────────────────────────────────────────────────────────

/** Get all follow-ups (filtered by counselor on backend if needed). */
export const fetchFollowUps = () =>
  apiClient.get('/leads/followups/');

/**
 * Create a follow-up.
 * data: { lead_id, note, scheduled_at, completed? }
 */
export const createFollowUp = (data) =>
  apiClient.post('/leads/followups/', data);

/** Partially update a follow-up (e.g., mark completed). */
export const updateFollowUp = (id, data) =>
  apiClient.patch(`/leads/followups/${id}/`, data);

/** Delete a follow-up. */
export const deleteFollowUp = (id) =>
  apiClient.delete(`/leads/followups/${id}/`);

// ── Analytics ─────────────────────────────────────────────────────────────

/**
 * Get dashboard analytics.
 * Returns: { total_leads, by_status, conversion_rate, recent_leads, ... }
 */
export const fetchAnalytics = () =>
  apiClient.get('/leads/analytics/dashboard/');

export const fetchRevenueOverview = () =>
  apiClient.get('/revenue/overview/');

// ── Users (counselors dropdown) ───────────────────────────────────────────

/** Get users list for counselor assignment dropdown. */
export const fetchCounselors = () =>
  apiClient.get('/leads/users/');
