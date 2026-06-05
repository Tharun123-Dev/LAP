// src/leads/context/AppContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import * as leadsApi from '../services/leadsApi';

const AppContext = createContext(null);

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const normalizeFields = (fields = []) =>
  fields.map((field, index) => ({
    ...field,
    id: field.id ?? `field_${index}`,
    type: field.field_type || field.type || 'text',
    options: Array.isArray(field.options) ? field.options : [],
  }));

const normalizeForms = (forms = []) =>
  forms.map((form) => ({
    ...form,
    fields: normalizeFields(form.fields || []),
  }));

const normalizeLeadPayload = (data = {}) => {
  const dynamicFields = data.dynamic_fields || data.field_values || [];
  return {
    ...data,
    field_values: dynamicFields,
  };
};

const DEFAULT_LEAD_OPTIONS = {
  statuses: [
    { label: 'New', value: 'New' },
    { label: 'Contacted', value: 'Contacted' },
    { label: 'Interested', value: 'Interested' },
    { label: 'Follow-Up Pending', value: 'Follow-Up Pending' },
    { label: 'Admission Confirmed', value: 'Admission Confirmed' },
    { label: 'Rejected', value: 'Rejected' },
  ],
  contact_methods: [
    { label: 'Phone Call', value: 'Call' },
    { label: 'WhatsApp', value: 'WhatsApp' },
    { label: 'Email', value: 'Email' },
    { label: 'Meeting Visit', value: 'Meeting' },
  ],
};

const normalizeLeadOptions = (payload = {}) => ({
  statuses: toArray(payload.statuses).length ? toArray(payload.statuses) : DEFAULT_LEAD_OPTIONS.statuses,
  contact_methods: toArray(payload.contact_methods).length ? toArray(payload.contact_methods) : DEFAULT_LEAD_OPTIONS.contact_methods,
});

const getUserName = (lapUser) => {
  if (!lapUser) return '';
  if (lapUser.full_name) return lapUser.full_name;
  const firstLast = `${lapUser.first_name || ''} ${lapUser.last_name || ''}`.trim();
  return firstLast || lapUser.username || lapUser.email?.split('@')[0] || 'User';
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within LeadAppProvider');
  return context;
};

export const useLeadApp = useApp;

