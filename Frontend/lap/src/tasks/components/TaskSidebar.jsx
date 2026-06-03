import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../context/TaskContext';
import { LayoutDashboard, ListTodo, Kanban, Calendar, UserCheck, PlusCircle, Bell, GraduationCap, Sparkles, ArrowLeft } from 'lucide-react';

export default function TaskSidebar({ isOpen, setIsOpen }) {
  const navigate = useNavigate();
  const { activePage, setActivePage, notifications } = useTasks();
  const unreadCount = notifications.filter(n => !n.read).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks-list', label: 'Task List', icon: ListTodo },
    { id: 'kanban', label: 'Kanban Board', icon: Kanban },
    { id: 'calendar', label: 'Calendar View', icon: Calendar },
    { id: 'my-tasks', label: 'My Tasks', icon: UserCheck },
    { id: 'create-task', label: 'Create Task', icon: PlusCircle },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
  ];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden" onClick={() => setIsOpen(false)} />
      )}
      <aside className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 dark:border-slate-900">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <GraduationCap size={22} />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 font-sans leading-tight">LAP System</h1>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-500 flex items-center gap-1">
              <Sparkles size={10} /> Task Module
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id || (item.id === 'tasks-list' && activePage === 'task-details');
            return (
              <button key={item.id} onClick={() => { setActivePage(item.id); setIsOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/60 hover:text-slate-950 dark:hover:text-slate-100'}`}>
                <div className="flex items-center gap-3">
                  <Icon size={18} className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className="flex items-center justify-center h-5 px-2 text-[10px] font-bold text-white bg-indigo-500 rounded-full animate-pulse">{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/20 space-y-3">
          <button
            onClick={() => {
              setIsOpen(false);
              navigate('/dashboard');
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <ArrowLeft size={17} />
            Back to LAP
          </button>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 text-center">LAP System / Tasks Module<br />v1.0.0</div>
        </div>
      </aside>
    </>
  );
}
