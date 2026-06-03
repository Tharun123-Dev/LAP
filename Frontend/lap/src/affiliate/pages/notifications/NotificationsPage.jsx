import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, CheckCircle2, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { notificationService } from '../../services/notificationService';
import { useNotifications } from '../../hooks/useNotifications';
import Button from '../../components/buttons/Button';
import formatDate from '../../utils/formatDate';
import SkeletonLoader from '../../components/loaders/SkeletonLoader';

export const NotificationsPage = () => {
  const { data: initialNotifs, loading, execute: reloadNotifs } = useFetch(notificationService.getNotifications);
  const [notifs, setNotifs] = useState([]);
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (initialNotifs) {
      setNotifs(initialNotifs);
    }
  }, [initialNotifs]);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifs(prev => prev.map(n => ({ ...n, read: true })));
      addNotification('All notifications marked as read', 'success');
    } catch (err) {
      addNotification('Failed to mark all as read', 'error');
    }
  };

  const handleClearAll = () => {
    setNotifs([]);
    addNotification('Notifications logs cleared', 'info');
  };

  const toggleRead = async (id, isRead) => {
    if (isRead) return;
    try {
      await notificationService.markAsRead(id);
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-primary-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">System Notifications</h1>
          <p className="text-slate-400 text-sm font-medium mt-1">
            Stay up to date with new referrals, campaign benchmarks, and bank payouts.
          </p>
        </div>

        {notifs.length > 0 && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} icon={Check}>
              Mark all read
            </Button>
            <Button variant="ghost" size="sm" className="text-rose-500 hover:bg-rose-50" onClick={handleClearAll} icon={Trash2}>
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Notifications list feed */}
      <div className="glass-card p-6 rounded-2xl">
        {loading ? (
          <SkeletonLoader count={3} />
        ) : notifs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 font-semibold space-y-2">
            <Bell className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 animate-float" />
            <p>Inbox is quiet</p>
            <p className="text-xs text-slate-400 font-medium">We'll alert you when campaigns yield new signups!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
            {notifs.map((n) => (
              <div 
                key={n.id} 
                className={`py-4 flex gap-4 first:pt-0 last:pb-0 items-start cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/10 px-2 rounded-xl transition-all ${!n.read ? 'border-l-4 border-primary-500 pl-3' : ''}`}
                onClick={() => toggleRead(n.id, n.read)}
              >
                <div className="flex-shrink-0 mt-1">
                  {getIcon(n.type)}
                </div>
                
                <div className="flex-grow space-y-1">
                  <div className="flex justify-between items-center gap-4">
                    <h4 className={`text-sm font-bold ${!n.read ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>{n.title}</h4>
                    <span className="text-[10px] font-semibold text-slate-400">{formatDate(n.date, 'short')}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pr-8">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;