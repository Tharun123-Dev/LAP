import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_TASKS, INITIAL_NOTIFICATIONS, MEMBERS } from '../data/mockData';

const TaskContext = createContext();

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) throw new Error('useTasks must be used within a TaskProvider');
  return context;
};

export const TaskProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('task-theme');
    return saved ? saved === 'dark' : false;
  });
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [currentUser, setCurrentUser] = useState(MEMBERS[2]);
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('crm-tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('crm-notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState(null);

  useEffect(() => {
    if (darkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('task-theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('task-theme', 'light'); }
  }, [darkMode]);

  useEffect(() => { localStorage.setItem('crm-tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('crm-notifications', JSON.stringify(notifications)); }, [notifications]);

  const triggerLoading = (callback) => {
    setIsLoading(true);
    setTimeout(() => { callback(); setIsLoading(false); }, 450);
  };

  const addTask = (newTask) => {
    triggerLoading(() => {
      const task = {
        id: `TSK-${Math.floor(1000 + Math.random() * 9000)}`,
        createdDate: new Date().toISOString().split('T')[0],
        archived: false,
        comments: [],
        history: [{ id: `h-${Math.random().toString(36).substr(2,9)}`, user: currentUser.name, action: 'Task Created', details: `Task created and assigned to ${newTask.assignedTo.name}`, timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) }],
        ...newTask
      };
      setTasks(prev => [task, ...prev]);
      if (task.assignedTo.id !== currentUser.id) {
        setNotifications(prev => [{ id: `ntf-${Math.random().toString(36).substr(2,9)}`, type: 'assigned', taskTitle: task.title, taskId: task.id, sender: currentUser.name, timestamp: 'Just now', read: false, message: `assigned you a task: ${task.title}` }, ...prev]);
      }
    });
  };

  const updateTask = (updatedTask) => {
    triggerLoading(() => {
      setTasks(prev => prev.map(t => {
        if (t.id !== updatedTask.id) return t;
        const historyEntry = [];
        if (t.status !== updatedTask.status) historyEntry.push({ id: `h-${Math.random().toString(36).substr(2,9)}`, user: currentUser.name, action: 'Status Updated', details: `Changed status from ${t.status} to ${updatedTask.status}`, timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) });
        if (t.assignedTo.id !== updatedTask.assignedTo.id) historyEntry.push({ id: `h-${Math.random().toString(36).substr(2,9)}`, user: currentUser.name, action: 'Assignment Changed', details: `Reassigned task to ${updatedTask.assignedTo.name}`, timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) });
        return { ...t, ...updatedTask, history: [...(t.history || []), ...historyEntry] };
      }));
    });
  };

  const updateStatus = (taskId, newStatus) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return { ...t, status: newStatus, history: [...(t.history || []), { id: `h-${Math.random().toString(36).substr(2,9)}`, user: currentUser.name, action: 'Status Updated', details: `Quick status change to ${newStatus}`, timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) }] };
    }));
  };

  const deleteTask = (taskId) => {
    triggerLoading(() => {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      if (selectedTaskId === taskId) { setSelectedTaskId(null); setActivePage('tasks-list'); }
    });
  };

  const duplicateTask = (taskId) => {
    triggerLoading(() => {
      const target = tasks.find(t => t.id === taskId);
      if (target) {
        const copy = { ...target, id: `TSK-${Math.floor(1000 + Math.random() * 9000)}`, title: `${target.title} (Copy)`, createdDate: new Date().toISOString().split('T')[0], history: [{ id: `h-${Math.random().toString(36).substr(2,9)}`, user: currentUser.name, action: 'Task Duplicated', details: `Duplicated from ${target.id}`, timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) }] };
        setTasks(prev => { const idx = prev.findIndex(t => t.id === taskId); const arr = [...prev]; arr.splice(idx + 1, 0, copy); return arr; });
      }
    });
  };

  const archiveTask = (taskId) => {
    triggerLoading(() => { setTasks(prev => prev.map(t => t.id === taskId ? { ...t, archived: true } : t)); });
  };

  const addComment = (taskId, content) => {
    if (!content.trim()) return;
    const newComment = { id: `c-${Math.random().toString(36).substr(2,9)}`, author: currentUser, content, timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) };
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return { ...t, comments: [...(t.comments || []), newComment], history: [...(t.history || []), { id: `h-${Math.random().toString(36).substr(2,9)}`, user: currentUser.name, action: 'Comment Added', details: 'Added a discussion comment', timestamp: newComment.timestamp }] };
    }));
    if (content.includes('@')) {
      const tsk = tasks.find(t => t.id === taskId);
      setNotifications(prev => [{ id: `ntf-${Math.random().toString(36).substr(2,9)}`, type: 'mention', taskTitle: tsk?.title || '', taskId, sender: currentUser.name, timestamp: 'Just now', read: false, message: `mentioned you in a comment: "${content.substring(0,40)}..."` }, ...prev]);
    }
  };

  const deleteComment = (taskId, commentId) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, comments: (t.comments || []).filter(c => c.id !== commentId) } : t));
  };

  const markNotificationRead = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllNotificationsRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const navigateToDetails = (taskId) => { setSelectedTaskId(taskId); setActivePage('task-details'); };
  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <TaskContext.Provider value={{ darkMode, toggleDarkMode, activePage, setActivePage, selectedTaskId, setSelectedTaskId, currentUser, setCurrentUser, tasks, notifications, isLoading, setIsLoading, errorState, setErrorState, addTask, updateTask, updateStatus, deleteTask, duplicateTask, archiveTask, addComment, deleteComment, markNotificationRead, markAllNotificationsRead, navigateToDetails }}>
      {children}
    </TaskContext.Provider>
  );
};