export const LeadAppProvider = ({ children }) => {
  const auth = useSelector((state) => state.auth || {});
  const rawUser = auth.employee || auth.user || null;
  const lapUser = typeof rawUser === 'string'
    ? { id: auth.userId, full_name: rawUser, role: auth.role }
    : rawUser;
  const permissions = auth.permissions || [];
  const hasAny = (...codes) => codes.some((code) => permissions.includes(code));

  const user = useMemo(() => {
    if (!lapUser && !auth.role) return null;
    return {
      id: lapUser?.id,
      full_name: getUserName(lapUser) || auth.user || 'User',
      email: lapUser?.email || '',
      role: hasAny('assign_lead', 'view_lead_analytics', 'manage_lead_forms') ? 'admin' : 'counselor',
    };
  }, [auth.role, auth.user, lapUser, permissions]);

  const [leads, setLeads] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [forms, setForms] = useState([]);
  const [formFields, setFormFields] = useState([]);
  const [counselors, setCounselors] = useState([]);
  const [leadOptions, setLeadOptions] = useState(DEFAULT_LEAD_OPTIONS);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    window.setTimeout(() => setToast(null), 3500);
  };

  const refreshLeads = async () => {
    const res = await leadsApi.fetchLeads();
    setLeads(toArray(res.data));
  };

  const refreshAll = async () => {
    setLoading(true);
    try {
      const [leadsRes, formsRes, usersRes, followupsRes, optionsRes] = await Promise.allSettled([
        leadsApi.fetchLeads(),
        leadsApi.fetchForms(),
        leadsApi.fetchCounselors(),
        leadsApi.fetchFollowUps(),
        leadsApi.fetchLeadOptions(),
      ]);

      if (leadsRes.status === 'fulfilled') setLeads(toArray(leadsRes.value.data));
      if (formsRes.status === 'fulfilled') {
        const nextForms = normalizeForms(toArray(formsRes.value.data));
        setForms(nextForms);
        setFormFields(nextForms[0]?.fields || []);
      }
      if (usersRes.status === 'fulfilled') setCounselors(toArray(usersRes.value.data));
      if (followupsRes.status === 'fulfilled') setFollowups(toArray(followupsRes.value.data));
      if (optionsRes.status === 'fulfilled') setLeadOptions(normalizeLeadOptions(optionsRes.value.data));
    } catch (error) {
      console.error('[LeadModule] Failed to load data:', error);
      showToast('Failed to load lead data. Please check backend connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    refreshAll();
  }, [user?.id, user?.role]);

  const addLead = async (data) => {
    try {
      const res = await leadsApi.createLead(normalizeLeadPayload(data));
      setLeads((prev) => [res.data, ...prev]);
      showToast('Lead created successfully', 'success');
      return res.data;
    } catch (error) {
      showToast(error?.response?.data?.detail || 'Failed to create lead', 'error');
      throw error;
    }
  };

  const updateLead = async (idOrData, maybeData) => {
    const id = typeof idOrData === 'object' ? idOrData.id : idOrData;
    const data = typeof idOrData === 'object' ? { ...idOrData } : maybeData;
    delete data.id;

    try {
      const res = await leadsApi.updateLead(id, normalizeLeadPayload(data));
      setLeads((prev) => prev.map((lead) => (lead.id === id ? res.data : lead)));
      showToast('Lead updated successfully', 'success');
      return res.data;
    } catch (error) {
      showToast(error?.response?.data?.detail || 'Failed to update lead', 'error');
      throw error;
    }
  };

  const assignLead = async (leadId, counselorId) => {
    try {
      const res = await leadsApi.assignCounselor(leadId, counselorId);
      setLeads((prev) => prev.map((lead) => (lead.id === leadId ? res.data : lead)));
      showToast('Counselor assigned successfully', 'success');
      return res.data;
    } catch (error) {
      showToast(error?.response?.data?.detail || 'Failed to assign counselor', 'error');
      throw error;
    }
  };

  const deleteLead = async (id) => {
    try {
      await leadsApi.deleteLead(id);
      setLeads((prev) => prev.filter((lead) => lead.id !== id));
      showToast('Lead deleted', 'success');
    } catch (error) {
      showToast('Failed to delete lead', 'error');
      throw error;
    }
  };

  const addFollowUp = async (data) => {
    try {
      const res = await leadsApi.createFollowUp(data);
      setFollowups((prev) => [...prev, res.data]);
      showToast('Follow-up added', 'success');
      return res.data;
    } catch (error) {
      showToast('Failed to add follow-up', 'error');
      throw error;
    }
  };

  const addFollowup = (leadId, data = {}) =>
    addFollowUp({
      lead_id: leadId,
      note: data.note || '',
      scheduled_at: data.scheduled_at || (data.scheduledAt ? new Date(data.scheduledAt).toISOString() : null),
      completed: data.completed || false,
    });

  const updateFollowUp = async (id, data) => {
    const res = await leadsApi.updateFollowUp(id, data);
    setFollowups((prev) => prev.map((item) => (item.id === id ? res.data : item)));
    return res.data;
  };

  const deleteFollowUp = async (id) => {
    await leadsApi.deleteFollowUp(id);
    setFollowups((prev) => prev.filter((item) => item.id !== id));
    showToast('Follow-up deleted', 'success');
  };

  const syncFormFields = async (formId, fields) => {
    const normalized = normalizeFields(fields);
    const res = await leadsApi.syncFormFields(formId, normalized);
    const updatedForm = normalizeForms([res.data])[0];
    setForms((prev) => prev.map((form) => (form.id === formId ? updatedForm : form)));
    setFormFields(updatedForm?.fields || normalized);
    showToast('Form saved successfully', 'success');
    return updatedForm;
  };

  const saveFormTemplate = syncFormFields;

  const saveLeadOptions = async (options) => {
    try {
      const res = await leadsApi.saveLeadOptions(options);
      const nextOptions = normalizeLeadOptions(res.data);
      setLeadOptions(nextOptions);
      showToast('Lead dropdowns saved successfully', 'success');
      return nextOptions;
    } catch (error) {
      showToast(error?.response?.data?.detail || 'Failed to save lead dropdowns', 'error');
      throw error;
    }
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
  };

  return (
    <AppContext.Provider
      value={{
        user,
        leads,
        followups,
        forms,
        formFields,
        counselors,
        leadOptions,
        notifications,
        loading,
        toast,
        setToast,
        addLead,
        updateLead,
        assignLead,
        deleteLead,
        refreshLeads,
        refreshAll,
        addFollowUp,
        addFollowup,
        updateFollowUp,
        deleteFollowUp,
        syncFormFields,
        saveFormTemplate,
        saveLeadOptions,
        markAllNotificationsRead,
        showToast,
        theme: 'light',
        toggleTheme: () => {},
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default LeadAppProvider;
