import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useApp } from '../context/AppContext';
import { exportToCSV, mapLeadToCSVRow } from '../utils/exportCSV';
import StatusBadge from '../components/Common/StatusBadge';
import Modal from '../components/Common/Modal';
import { 
  Search, 
  Download, 
  Trash2, 
  Edit3, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Plus, 
  X,
  FileSpreadsheet,
  Users
} from 'lucide-react';

export default function LeadListPage() {
  const { leads: rawLeads, deleteLead, forms, leadOptions } = useApp();
  const { permissions = [] } = useSelector((state) => state.auth || {});
  const hasAny = (...codes) => codes.some((code) => permissions.includes(code));
  const isAdmin = hasAny('assign_lead', 'view_lead_analytics');
  const canCreate = hasAny('create_lead');
  const canEdit = hasAny('edit_lead');
  const canDelete = hasAny('delete_lead');

  // Backend already returns the correct permission-scoped leads:
  // admins/managers with assign/analytics see all, counselors see only assigned.
  const leads = rawLeads;

  const isEditable = (lead) => {
    const leadForm = (forms || []).find(f => f.id === lead.form_id);
    return leadForm?.name === "Active Intake Form";
  };
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Filter States
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [counselorFilter, setCounselorFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  
  // Loading Simulation
  const [isLoading, setIsLoading] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);

  // Listen to URL search param changes
  useEffect(() => {
    const urlQuery = searchParams.get('search');
    if (urlQuery !== null) {
      setSearch(urlQuery);
    }
  }, [searchParams]);

  // Simulate query loading whenever filters change
  const triggerLoading = () => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  };

  useEffect(() => {
    triggerLoading();
    setCurrentPage(1);
  }, [statusFilter, courseFilter, counselorFilter, sourceFilter]);

  // Collect unique values for filter dropdowns
  const uniqueCourses = [...new Set(leads.flatMap(l => (l.field_values || []).filter(fv => fv.field?.label === "Course of Interest").map(fv => fv.value)))];
  const uniqueCounselors = [...new Set(leads.map(l => l.counselor?.full_name).filter(Boolean))];
  const uniqueSources = [...new Set(leads.flatMap(l => (l.field_values || []).filter(fv => fv.field?.label === "Source").map(fv => fv.value)))];
  const statusOptions = (leadOptions?.statuses || []).map((item) => item.value || item.label).filter(Boolean);
  const configuredStatuses = statusOptions.length ? statusOptions : [...new Set(leads.map((lead) => lead.status).filter(Boolean))];
  const statusCounts = leads.reduce((acc, lead) => {
    const status = lead.status || 'Unspecified';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  const unknownStatusCount = leads.filter((lead) => lead.status && !configuredStatuses.includes(lead.status)).length;
  const statCards = [
    {
      label: 'All Leads',
      value: leads.length,
      filter: '',
      tone: !statusFilter
        ? 'bg-slate-900 text-white border-slate-900'
        : 'bg-white text-slate-800 border-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800',
      subText: isAdmin ? 'Complete directory' : 'Assigned to you',
    },
    ...configuredStatuses.map((status) => ({
      label: status,
      value: statusCounts[status] || 0,
      filter: status,
      tone: statusFilter === status
        ? 'bg-indigo-600 text-white border-indigo-600'
        : 'bg-white text-slate-800 border-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800',
      subText: 'Current status',
    })),
    ...(unknownStatusCount > 0 ? [{
      label: 'Other Statuses',
      value: unknownStatusCount,
      filter: null,
      tone: 'bg-white text-slate-800 border-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800',
      subText: 'Not in settings',
    }] : []),
  ];

  // Helper to get dynamic field value
  const getFieldValue = (lead, label) => {
    const fv = (lead.field_values || []).find(v => v.field?.label === label);
    return fv ? fv.value : 'N/A';
  };

  // Filtering Logic
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      (lead.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (lead.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (lead.phone || '').includes(search);
      
    const matchesStatus = !statusFilter || lead.status === statusFilter;
    const matchesCourse = !courseFilter || getFieldValue(lead, "Course of Interest") === courseFilter;
    const matchesCounselor = !counselorFilter || lead.counselor?.full_name === counselorFilter;
    const matchesSource = !sourceFilter || getFieldValue(lead, "Source") === sourceFilter;

    return matchesSearch && matchesStatus && matchesCourse && matchesCounselor && matchesSource;
  });

  // Pagination Calculations
  const totalItems = filteredLeads.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLeads = filteredLeads.slice(indexOfFirstItem, indexOfLastItem);

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setCourseFilter('');
    setCounselorFilter('');
    setSourceFilter('');
    setSearchParams({});
    triggerLoading();
  };

  const handleOpenDeleteModal = (lead, e) => {
    e.preventDefault();
    e.stopPropagation();
    setLeadToDelete(lead);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (leadToDelete) {
      deleteLead(leadToDelete.id);
      setDeleteModalOpen(false);
      setLeadToDelete(null);
    }
  };

  const handleExport = () => {
    const rows = filteredLeads.map(mapLeadToCSVRow);
    exportToCSV(rows, `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Leads Directory</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Manage, filter, and schedule discussions for all registered student queries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={!filteredLeads.length}
            className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 border border-slate-200/60 dark:border-slate-800 rounded-xl flex items-center justify-center gap-2 transition-all duration-150 shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> <span className="hidden xs:inline">Export CSV</span><span className="xs:hidden">Export</span>
          </button>
          {canCreate && (
            <Link
              to="/dashboard/leads/add"
              className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-500/10 hover-scale"
            >
              <Plus className="w-4 h-4" /> <span className="hidden xs:inline">Add Lead</span><span className="xs:hidden">Add</span>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {statCards.map((card) => {
          const active = card.filter === statusFilter || (card.filter === '' && !statusFilter);
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => {
                if (card.filter === null) return;
                setStatusFilter(card.filter);
              }}
              className={`min-h-[104px] rounded-2xl border p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${card.tone} ${card.filter === null ? 'cursor-default' : ''}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${
                  active ? 'bg-white/15 text-current' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-300'
                }`}>
                  <Users className="h-4 w-4" />
                </span>
                {card.filter !== null && (
                  <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide ${
                    active ? 'bg-white/15 text-current' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                  }`}>
                    {active ? 'Active' : 'View'}
                  </span>
                )}
              </div>
              <div className="mt-4">
                <p className="text-2xl font-black leading-none">{card.value}</p>
                <p className="mt-2 truncate text-xs font-black">{card.label}</p>
                <p className={`mt-1 truncate text-[10px] font-semibold ${
                  active ? 'text-current opacity-75' : 'text-slate-400'
                }`}>
                  {card.subText}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters Card */}
      <div className="glass-panel p-5 rounded-3xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Text Search */}
          <div className={`relative sm:col-span-2 ${isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl bg-white/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 dark:text-slate-200 placeholder-slate-400"
            />
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            {search && (
              <button 
                onClick={() => setSearch('')} 
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2.5 text-xs rounded-xl bg-white/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:text-slate-300"
          >
            <option value="">All Statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          {/* Course Filter */}
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="w-full px-3 py-2.5 text-xs rounded-xl bg-white/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:text-slate-300"
          >
            <option value="">All Courses</option>
            {uniqueCourses.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>

          {/* Counselor Filter (Admin Only) */}
          {isAdmin && (
            <select
              value={counselorFilter}
              onChange={(e) => setCounselorFilter(e.target.value)}
              className="w-full px-3 py-2.5 text-xs rounded-xl bg-white/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:text-slate-300 sm:col-span-2 lg:col-span-1"
            >
              <option value="">All Counselors</option>
              {uniqueCounselors.map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
            </select>
          )}
        </div>

        {/* Bottom Panel filter actions */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Found {totalItems} Leads
          </div>
          {(search || statusFilter || courseFilter || counselorFilter || sourceFilter) && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 hover:underline"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Table/Cards Grid */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(itemsPerPage)].map((_, i) => (
            <div key={i} className="h-16 w-full bg-slate-200/50 dark:bg-slate-800/20 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-3xl">
          <FileSpreadsheet className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">No Leads Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your keyword searches or active filters, or add a fresh student inquiry lead above.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-4 px-4 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/5 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block glass-panel rounded-3xl overflow-hidden border border-slate-200/50 dark:border-slate-800/40">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/10">
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Student Name</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Course of Interest</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Assigned Counselor</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Source</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Date Created</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {currentLeads.map((lead) => (
                    <tr 
                      key={lead.id} 
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors duration-150 group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {lead.full_name}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            {lead.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {getFieldValue(lead, "Course of Interest")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                          {lead.counselor?.full_name || 'Unassigned'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[11px] text-slate-500 dark:text-slate-500">
                          {getFieldValue(lead, "Source")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[11px] text-slate-500 dark:text-slate-500">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <Link
                            to={`/dashboard/leads/${lead.id}`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                            title="View Student Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {canEdit && isEditable(lead) && (
                            <Link
                              to={`/dashboard/leads/edit/${lead.id}`}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                              title="Edit Lead Info"
                            >
                              <Edit3 className="w-4 h-4" />
                            </Link>
                          )}
                          {canDelete && (
                            <button
                              onClick={(e) => handleOpenDeleteModal(lead, e)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                              title="Remove Lead"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Grid Cards View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {currentLeads.map((lead) => (
              <div 
                key={lead.id} 
                className="glass-panel p-5 rounded-2xl space-y-3.5 relative border border-slate-200/60 dark:border-slate-800/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">{lead.full_name}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">{lead.email}</p>
                  </div>
                  <StatusBadge status={lead.status} />
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-[10px] py-1 border-t border-b border-slate-100 dark:border-slate-800/50">
                  <div>
                    <span className="text-slate-400 block uppercase font-bold tracking-wider">Course</span>
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">{getFieldValue(lead, "Course of Interest")}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase font-bold tracking-wider">Counselor</span>
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">{lead.counselor?.full_name || 'Unassigned'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-slate-400 font-medium">Created: {new Date(lead.created_at).toLocaleDateString()}</span>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/dashboard/leads/${lead.id}`}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    {canEdit && isEditable(lead) && (
                      <Link
                        to={`/dashboard/leads/edit/${lead.id}`}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-purple-600"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Link>
                    )}
                    {canDelete && (
                      <button
                        onClick={(e) => handleOpenDeleteModal(lead, e)}
                        className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/10 text-rose-600 hover:text-rose-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between pt-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Lead Deletion"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Are you sure you want to permanently delete the lead record for <strong>{leadToDelete?.name}</strong>? 
            This action will clear their profile data and delete their log timeline.
          </p>
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 dark:bg-slate-800 dark:hover:text-slate-300 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-md shadow-rose-500/10"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
