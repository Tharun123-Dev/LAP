import React, { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import {
  Clock,
  CheckCircle2,
  Play,
  Pause,
  XCircle,
  AlertOctagon,
  Calendar,
  Edit2,
  Plus,
  X,
  User,
  AlertTriangle
} from 'lucide-react';

export default function Kanban() {
  const { tasks, members, updateStatus, updateTask, navigateToDetails } = useTasks();
  
  // Quick Edit State
  const [editingTask, setEditingTask] = useState(null);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState('medium');
  const [quickStatus, setQuickStatus] = useState('pending');
  const [quickAssigneeId, setQuickAssigneeId] = useState('');

  const today = new Date().toISOString().split('T')[0];

  // Helper to determine if a task is overdue
  const checkOverdue = (task) => {
    if (task.status === 'completed' || task.status === 'cancelled') return false;
    if (task.status === 'overdue') return true;
    return new Date(task.dueDate) < new Date(today);
  };

  // Columns definition
  const columns = [
    { id: 'pending', title: 'Pending', icon: Clock, color: 'border-t-slate-400 bg-slate-500/5 text-slate-500' },
    { id: 'inProgress', title: 'In Progress', icon: Play, color: 'border-t-blue-500 bg-blue-500/5 text-blue-500' },
    { id: 'completed', title: 'Completed', icon: CheckCircle2, color: 'border-t-emerald-500 bg-emerald-500/5 text-emerald-500' },
    { id: 'onHold', title: 'On Hold', icon: Pause, color: 'border-t-amber-500 bg-amber-500/5 text-amber-500' },
    { id: 'cancelled', title: 'Cancelled', icon: XCircle, color: 'border-t-rose-500 bg-rose-500/5 text-rose-500' },
    { id: 'overdue', title: 'Overdue', icon: AlertOctagon, color: 'border-t-red-650 bg-red-650/5 text-red-650' }
  ];

  // Map tasks to their appropriate Kanban column
  const getTasksByColumn = (columnId) => {
    const activeTasks = tasks.filter(t => !t.archived);
    return activeTasks.filter(task => {
      const isTaskOverdue = checkOverdue(task);
      if (columnId === 'overdue') {
        return isTaskOverdue;
      }
      // If overdue, don't show in standard column
      if (isTaskOverdue) return false;
      return task.status === columnId;
    });
  };

  // Drag and Drop handlers
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.currentTarget.classList.add('opacity-40');
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('opacity-40');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-slate-100/50', 'dark:bg-slate-900/30');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('bg-slate-100/50', 'dark:bg-slate-900/30');
  };

  const handleDrop = (e, targetColumnId) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-slate-100/50', 'dark:bg-slate-900/30');
    
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    // Check if task exists
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Drop to overdue changes status to overdue, else changes to specified status
    const newStatus = targetColumnId === 'overdue' ? 'overdue' : targetColumnId;

    // If drag updates, and we set it out of overdue to pending, etc. we might want to check the due date.
    // We will just let the user drag it, updating status in context.
    updateStatus(taskId, newStatus);
  };

  // Style priority helpers
  const priorityColors = {
    low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/35 dark:text-blue-400',
    high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/35 dark:text-amber-400',
    urgent: 'bg-rose-100 text-rose-700 dark:bg-rose-900/35 dark:text-rose-455'
  };

  // Open Quick Edit
  const handleOpenQuickEdit = (e, task) => {
    e.stopPropagation(); // Avoid navigating to details
    setEditingTask(task);
    setQuickTitle(task.title);
    setQuickPriority(task.priority);
    setQuickStatus(task.status);
    setQuickAssigneeId(task.assignedTo?.id || '');
  };

  // Save Quick Edit
  const handleSaveQuickEdit = (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    const assignee = members.find(m => String(m.id) === String(quickAssigneeId)) || editingTask.assignedTo;

    const updated = {
      ...editingTask,
      title: quickTitle,
      priority: quickPriority,
      status: quickStatus,
      assignedTo: assignee
    };

    updateTask(updated);
    setEditingTask(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Workflow Board</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Drag cards to update task status or perform quick adjustments</p>
      </div>

      {/* Kanban Board Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start overflow-x-auto pb-4">
        {columns.map((col) => {
          const ColIcon = col.icon;
          const colTasks = getTasksByColumn(col.id);

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 min-h-[500px] max-h-[80vh] overflow-hidden ${col.color} border-t-4 transition-colors`}
            >
              {/* Column Title Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-900 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <ColIcon size={15} />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-350">{col.title}</span>
                </div>
                <span className="flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-slate-150 dark:bg-slate-850 rounded-full text-slate-500 dark:text-slate-400">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks List Container */}
              <div className="flex-1 p-3.5 space-y-3 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-slate-200/50 dark:border-slate-800/40 rounded-xl">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">Drop tasks here</span>
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const isTaskOverdue = checkOverdue(task);
                    const isDueToday = task.dueDate === today;

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => navigateToDetails(task.id)}
                        className="group relative bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 dark:hover:border-blue-500/40 rounded-xl p-4 shadow-soft cursor-grab active:cursor-grabbing hover:shadow-soft-lg hover:-translate-y-0.5 transition-all duration-200"
                      >
                        {/* Edit card option */}
                        <button
                          onClick={(e) => handleOpenQuickEdit(e, task)}
                          className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-600 transition-opacity cursor-pointer"
                        >
                          <Edit2 size={11} />
                        </button>

                        <div className="space-y-3">
                          {/* Title & Tag */}
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-550 block">
                              {task.id}
                            </span>
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {task.title}
                            </h4>
                          </div>

                          {/* Tags Grid */}
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {task.tags.slice(0, 2).map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-[8px] font-bold rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Footer: Due date & Assignee */}
                          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-900 pt-2.5 mt-2">
                            {/* Due date indicator */}
                            <div className="flex items-center gap-1">
                              <Calendar size={11} className="text-slate-350" />
                              <span className={`text-[9px] font-bold ${
                                isTaskOverdue 
                                  ? 'text-red-650 dark:text-red-400' 
                                  : isDueToday 
                                    ? 'text-amber-600 dark:text-amber-400' 
                                    : 'text-slate-400 dark:text-slate-500'
                              }`}>
                                {isTaskOverdue 
                                  ? 'Overdue' 
                                  : isDueToday 
                                    ? 'Today' 
                                    : new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })
                                }
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Priority badge */}
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${priorityColors[task.priority] || priorityColors.medium}`}>
                                {task.priority}
                              </span>

                              {/* Assignee Avatar */}
                              <img
                                src={task.assignedTo?.avatar}
                                alt={task.assignedTo?.name}
                                title={task.assignedTo?.name}
                                className="w-5 h-5 rounded-full border border-slate-100 dark:border-slate-800 object-cover"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Inline Quick Edit Dialog Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-soft-lg animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-900 mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Quick Edit Task</h3>
              <button 
                onClick={() => setEditingTask(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-650 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveQuickEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Task Title</label>
                <input
                  type="text"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/25"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Priority</label>
                  <select
                    value={quickPriority}
                    onChange={(e) => setQuickPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/25"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Status</label>
                  <select
                    value={quickStatus}
                    onChange={(e) => setQuickStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/25"
                  >
                    <option value="pending">Pending</option>
                    <option value="inProgress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="onHold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Assignee</label>
                <select
                  value={quickAssigneeId}
                  onChange={(e) => setQuickAssigneeId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/25"
                >
                  {members.map(member => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-900 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-650 dark:text-slate-350 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
