import React, { useState, useMemo } from 'react';
import { useTasks } from '../context/TaskContext';
import { TAGS } from '../data/mockData';
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Plus,
  Trash2,
  Copy,
  Archive,
  Edit,
  ChevronLeft,
  ChevronRight,
  X,
  CheckSquare,
  AlertTriangle,
  FolderOpen,
  Calendar,
  CheckCircle,
  Clock,
  Play,
  RotateCcw
} from 'lucide-react';

export default function TaskList() {
  const {
    tasks,
    deleteTask,
    duplicateTask,
    archiveTask,
    updateStatus,
    navigateToDetails,
    setSelectedTaskId,
    setActivePage,
    currentUser,
    members,
  } = useTasks();

  // Local UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  // Filters State
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assigneeId: '',
    dueDate: '',
    tag: ''
  });

  // Selection & Bulk Action State
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Reset page when search or filters change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      assigneeId: '',
      dueDate: '',
      tag: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Filter Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (task.archived) return false;

      // Search term
      const matchesSearch = 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Status Filter
      const today = new Date().toISOString().split('T')[0];
      const isTaskOverdue = task.status !== 'completed' && task.status !== 'cancelled' && new Date(task.dueDate) < new Date(today);
      
      if (filters.status) {
        if (filters.status === 'overdue') {
          if (!isTaskOverdue) return false;
        } else {
          if (task.status !== filters.status || isTaskOverdue) return false;
        }
      }

      // Priority Filter
      if (filters.priority && task.priority !== filters.priority) return false;

      // Assignee Filter
      if (filters.assigneeId && task.assignedTo?.id !== filters.assigneeId) return false;

      // Due date filter shortcut
      if (filters.dueDate) {
        if (filters.dueDate === 'today' && task.dueDate !== today) return false;
        if (filters.dueDate === 'overdue' && !isTaskOverdue) return false;
        if (filters.dueDate === 'upcoming') {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowStr = tomorrow.toISOString().split('T')[0];
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          const taskDate = new Date(task.dueDate);
          if (taskDate < new Date(tomorrowStr) || taskDate > nextWeek) return false;
        }
      }

      // Tag Filter
      if (filters.tag && !task.tags?.includes(filters.tag)) return false;

      return true;
    });
  }, [tasks, searchTerm, filters]);

  // Pagination calculation
  const totalItems = filteredTasks.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTasks = useMemo(() => {
    return filteredTasks.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTasks, startIndex, itemsPerPage]);

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const ids = paginatedTasks.map(t => t.id);
      setSelectedIds(ids);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id, checked) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(rowId => rowId !== id));
    }
  };

  // Bulk Actions
  const handleBulkStatusChange = (status) => {
    selectedIds.forEach(id => {
      updateStatus(id, status);
    });
    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedIds.length} tasks?`)) {
      selectedIds.forEach(id => {
        deleteTask(id);
      });
      setSelectedIds([]);
    }
  };

  const handleBulkArchive = () => {
    selectedIds.forEach(id => {
      archiveTask(id);
    });
    setSelectedIds([]);
  };

  // Style mapping
  const statusStyleMap = {
    pending: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    inProgress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    onHold: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    overdue: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400'
  };

  const priorityStyleMap = {
    low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    urgent: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
  };

  const getTaskStatusLabel = (task) => {
    const today = new Date().toISOString().split('T')[0];
    const isTaskOverdue = task.status !== 'completed' && task.status !== 'cancelled' && new Date(task.dueDate) < new Date(today);
    
    if (isTaskOverdue) return { key: 'overdue', label: 'Overdue', style: statusStyleMap.overdue };
    
    const labelMap = {
      pending: 'Pending',
      inProgress: 'In Progress',
      completed: 'Completed',
      onHold: 'On Hold',
      cancelled: 'Cancelled'
    };

    return { 
      key: task.status, 
      label: labelMap[task.status] || 'Pending', 
      style: statusStyleMap[task.status] || statusStyleMap.pending 
    };
  };

  return (
    <div className="space-y-6 animate-fade-in relative min-h-[70vh]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Tasks Database</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Manage, filter, and track CRM and HR related operations</p>
        </div>
        <button
          onClick={() => {
            setSelectedTaskId(null); // Clear selected if any, so we open a fresh form
            setActivePage('create-task');
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/10 transition-all hover:scale-[1.02] cursor-pointer"
        >
          <Plus size={16} />
          Create Task
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search by Title, ID, or Description..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 outline-none text-slate-800 dark:text-slate-200 transition-colors shadow-soft"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/60 shadow-soft cursor-pointer transition-colors"
          >
            <SlidersHorizontal size={14} className="text-slate-400" />
            Filters
            {(filters.status || filters.priority || filters.assigneeId || filters.dueDate || filters.tag) && (
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            )}
          </button>

          {(filters.status || filters.priority || filters.assigneeId || filters.dueDate || filters.tag || searchTerm) && (
            <button
              onClick={clearFilters}
              className="px-4 py-3 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl cursor-pointer transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Ribbon */}
      {selectedIds.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60 rounded-xl shadow-soft animate-fade-in">
          <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
            {selectedIds.length} tasks selected
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <button 
                onClick={() => setActiveDropdownId(activeDropdownId === 'bulk-status' ? null : 'bulk-status')}
                className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Change Status
                <ChevronDown size={12} />
              </button>
              {activeDropdownId === 'bulk-status' && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg z-20 py-1 text-xs">
                  {['pending', 'inProgress', 'completed', 'onHold', 'cancelled'].map(status => (
                    <button
                      key={status}
                      onClick={() => {
                        handleBulkStatusChange(status);
                        setActiveDropdownId(null);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-750 dark:text-slate-250 capitalize font-medium cursor-pointer"
                    >
                      {status === 'inProgress' ? 'In Progress' : status === 'onHold' ? 'On Hold' : status}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleBulkArchive}
              className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <Archive size={12} className="text-slate-400" />
              Archive
            </button>

            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-[11px] font-semibold hover:bg-rose-700 transition-all cursor-pointer"
            >
              <Trash2 size={12} />
              Delete Selected
            </button>

            <button 
              onClick={() => setSelectedIds([])}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Main Table Grid */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-soft overflow-hidden">
        {totalItems === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 mb-4 border border-slate-100 dark:border-slate-800">
              <FolderOpen size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">No Tasks Found</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mt-1">
              We couldn't find any tasks matching your filters. Try clearing filters or searching for something else.
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-900 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-950/20">
                    <th className="py-4 pl-6 pr-2 w-10">
                      <input
                        type="checkbox"
                        checked={paginatedTasks.length > 0 && paginatedTasks.every(t => selectedIds.includes(t.id))}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                      />
                    </th>
                    <th className="py-4 px-3 min-w-[200px]">Task Title</th>
                    <th className="py-4 px-3 w-32">Status</th>
                    <th className="py-4 px-3 w-28">Priority</th>
                    <th className="py-4 px-3 w-36">Assignee</th>
                    <th className="py-4 px-3 w-28">Due Date</th>
                    <th className="py-4 px-3 min-w-[150px]">Tags</th>
                    <th className="py-4 px-3 w-28">Created</th>
                    <th className="py-4 pr-6 pl-2 w-12 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-xs">
                  {paginatedTasks.map((task) => {
                    const statusInfo = getTaskStatusLabel(task);
                    const isRowSelected = selectedIds.includes(task.id);
                    
                    return (
                      <tr
                        key={task.id}
                        className={`group hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors ${
                          isRowSelected ? 'bg-blue-50/20 dark:bg-blue-950/10' : ''
                        }`}
                      >
                        <td className="py-3.5 pl-6 pr-2">
                          <input
                            type="checkbox"
                            checked={isRowSelected}
                            onChange={(e) => handleSelectRow(task.id, e.target.checked)}
                            className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                          />
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex flex-col gap-0.5 max-w-xs sm:max-w-sm">
                            <span 
                              onClick={() => navigateToDetails(task.id)}
                              className="font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors line-clamp-1"
                            >
                              {task.title}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                              ID: <span className="font-mono">{task.id}</span> • {task.relatedModule}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${statusInfo.style}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            priorityStyleMap[task.priority] || priorityStyleMap.low
                          }`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2">
                            <img
                              src={task.assignedTo?.avatar}
                              alt={task.assignedTo?.name}
                              className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-800 object-cover"
                            />
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {task.assignedTo?.name.split(' ')[0]} {task.assignedTo?.name.split(' ')[1]?.substring(0, 1)}.
                              </span>
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">
                                {task.assignedTo?.role.substring(0, 12)}...
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 font-medium text-slate-600 dark:text-slate-400">
                          {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {task.tags?.slice(0, 2).map((tag, idx) => (
                              <span 
                                key={idx}
                                className="px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-[9px] font-bold border border-slate-100 dark:border-slate-800"
                              >
                                {tag}
                              </span>
                            ))}
                            {task.tags?.length > 2 && (
                              <span className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-[9px] font-bold">
                                +{task.tags.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-400 dark:text-slate-500 text-[11px] font-medium">
                          {new Date(task.createdDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </td>
                        <td className="py-3.5 pr-6 pl-2 text-center relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdownId(activeDropdownId === task.id ? null : task.id);
                            }}
                            className="p-1 rounded-lg hover:bg-slate-55 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {activeDropdownId === task.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setActiveDropdownId(null)}
                              />
                              <div className="absolute right-6 top-10 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-20 py-1 text-left">
                                <button
                                  onClick={() => {
                                    navigateToDetails(task.id);
                                    setActiveDropdownId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 cursor-pointer"
                                >
                                  View Details
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedTaskId(task.id);
                                    setActivePage('create-task');
                                    setActiveDropdownId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 cursor-pointer"
                                >
                                  <Edit size={14} className="text-slate-450" />
                                  Edit Task
                                </button>
                                <button
                                  onClick={() => {
                                    duplicateTask(task.id);
                                    setActiveDropdownId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 cursor-pointer"
                                >
                                  <Copy size={14} className="text-slate-455" />
                                  Duplicate Task
                                </button>
                                <button
                                  onClick={() => {
                                    archiveTask(task.id);
                                    setActiveDropdownId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 cursor-pointer"
                                >
                                  <Archive size={14} className="text-slate-450" />
                                  Archive Task
                                </button>
                                <div className="border-t border-slate-100 dark:border-slate-900 my-1" />
                                <button
                                  onClick={() => {
                                    if (confirm('Delete this task permanently?')) {
                                      deleteTask(task.id);
                                    }
                                    setActiveDropdownId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3.5 py-2.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-450 cursor-pointer"
                                >
                                  <Trash2 size={14} />
                                  Delete Task
                                </button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-t border-slate-100 dark:border-slate-900">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 text-center sm:text-left">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} entries
              </span>
              <div className="flex items-center justify-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg cursor-pointer transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      currentPage === idx + 1
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10'
                        : 'bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg cursor-pointer transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Slide Drawer for Filter panel */}
      {isFilterOpen && (
        <>
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 transition-opacity"
            onClick={() => setIsFilterOpen(false)}
          />
          <div className="fixed top-0 bottom-0 right-0 w-80 bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-soft-lg z-50 flex flex-col p-6 animate-fade-in transition-all">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-900 mb-6">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-blue-500" />
                <h3 className="text-sm font-bold text-slate-850 dark:text-slate-150">Advanced Filters</h3>
              </div>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-650 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Filter Fields */}
            <div className="flex-1 space-y-5 overflow-y-auto pr-1">
              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/25"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="inProgress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="onHold">On Hold</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/25"
                >
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Assignee */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Assignee</label>
                <select
                  value={filters.assigneeId}
                  onChange={(e) => handleFilterChange('assigneeId', e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/25"
                >
                  <option value="">All Assignees</option>
                  {members.map(member => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
              </div>

              {/* Due Date shortcuts */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Due Date</label>
                <select
                  value={filters.dueDate}
                  onChange={(e) => handleFilterChange('dueDate', e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/25"
                >
                  <option value="">Any Time</option>
                  <option value="today">Due Today</option>
                  <option value="upcoming">Due within 7 Days</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              {/* Tag */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Tag</label>
                <select
                  value={filters.tag}
                  onChange={(e) => handleFilterChange('tag', e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/25"
                >
                  <option value="">All Tags</option>
                  {TAGS.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-900 mt-6 flex gap-3">
              <button
                onClick={clearFilters}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-650 dark:text-slate-350 rounded-xl text-xs font-semibold cursor-pointer text-center transition-colors"
              >
                Reset Filters
              </button>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer text-center transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
