import React from 'react';
import { useTasks } from '../context/TaskContext';
import { MEMBERS } from '../data/mockData';
import { 
  LayoutDashboard, 
  ListTodo, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  CalendarDays, 
  UserCheck, 
  TrendingUp,
  ArrowUpRight,
  ChevronRight,
  Sparkles,
  Tag
} from 'lucide-react';

export default function Dashboard() {
  const { tasks, currentUser, navigateToDetails, setActivePage } = useTasks();

  const today = new Date().toISOString().split('T')[0];

  // Helper to check if task is overdue
  const isOverdue = (task) => {
    if (task.status === 'completed' || task.status === 'cancelled') return false;
    if (task.status === 'overdue') return true;
    return new Date(task.dueDate) < new Date(today);
  };

  // Card stats calculation
  const activeTasks = tasks.filter(t => !t.archived);
  const totalTasksCount = activeTasks.length;
  const pendingCount = activeTasks.filter(t => t.status === 'pending').length;
  const inProgressCount = activeTasks.filter(t => t.status === 'inProgress').length;
  const completedCount = activeTasks.filter(t => t.status === 'completed').length;
  const overdueCount = activeTasks.filter(isOverdue).length;
  const dueTodayCount = activeTasks.filter(t => t.dueDate === today && t.status !== 'completed').length;
  const myAssignedCount = activeTasks.filter(t => t.assignedTo?.id === currentUser.id).length;

  // Chart data calculations
  // Priority counts
  const priorities = ['low', 'medium', 'high', 'urgent'];
  const priorityCounts = priorities.reduce((acc, p) => {
    acc[p] = activeTasks.filter(t => t.priority === p).length;
    return acc;
  }, {});

  // Status counts
  const statuses = ['pending', 'inProgress', 'completed', 'onHold', 'cancelled', 'overdue'];
  const statusCounts = statuses.reduce((acc, s) => {
    if (s === 'overdue') {
      acc[s] = activeTasks.filter(isOverdue).length;
    } else {
      // Don't double count overdue tasks in their base status for status overview chart
      acc[s] = activeTasks.filter(t => t.status === s && !isOverdue(t)).length;
    }
    return acc;
  }, {});

  // Get recent 5 tasks
  const recentTasks = [...activeTasks]
    .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
    .slice(0, 5);

  // Get upcoming 4 deadlines (excluding completed/cancelled)
  const upcomingDeadlines = activeTasks
    .filter(t => t.status !== 'completed' && t.status !== 'cancelled')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 4);

  // Styles mapping helper
  const statusStyleMap = {
    pending: { bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', label: 'Pending' },
    inProgress: { bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', label: 'In Progress' },
    completed: { bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', label: 'Completed' },
    onHold: { bg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', label: 'On Hold' },
    cancelled: { bg: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300', label: 'Cancelled' },
    overdue: { bg: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400', label: 'Overdue' }
  };

  const priorityStyleMap = {
    low: { bg: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', label: 'Low' },
    medium: { bg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', label: 'Medium' },
    high: { bg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', label: 'High' },
    urgent: { bg: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Urgent' }
  };

  const getTaskStatusInfo = (task) => {
    if (isOverdue(task)) return statusStyleMap.overdue;
    return statusStyleMap[task.status] || statusStyleMap.pending;
  };

  const statCards = [
    { label: 'Total Tasks', value: totalTasksCount, icon: ListTodo, color: 'from-violet-500 to-indigo-500', shadow: 'shadow-indigo-500/10' },
    { label: 'Pending Tasks', value: pendingCount, icon: Clock, color: 'from-slate-500 to-slate-600', shadow: 'shadow-slate-500/10' },
    { label: 'In Progress', value: inProgressCount, icon: TrendingUp, color: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/10' },
    { label: 'Completed', value: completedCount, icon: CheckCircle2, color: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/10' },
    { label: 'Overdue Tasks', value: overdueCount, icon: AlertTriangle, color: 'from-red-500 to-rose-500', shadow: 'shadow-red-500/10' },
    { label: 'Due Today', value: dueTodayCount, icon: CalendarDays, color: 'from-orange-500 to-amber-500', shadow: 'shadow-orange-500/10' },
    { label: 'My Tasks', value: myAssignedCount, icon: UserCheck, color: 'from-indigo-500 to-purple-500', shadow: 'shadow-indigo-500/10' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-soft">
        <div className="flex items-center gap-4">
          <img 
            src={currentUser.avatar} 
            alt={currentUser.name}
            className="w-14 h-14 rounded-full border-2 border-blue-500 shadow-md object-cover"
          />
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              Welcome back, {currentUser.name}! <span className="text-xl">👋</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Role: <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{currentUser.role}</span> • Educational CRM & Staff Portal
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setActivePage('create-task')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/10 transition-all hover:scale-[1.02] cursor-pointer"
          >
            Create New Task
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>

      {/* Grid of Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx}
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-soft-lg"
            >
              {/* Decorative side accent gradient */}
              <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${card.color}`} />
              <div className="flex items-start justify-between">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                  {card.label}
                </span>
                <div className={`flex items-center justify-center p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 group-hover:scale-110 transition-transform duration-200`}>
                  <Icon size={14} className="text-slate-400 dark:text-slate-500" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {card.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts & Interactive Statistics Visualizers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Status Distribution */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Status Distribution Overview</h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Live summary of tasks categorized by progress status</p>
            </div>
            <Sparkles size={16} className="text-indigo-500" />
          </div>

          <div className="space-y-4">
            {statuses.map((statusKey) => {
              const count = statusCounts[statusKey] || 0;
              const percentage = totalTasksCount ? Math.round((count / totalTasksCount) * 100) : 0;
              
              // Colors configuration
              const barColors = {
                pending: 'bg-slate-400 dark:bg-slate-500',
                inProgress: 'bg-blue-500 dark:bg-blue-600',
                completed: 'bg-emerald-500 dark:bg-emerald-600',
                onHold: 'bg-amber-500 dark:bg-amber-600',
                cancelled: 'bg-rose-500 dark:bg-rose-600',
                overdue: 'bg-red-600 dark:bg-red-700'
              };

              const labelMap = {
                pending: 'Pending',
                inProgress: 'In Progress',
                completed: 'Completed',
                onHold: 'On Hold',
                cancelled: 'Cancelled',
                overdue: 'Overdue'
              };

              return (
                <div key={statusKey} className="group/bar">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {labelMap[statusKey]}
                    </span>
                    <div className="flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{count}</span>
                      <span>({percentage}%)</span>
                    </div>
                  </div>
                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${barColors[statusKey]} rounded-full transition-all duration-1000 ease-out group-hover/bar:brightness-110`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Distribution Chart */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Priority Levels Allocation</h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">Distribution of urgent vs backlog work</p>
              </div>
            </div>

            {/* Custom Pie/Donut Chart Simulation using beautiful Stacked Ring or Segments */}
            <div className="flex items-center justify-center py-4">
              <div className="relative w-40 h-40 flex items-center justify-center">
                {/* SVG Ring representation */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Gray background track */}
                  <path
                    className="text-slate-100 dark:text-slate-900"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    fill="none"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Segment calculation */}
                  {(() => {
                    let cumulativePercent = 0;
                    return priorities.map((p, idx) => {
                      const count = priorityCounts[p] || 0;
                      const percent = totalTasksCount ? (count / totalTasksCount) * 100 : 0;
                      const dashArray = `${percent} ${100 - percent}`;
                      const dashOffset = 100 - cumulativePercent;
                      cumulativePercent += percent;

                      const colors = {
                        low: 'text-slate-400 dark:text-slate-500',
                        medium: 'text-blue-500 dark:text-blue-600',
                        high: 'text-amber-500 dark:text-amber-600',
                        urgent: 'text-red-500 dark:text-red-600'
                      };

                      return percent > 0 ? (
                        <path
                          key={p}
                          className={`${colors[p]} transition-all duration-500`}
                          stroke="currentColor"
                          strokeWidth="3.8"
                          strokeDasharray={dashArray}
                          strokeDashoffset={dashOffset}
                          strokeLinecap="round"
                          fill="none"
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      ) : null;
                    });
                  })()}
                </svg>

                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
                    {totalTasksCount}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Color Labels */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {priorities.map((p) => {
              const labelColors = {
                low: 'bg-slate-400',
                medium: 'bg-blue-500',
                high: 'bg-amber-500',
                urgent: 'bg-red-500'
              };
              const labelMap = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };
              const count = priorityCounts[p] || 0;

              return (
                <div key={p} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">
                  <div className={`w-2.5 h-2.5 rounded-full ${labelColors[p]}`} />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{labelMap[p]}</span>
                    <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500">{count} Tasks</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Tasks & Upcoming Deadlines Widgets */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Recent Tasks Table */}
        <div className="xl:col-span-8 p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-soft overflow-hidden">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Recent Task Submissions</h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Overview of newly logged CRM actions and issues</p>
            </div>
            <button 
              onClick={() => setActivePage('tasks-list')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              View all
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-900 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 pr-2">Task Details</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Priority</th>
                  <th className="pb-3 px-3">Assignee</th>
                  <th className="pb-3 px-3 text-right">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-xs">
                {recentTasks.map((task) => {
                  const statusInfo = getTaskStatusInfo(task);
                  const priorityInfo = priorityStyleMap[task.priority] || priorityStyleMap.low;
                  
                  return (
                    <tr 
                      key={task.id} 
                      onClick={() => navigateToDetails(task.id)}
                      className="group hover:bg-slate-50/80 dark:hover:bg-slate-900/30 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 pr-2">
                        <div className="flex flex-col gap-1 max-w-[240px] sm:max-w-sm">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                            {task.title}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                            ID: <span className="font-mono">{task.id}</span> • {task.relatedModule}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${statusInfo.bg}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${priorityInfo.bg}`}>
                          {priorityInfo.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <img 
                            src={task.assignedTo?.avatar} 
                            alt={task.assignedTo?.name}
                            className="w-5.5 h-5.5 rounded-full border border-slate-200 dark:border-slate-800 object-cover"
                          />
                          <span className="font-medium text-slate-600 dark:text-slate-400 hidden sm:inline">
                            {task.assignedTo?.name.split(' ')[0]}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right font-medium text-slate-500 dark:text-slate-400">
                        {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Deadlines Widget */}
        <div className="xl:col-span-4 p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-soft">
          <div className="mb-5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Upcoming Deadlines</h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">Critical items requiring immediate attention</p>
          </div>

          <div className="space-y-3.5">
            {upcomingDeadlines.length === 0 ? (
              <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs">
                No upcoming active deadlines! 🎉
              </div>
            ) : (
              upcomingDeadlines.map((task) => {
                const isTaskOverdue = isOverdue(task);
                const isDueToday = task.dueDate === today;
                
                let flagColor = "text-slate-400 dark:text-slate-500";
                let flagBg = "bg-slate-50 dark:bg-slate-900";
                let dateBadgeText = new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' });
                
                if (isTaskOverdue) {
                  flagColor = "text-rose-600 dark:text-rose-400";
                  flagBg = "bg-rose-50 dark:bg-rose-950/20";
                  dateBadgeText = "Overdue";
                } else if (isDueToday) {
                  flagColor = "text-amber-600 dark:text-amber-400";
                  flagBg = "bg-amber-50 dark:bg-amber-950/20";
                  dateBadgeText = "Today";
                }

                return (
                  <div 
                    key={task.id}
                    onClick={() => navigateToDetails(task.id)}
                    className="group flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-900 hover:border-blue-100 dark:hover:border-blue-900/40 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 cursor-pointer transition-all"
                  >
                    <div className="flex flex-col gap-1 max-w-[70%]">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {task.title}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                        <Tag size={10} className="text-slate-300 dark:text-slate-600" />
                        <span className="truncate">{task.tags?.[0] || 'Task'}</span>
                      </div>
                    </div>

                    <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${flagBg} ${flagColor} transition-colors border border-transparent group-hover:border-current`}>
                      {dateBadgeText}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}