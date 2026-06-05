// src/leads/context/LeadAppContext.jsx
//
// Replaces the lead module's AppContext.jsx AND AuthContext.jsx combined.
// Key difference: uses LAP's Redux auth store for the current user
// instead of a separate edulead_token / FastAPI auth flow.

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import * as leadsApi from '../services/leadsApi';

const LeadAppContext = createContext(null);

export const useLeadApp = () => {
  const ctx = useContext(LeadAppContext);
  if (!ctx) throw new Error('useLeadApp must be used within LeadAppProvider');
  return ctx;
};

export const LeadAppProvider = ({ children }) => {
  // ── Pull user from LAP's Redux auth slice ──────────────────────────────
  // Adjust the selector path if your Redux slice key differs.
  // Common patterns: state.auth.user  |  state.auth.employee  |  state.user.data
  const lapUser = useSelector((state) => state.auth?.user || state.auth?.employee || null);
  const permissions = useSelector((state) => state.auth?.permissions || []);
  const hasAny = (...codes) => codes.some((code) => permissions.includes(code));

  // ── Normalise user shape to what lead module pages expect ──────────────
  const user = lapUser
    ? {
        id: lapUser.id,
        full_name: lapUser.full_name || lapUser.first_name
          ? `${lapUser.first_name || ''} ${lapUser.last_name || ''}`.trim()
          : lapUser.username || lapUser.email?.split('@')[0] || 'User',
        email: lapUser.email || '',
        role: hasAny('assign_lead', 'view_lead_analytics', 'manage_lead_forms') ? 'admin' : 'counselor',
      }
    : null;

  // ── State ──────────────────────────────────────────────────────────────
  const [leads, setLeads] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [forms, setForms] = useState([]);
  const [formFields, setFormFields] = useState([]);
  const [counselors, setCounselors] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // ── Initial Data Fetch ─────────────────────────────────────────────────
  useEffect(() => {
    if (!lapUser) {
      setLoading(false);
      return;
    }

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [leadsRes, formsRes, usersRes, followupsRes] = await Promise.all([
          leadsApi.fetchLeads(),
          leadsApi.fetchForms(),
          leadsApi.fetchCounselors(),
          leadsApi.fetchFollowUps(),
        ]);

        setLeads(leadsRes.data || []);
        setCounselors(usersRes.data || []);
        setFollowups(followupsRes.data || []);

        const fetchedForms = (formsRes.data || []).map((form) => ({
          ...form,
          fields: (form.fields || []).map((field) => ({
            ...field,
            // Normalise field_type → type (lead module pages use both)
            type: field.field_type || field.type,
          })),
        }));
        setForms(fetchedForms);
        if (fetchedForms.length > 0) {
          setFormFields(fetchedForms[0].fields);
        }
      } catch (error) {
        console.error('[LeadModule] Initial fetch failed:', error);
        showToast('Failed to load lead data. Check your connection.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [lapUser?.id]); // Re-fetch if user changes (e.g., tenant switch)

  // ── Helper ─────────────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Lead CRUD ──────────────────────────────────────────────────────────

  const refreshLeads = async () => {
    try {
      const res = await leadsApi.fetchLeads();
      setLeads(res.data || []);
    } catch (e) {
      console.error('[LeadModule] refreshLeads failed:', e);
    }
  };

  const addLead = async (data) => {
    try {
      const res = await leadsApi.createLead(data);
      setLeads((prev) => [res.data, ...prev]);
      showToast('Lead created successfully', 'success');
      return res.data;
    } catch (e) {
      showToast(e?.response?.data?.detail || 'Failed to create lead', 'error');
      throw e;
    }
  };

  const updateLead = async (id, data) => {
    try {
      const res = await leadsApi.updateLead(id, data);
      setLeads((prev) => prev.map((l) => (l.id === id ? res.data : l)));
      showToast('Lead updated', 'success');
      return res.data;
    } catch (e) {
      showToast(e?.response?.data?.detail || 'Failed to update lead', 'error');
      throw e;
    }
  };

  const deleteLead = async (id) => {
    try {
      await leadsApi.deleteLead(id);
      setLeads((prev) => prev.filter((l) => l.id !== id));
      showToast('Lead deleted', 'success');
    } catch (e) {
      showToast('Failed to delete lead', 'error');
      throw e;
    }
  };

  // ── Follow-up CRUD ─────────────────────────────────────────────────────

  const addFollowUp = async (data) => {
    try {
      const res = await leadsApi.createFollowUp(data);
      setFollowups((prev) => [...prev, res.data]);
      showToast('Follow-up added', 'success');
      return res.data;
    } catch (e) {
      showToast('Failed to add follow-up', 'error');
      throw e;
    }
  };

  const updateFollowUp = async (id, data) => {
    try {
      const res = await leadsApi.updateFollowUp(id, data);
      setFollowups((prev) => prev.map((f) => (f.id === id ? res.data : f)));
      return res.data;
    } catch (e) {
      showToast('Failed to update follow-up', 'error');
      throw e;
    }
  };

  const deleteFollowUp = async (id) => {
    try {
      await leadsApi.deleteFollowUp(id);
      setFollowups((prev) => prev.filter((f) => f.id !== id));
      showToast('Follow-up deleted', 'success');
    } catch (e) {
      showToast('Failed to delete follow-up', 'error');
      throw e;
    }
  };

  // ── Form Builder ───────────────────────────────────────────────────────

  const syncFormFields = async (formId, fields) => {
    try {
      const res = await leadsApi.syncFormFields(formId, fields);
      const updatedForm = res.data;
      setForms((prev) =>
        prev.map((f) =>
          f.id === formId
            ? {
                ...updatedForm,
                fields: (updatedForm.fields || []).map((field) => ({
                  ...field,
                  type: field.field_type || field.type,
                })),
              }
            : f
        )
      );
      showToast('Form saved successfully', 'success');
      return updatedForm;
    } catch (e) {
      showToast('Failed to save form fields', 'error');
      throw e;
    }
  };

  // ── Notifications ──────────────────────────────────────────────────────

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // ── Theme (no-op — LAP owns theme) ────────────────────────────────────
  const toggleTheme = () => {};

  // ── Context Value ──────────────────────────────────────────────────────
  return (
    <LeadAppContext.Provider
      value={{
        // Auth (normalised from LAP Redux)
        user,

        // Data
        leads,
        followups,
        forms,
        formFields,
        counselors,
        notifications,
        loading,
        toast,

        // Lead actions
        addLead,
        updateLead,
        deleteLead,
        refreshLeads,

        // Follow-up actions
        addFollowUp,
        updateFollowUp,
        deleteFollowUp,

        // Form builder
        syncFormFields,

        // Notifications
        markAllNotificationsRead,

        // UI helpers
        showToast,
        theme: 'light',
        toggleTheme,
      }}
    >
      {children}
    </LeadAppContext.Provider>
  );
};

export default LeadAppProvider;
