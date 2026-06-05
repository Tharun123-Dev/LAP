import React from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { LeadAppProvider, useLeadApp } from './context/LeadAppContext';

import LeadListPage from './pages/LeadListPage';
import LeadDetailsPage from './pages/LeadDetailsPage';
import AddEditLeadPage from './pages/AddEditLeadPage';
import FormBuilderPage from './pages/FormBuilderPage';
import AnalyticsPage from './pages/AnalyticsPage';
import FollowUpsPage from './pages/FollowUpsPage';
import LeadOptionsPage from './pages/LeadOptionsPage';
import Toast from './components/Common/Toast';

function LeadModuleInner() {
  const { toast } = useLeadApp();
  const { permissions = [] } = useSelector((state) => state.auth || {});

  const hasAny = (...codes) => codes.some((code) => permissions.includes(code));

  const navItems = [
    hasAny('view_leads') && { path: '/dashboard/leads', label: 'All Leads', end: true },
    hasAny('create_lead') && { path: '/dashboard/leads/student-form', label: 'Student Form' },
    hasAny('create_lead') && { path: '/dashboard/leads/add', label: 'Add Lead' },
    hasAny('view_followups', 'create_followup') && { path: '/dashboard/leads/follow-ups', label: 'Follow Ups' },
    hasAny('view_lead_analytics') && { path: '/dashboard/leads/analytics', label: 'Analytics' },
    hasAny('manage_lead_forms') && { path: '/dashboard/leads/form-builder', label: 'Form Builder' },
    hasAny('manage_lead_forms') && { path: '/dashboard/leads/options', label: 'Statuses' },
  ].filter(Boolean);

  return (
    <div className="min-h-full">
      <div className="mb-6 flex flex-wrap items-center gap-1 border-b border-slate-200 pb-3 dark:border-slate-700">
        <span className="mr-2 text-xs font-bold uppercase tracking-wider text-slate-400">Leads</span>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `rounded-lg px-3 py-1.5 text-sm font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>

      <Routes>
        {hasAny('view_leads') && <Route index element={<LeadListPage />} />}
        {hasAny('create_lead') && <Route path="student-form" element={<AddEditLeadPage />} />}
        {hasAny('create_lead') && <Route path="add" element={<AddEditLeadPage />} />}
        {hasAny('view_leads') && <Route path=":id" element={<LeadDetailsPage />} />}
        {hasAny('edit_lead') && <Route path="edit/:id" element={<AddEditLeadPage />} />}
        {hasAny('view_followups', 'create_followup') && <Route path="follow-ups" element={<FollowUpsPage />} />}
        {hasAny('view_lead_analytics') && <Route path="analytics" element={<AnalyticsPage />} />}
        {hasAny('manage_lead_forms') && <Route path="form-builder" element={<FormBuilderPage />} />}
        {hasAny('manage_lead_forms') && <Route path="options" element={<LeadOptionsPage />} />}
        <Route path="*" element={<Navigate to={navItems[0]?.path || '/unauthorized'} replace />} />
      </Routes>

      {toast && <Toast toast={toast} />}
    </div>
  );
}

export default function LeadShell() {
  return (
    <LeadAppProvider>
      <LeadModuleInner />
    </LeadAppProvider>
  );
}
