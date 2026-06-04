import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { INITIAL_TASKS, INITIAL_NOTIFICATIONS, MEMBERS } from '../data/mockData';
import {
  addTaskCommentApi,
  archiveTaskApi,
  createTask,
  deleteTaskApi,
  fetchTaskMembers,
  fetchTaskNotifications,
  fetchTasks,
  markTaskNotificationsRead,
  updateTaskApi,
} from '../services/tasksApi';

const TaskContext = createContext();

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) throw new Error('useTasks must be used within a TaskProvider');
  return context;
};

export const TaskProvider = ({ children }) => {
  const auth = useSelector((state) => state.auth || {});
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('task-theme');
    return saved ? saved === 'dark' : false;
  });
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [members, setMembers] = useState(MEMBERS);
  const [currentUser, setCurrentUser] = useState(MEMBERS[2]);
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState(null);

  useEffect(() => {
    if (darkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('task-theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('task-theme', 'light'); }
  }, [darkMode]);

  const normalizeMember = (member) => ({
    ...member,
    id: String(member.id),
    name: member.name || member.full_name || member.username || 'User',
    avatar: member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || member.full_name || 'User')}&background=6366f1&color=fff`,
  });

  const normalizeTaskForApi = (task) => ({
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    startDate: task.startDate,
    dueDate: task.dueDate,
    assigned_to_id: task.assignedTo?.id || task.assignedToId,
    tags: task.tags || [],
    attachments: task.attachments || [],
    relatedModule: task.relatedModule || '',
    archived: !!task.archived,
  });

  const loadTaskData = async () => {
    setIsLoading(true);
    try {
      const [tasksRes, membersRes, notificationsRes] = await Promise.allSettled([
        fetchTasks(),
        fetchTaskMembers(),
        fetchTaskNotifications(),
      ]);
      const nextMembers = membersRes.status === 'fulfilled'
        ? (membersRes.value.data || []).map(normalizeMember)
        : MEMBERS;
      setMembers(nextMembers.length ? nextMembers : MEMBERS);
      if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value.data || []);
      if (notificationsRes.status === 'fulfilled') setNotifications(notificationsRes.value.data || []);
      const loggedInId = auth.userId ? String(auth.userId) : null;
      const loggedInUser = nextMembers.find((member) => String(member.id) === loggedInId);
      if (loggedInUser) setCurrentUser(loggedInUser);
      else if (nextMembers[0]) setCurrentUser(nextMembers[0]);
      setErrorState(null);
    } catch (error) {
      console.error('[Tasks] Backend sync failed:', error);
      setErrorState('Task backend is not reachable. Showing local demo data until API is available.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (auth.access) loadTaskData();
  }, [auth.access, auth.userId]);

  const triggerLoading = (callback) => {
    setIsLoading(true);
    setTimeout(() => { callback(); setIsLoading(false); }, 450);
  };

  const addTask = async (newTask) => {
    setIsLoading(true);
    try {
      const res = await createTask(normalizeTaskForApi(newTask));
      setTasks(prev => [res.data, ...prev]);
      const notificationsRes = await fetchTaskNotifications();
      setNotifications(notificationsRes.data || []);
    } catch (error) {
      setErrorState(error?.response?.data?.detail || 'Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  const updateTask = async (updatedTask) => {
    setIsLoading(true);
    try {
      const res = await updateTaskApi(updatedTask.id, normalizeTaskForApi(updatedTask));
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? res.data : t));
    } catch (error) {
      setErrorState(error?.response?.data?.detail || 'Failed to update task');
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (taskId, newStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    await updateTask({ ...task, status: newStatus });
  };

  const deleteTask = async (taskId) => {
    setIsLoading(true);
    try {
      await deleteTaskApi(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      if (selectedTaskId === taskId) { setSelectedTaskId(null); setActivePage('tasks-list'); }
    } catch (error) {
      setErrorState(error?.response?.data?.detail || 'Failed to delete task');
    } finally {
      setIsLoading(false);
    }
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

  const archiveTask = async (taskId) => {
    const res = await archiveTaskApi(taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? res.data : t));
  };

  const addComment = async (taskId, content) => {
    if (!content.trim()) return;
    const res = await addTaskCommentApi(taskId, content);
    setTasks(prev => prev.map(t => t.id === taskId ? res.data : t));
  };

  const deleteComment = (taskId, commentId) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, comments: (t.comments || []).filter(c => c.id !== commentId) } : t));
  };

  const markNotificationRead = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllNotificationsRead = async () => {
    await markTaskNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };
  const navigateToDetails = (taskId) => { setSelectedTaskId(taskId); setActivePage('task-details'); };
  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <TaskContext.Provider value={{ darkMode, toggleDarkMode, activePage, setActivePage, selectedTaskId, setSelectedTaskId, currentUser, setCurrentUser, members, tasks, notifications, isLoading, setIsLoading, errorState, setErrorState, addTask, updateTask, updateStatus, deleteTask, duplicateTask, archiveTask, addComment, deleteComment, markNotificationRead, markAllNotificationsRead, navigateToDetails, refreshTasks: loadTaskData }}>
      {children}
    </TaskContext.Provider>
  );
};
