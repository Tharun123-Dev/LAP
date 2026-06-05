import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { TaskProvider, useTasks } from './context/TaskContext';
import Dashboard from './pages/Dashboard';
import TaskList from './pages/TaskList';
import Kanban from './pages/Kanban';
import CalendarView from './pages/CalendarView';
import CreateTask from './pages/CreateTask';
import TaskDetails from './pages/TaskDetails';
import MyTasks from './pages/MyTasks';
import NotificationsPage from './pages/NotificationsPage';
import {
  Sun, Moon, Bell, ChevronDown, AlertOctagon,
  Loader2, Sparkles
} from 'lucide-react';

function TaskAppContent() {
  const { permissions = [] } = useSelector((state) => state.auth || {});
  const {
    darkMode, toggleDarkMode, activePage, setActivePage,
    currentUser, setCurrentUser, members, notifications,
    isLoading, setIsLoading, errorState, setErrorState, tasks
  } = useTasks();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showDemoTools, setShowDemoTools] = useState(false);

  const hasAny = (...codes) => codes.some((code) => permissions.includes(code));

  const unreadCount = notifications.filter(n => !n.read).length;
  const navItems = useMemo(() => ([
    hasAny('view_tasks', 'view_team_tasks', 'assign_task') && { id: 'dashboard', label: 'Dashboard' },
    hasAny('view_team_tasks', 'assign_task') && { id: 'tasks-list', label: 'Task List' },
    hasAny('view_team_tasks', 'assign_task') && { id: 'kanban', label: 'Kanban' },
    hasAny('view_team_tasks', 'assign_task') && { id: 'calendar', label: 'Calendar' },
    hasAny('view_tasks', 'view_team_tasks', 'assign_task') && { id: 'my-tasks', label: 'My Tasks' },
    hasAny('create_task', 'assign_task') && { id: 'create-task', label: 'Create Task' },
    hasAny('view_tasks', 'view_team_tasks', 'assign_task') && { id: 'notifications', label: 'Notifications', badge: unreadCount },
  ]).filter(Boolean), [permissions, unreadCount]);

  useEffect(() => {
    if (!navItems.some((item) => item.id === activePage)) {
      setActivePage(navItems[0]?.id || 'my-tasks');
    }
  }, [activePage, navItems, setActivePage]);

  const renderActivePage = () => {
    if (errorState) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-soft max-w-lg mx-auto">
          <AlertOctagon size={48} className="text-rose-500 mb-4 animate-bounce" />
          <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Critical System Error</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{errorState}</p>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setErrorState(null)} className="px-4 py-2.5 bg-slate-150 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer">Dismiss Alert</button>
            <button onClick={() => { setErrorState(null); window.location.reload(); }} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer">Reload System</button>
          </div>
        </div>
      );
    }
    switch (activePage) {
      case 'dashboard': return <Dashboard />;
      case 'tasks-list': return <TaskList />;
      case 'kanban': return <Kanban />;
      case 'calendar': return <CalendarView />;
      case 'my-tasks': return <MyTasks />;
      case 'create-task': return <CreateTask />;
      case 'notifications': return <NotificationsPage />;
      case 'task-details': return <TaskDetails />;
      default: return <Dashboard />;
    }
  };

  const getPageTitle = () => {
    switch (activePage) {
      case 'dashboard': return 'Task Dashboard';
      case 'tasks-list': return 'Task Repository';
      case 'kanban': return 'Workflow Kanban';
      case 'calendar': return 'Academic Schedule';
      case 'my-tasks': return 'My Tasks';
      case 'create-task': return 'Create Task';
      case 'notifications': return 'Task Alerts';
      case 'task-details': return 'Task Workspace';
      default: return 'Tasks';
    }
  };

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
      <div className="flex min-h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-950">
        {/* Task Module Topbar */}
        <header className="flex-shrink-0 z-30 border-b border-slate-200/80 bg-white/80 px-4 py-4 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight hidden sm:block">{getPageTitle()}</h1>

            <div className="flex items-center gap-3.5">
            {/* Demo tools */}
            <div className="relative">
              <button onClick={() => setShowDemoTools(!showDemoTools)} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-900/60 rounded-xl text-[10px] font-bold text-indigo-600 dark:text-indigo-400 transition-colors cursor-pointer">
                <Sparkles size={12} /> Demo Options
              </button>
              {showDemoTools && (
                <>
                  <div className="fixed inset-0 z-15" onClick={() => setShowDemoTools(false)} />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-3.5 z-20 space-y-2.5">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Simulate States</span>
                    <button onClick={() => { setIsLoading(true); setShowDemoTools(false); setTimeout(() => setIsLoading(false), 2000); }} className="w-full flex items-center gap-2 text-left px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
                      <Loader2 size={12} className="animate-spin text-blue-500" /> Loading State (2s)
                    </button>
                    <button onClick={() => { setErrorState('401 Unauthorized API access or schema validation conflict. Simulating database offline fallback state.'); setShowDemoTools(false); }} className="w-full flex items-center gap-2 text-left px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
                      <AlertOctagon size={12} className="text-red-500" /> Error State Screen
                    </button>
                    <div className="border-t border-slate-100 dark:border-slate-850 my-1" />
                    <div className="text-[8px] text-slate-400">CRM tasks active: {tasks.length}</div>
                  </div>
                </>
              )}
            </div>

            {/* Dark mode */}
            <button onClick={toggleDarkMode} className="p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer transition-all">
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Notifications bell */}
            <button onClick={() => setActivePage('notifications')} className="relative p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer transition-all">
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center h-4 min-w-[16px] px-1 text-[8px] font-extrabold text-white bg-indigo-500 rounded-full shadow-sm animate-pulse">{unreadCount}</span>
              )}
            </button>

            <div className="border-l border-slate-200 dark:border-slate-800 h-6" />

            {/* User switcher */}
            <div className="relative">
              <button onClick={() => setUserDropdownOpen(!userDropdownOpen)} className="flex items-center gap-2 p-1.5 pr-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 transition-all cursor-pointer">
                <img src={currentUser.avatar} alt={currentUser.name} className="w-7 h-7 rounded-full object-cover shadow-sm" />
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-[11px] font-bold text-slate-750 dark:text-slate-250 leading-tight">{currentUser.name}</span>
                  <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">{currentUser.role.split(' ')[0]}</span>
                </div>
                <ChevronDown size={12} className="text-slate-400" />
              </button>
              {userDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-15" onClick={() => setUserDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg z-20 py-2.5 text-xs">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-900 mb-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Switch User Role</span>
                      <span className="text-[10px] text-slate-405">Test role-based task visibility and personal queues</span>
                    </div>
                    {members.map((member) => (
                      <button key={member.id} onClick={() => { setCurrentUser(member); setUserDropdownOpen(false); setIsLoading(true); setTimeout(() => setIsLoading(false), 300); }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-850 text-left transition-colors cursor-pointer ${currentUser.id === member.id ? 'bg-blue-50/40 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-700 dark:text-slate-350'}`}>
                        <img src={member.avatar} alt={member.name} className="w-7 h-7 rounded-full object-cover" />
                        <div className="flex flex-col">
                          <span className="font-bold">{member.name}</span>
                          <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500">{member.role}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          </div>

          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {navItems.map((item) => {
              const active = activePage === item.id || (item.id === 'tasks-list' && activePage === 'task-details');
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`relative flex-shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-950 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                  {item.badge > 0 && (
                    <span className="ml-2 inline-flex min-w-[18px] items-center justify-center rounded-full bg-indigo-500 px-1.5 text-[10px] font-black text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </header>

        {/* Loading overlay */}
        {isLoading && (
          <div className="fixed inset-0 z-50 bg-slate-950/25 backdrop-blur-xs flex items-center justify-center">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-soft-lg flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Synchronizing database...</span>
            </div>
          </div>
        )}

        {/* Page content */}
        <main className="bg-slate-50 p-4 dark:bg-slate-950 sm:p-6 md:p-8">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
}

export default function TaskShell() {
  return (
    <TaskProvider>
      <TaskAppContent />
    </TaskProvider>
  );
}
