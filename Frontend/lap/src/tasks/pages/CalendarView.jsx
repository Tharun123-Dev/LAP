import React, { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Calendar as CalendarIcon,
  User,
  Info,
  Clock,
  ExternalLink
} from 'lucide-react';

export default function CalendarView() {
  const { tasks, addTask, navigateToDetails, currentUser, members } = useTasks();
  
  // Calendar Navigation State
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modal states
  const [selectedDate, setSelectedDate] = useState(null); // String 'YYYY-MM-DD'
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null); // For detail popover

  // New task form state (Quick Add)
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newAssigneeId, setNewAssigneeId] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Month navigation helpers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Get month name
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Generate days array for grid
  const getDaysInMonth = () => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const days = [];

    // Prev month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, prevMonthTotalDays - i);
      days.push({
        date: prevDate,
        isCurrentMonth: false,
        dateString: prevDate.toISOString().split('T')[0]
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const currDate = new Date(year, month, i);
      days.push({
        date: currDate,
        isCurrentMonth: true,
        dateString: currDate.toISOString().split('T')[0]
      });
    }

    // Next month padding days to complete grid (multiples of 7)
    const remainingCells = 42 - days.length; // Standard 6 weeks calendar grid
    for (let i = 1; i <= remainingCells; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({
        date: nextDate,
        isCurrentMonth: false,
        dateString: nextDate.toISOString().split('T')[0]
      });
    }

    return days;
  };

  const calendarDays = getDaysInMonth();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Filter active tasks
  const activeTasks = tasks.filter(t => !t.archived);

  // Get tasks for a specific date
  const getTasksForDate = (dateString) => {
    return activeTasks.filter(task => task.dueDate === dateString);
  };

  // Styles map
  const priorityStyleMap = {
    low: 'bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400 border-slate-200 dark:border-slate-800',
    medium: 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border-blue-100 dark:border-blue-900/30',
    high: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/30',
    urgent: 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-100 dark:border-rose-900/30'
  };

  const priorityDotColors = {
    low: 'bg-slate-400',
    medium: 'bg-blue-500',
    high: 'bg-amber-500',
    urgent: 'bg-red-500'
  };

  const statusLabels = {
    pending: 'Pending',
    inProgress: 'In Progress',
    completed: 'Completed',
    onHold: 'On Hold',
    cancelled: 'Cancelled',
    overdue: 'Overdue'
  };

  const handleCellClick = (dateString) => {
    setSelectedDate(dateString);
    setShowAddModal(true);
  };

  const handleQuickAddSubmit = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const assignee = members.find(m => String(m.id) === String(newAssigneeId)) || members[0];

    const newTask = {
      title: newTitle,
      description: 'Quick task created from calendar view.',
      status: 'pending',
      priority: newPriority,
      assignedTo: assignee,
      assignedBy: currentUser,
      startDate: selectedDate,
      dueDate: selectedDate,
      tags: ['Admissions'],
      attachments: [],
      relatedModule: 'Lead Intake Form'
    };

    addTask(newTask);
    setNewTitle('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Task Schedule</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Monthly deadline monitoring and prompt task logging</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1.5 rounded-xl shadow-soft">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-655 hover:text-slate-855 cursor-pointer"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-655 hover:text-slate-855 cursor-pointer"
            >
              <ChevronRight size={15} />
            </button>
          </div>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-250">
            {monthName} {year}
          </span>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-soft overflow-hidden">
        {/* Days of week */}
        <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/20">
          {weekDays.map((day) => (
            <div key={day} className="py-2.5 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-900 border-t border-l border-transparent">
          {calendarDays.map((day, idx) => {
            const isToday = day.dateString === new Date().toISOString().split('T')[0];
            const dayTasks = getTasksForDate(day.dateString);

            return (
              <div
                key={idx}
                className={`min-h-[100px] p-2 flex flex-col justify-between hover:bg-slate-50/30 dark:hover:bg-slate-900/10 transition-colors group relative ${
                  day.isCurrentMonth ? 'bg-white dark:bg-slate-950' : 'bg-slate-50/40 dark:bg-slate-900/10'
                }`}
              >
                {/* Cell header */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-bold ${
                    isToday
                      ? 'w-5 h-5 flex items-center justify-center rounded-full bg-blue-600 text-white shadow-sm'
                      : day.isCurrentMonth
                        ? 'text-slate-700 dark:text-slate-300'
                        : 'text-slate-350 dark:text-slate-600'
                  }`}>
                    {day.date.getDate()}
                  </span>

                  {/* Add action */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCellClick(day.dateString);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-blue-600 transition-opacity cursor-pointer"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                {/* Cell Tasks List */}
                <div className="flex-1 space-y-1 overflow-y-auto max-h-[70px]">
                  {dayTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTask(task);
                      }}
                      className={`px-1.5 py-0.5 border rounded text-[9px] font-semibold truncate cursor-pointer transition-all ${
                        priorityStyleMap[task.priority] || priorityStyleMap.medium
                      } hover:brightness-95`}
                    >
                      {task.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Details Popover Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-soft-lg animate-fade-in">
            <div className="flex items-start justify-between pb-3.5 border-b border-slate-100 dark:border-slate-900 mb-3.5">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase">
                  {selectedTask.id}
                </span>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  {selectedTask.title}
                </h4>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-950 rounded-lg text-slate-400 hover:text-slate-655 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal line-clamp-3">
                {selectedTask.description}
              </p>

              <div className="grid grid-cols-2 gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-900">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Priority</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-350 capitalize flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${priorityDotColors[selectedTask.priority]}`} />
                    {selectedTask.priority}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-350 capitalize">
                    {statusLabels[selectedTask.status]}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 mt-1.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Assignee</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-350">
                    {selectedTask.assignedTo?.name}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 mt-1.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Due Date</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-350">
                    {selectedTask.dueDate}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-900 flex justify-end gap-2">
                <button
                  onClick={() => {
                    navigateToDetails(selectedTask.id);
                    setSelectedTask(null);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold cursor-pointer"
                >
                  <ExternalLink size={12} />
                  View Full Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-soft-lg animate-fade-in">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-900 mb-3.5">
              <div className="flex items-center gap-1.5">
                <CalendarIcon size={15} className="text-blue-500" />
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  Quick Add Task
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-655 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleQuickAddSubmit} className="space-y-4">
              <div className="text-[10px] font-semibold text-indigo-500">
                Due Date: {selectedDate}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Task Title</label>
                <input
                  type="text"
                  placeholder="Review counselor targets..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/25 text-slate-800 dark:text-slate-200"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/25"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assignee</label>
                <select
                  value={newAssigneeId}
                  onChange={(e) => setNewAssigneeId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/25"
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-900 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-655 dark:text-slate-355 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
