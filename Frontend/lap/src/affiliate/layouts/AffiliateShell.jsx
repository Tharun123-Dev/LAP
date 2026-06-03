// src/affiliate/layouts/AffiliateShell.jsx
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  FileText,
  LayoutDashboard,
  Link as LinkIcon,
  LogOut,
  Menu,
  Settings,
  User,
  Users,
  X,
} from 'lucide-react';
import { AffiliateAuthProvider } from '../context/AffiliateAuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { NotificationProvider } from '../context/NotificationContext';
import { useAuth } from '../hooks/useAffiliateAuth';
import notificationService from '../services/notificationService';
import '../styles/globals.css';
import '../styles/theme.css';
import '../styles/animations.css';

const navItems = [
  { name: 'Dashboard', href: '/dashboard/affiliate', icon: LayoutDashboard },
  { name: 'Referrals', href: '/dashboard/affiliate/referrals', icon: Users },
  { name: 'Referral Links', href: '/dashboard/affiliate/referral-links', icon: LinkIcon },
  { name: 'Earnings', href: '/dashboard/affiliate/earnings', icon: DollarSign },
  { name: 'Commission History', href: '/dashboard/affiliate/commissions', icon: FileText },
  { name: 'Payments', href: '/dashboard/affiliate/payments', icon: CreditCard },
  { name: 'Notifications', href: '/dashboard/affiliate/notifications', icon: Bell },
  { name: 'Settings', href: '/dashboard/affiliate/settings', icon: Settings },
  { name: 'Preferences', href: '/dashboard/affiliate/preferences', icon: Settings },
  { name: 'Profile', href: '/dashboard/affiliate/profile', icon: User },
];

function AffiliateNav({ collapsed, onNavigate }) {
  const location = useLocation();

  return (
    <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4 space-y-1">
      {navItems.map((item) => {
        const active = item.href === '/dashboard/affiliate'
          ? location.pathname === item.href
          : location.pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={onNavigate}
            title={collapsed ? item.name : undefined}
            className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all ${
              active
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            } ${collapsed ? 'justify-center' : ''}`}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className="truncate">{item.name}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function NotificationMenu({ notifs, unread, open, setOpen }) {
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-primary-200 hover:text-primary-600"
        aria-label="Affiliate notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <span className="text-sm font-black text-slate-900">Notifications</span>
                <Link
                  to="/dashboard/affiliate/notifications"
                  onClick={() => setOpen(false)}
                  className="text-xs font-bold text-primary-600 hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="max-h-72 overflow-y-auto custom-scrollbar">
                {notifs.length === 0 ? (
                  <p className="px-4 py-6 text-center text-xs font-semibold text-slate-400">No notifications</p>
                ) : (
                  notifs.slice(0, 6).map((n) => (
                    <div key={n.id} className={`border-b border-slate-50 px-4 py-3 text-xs ${!n.read ? 'bg-primary-50/50' : ''}`}>
                      <p className="font-bold text-slate-700">{n.message}</p>
                      <p className="mt-1 text-slate-400">{n.date ? new Date(n.date).toLocaleDateString() : ''}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

const AffiliateInner = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    notificationService.getNotifications()
      .then(setNotifs)
      .catch(() => {});
  }, [location.pathname]);

  useEffect(() => {
    setDrawerOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  const unread = notifs.filter((n) => !n.read).length;
  const activePage = navItems.find((item) => (
    item.href === '/dashboard/affiliate'
      ? location.pathname === item.href
      : location.pathname.startsWith(item.href)
  ));

  const handleLogout = () => {
    logout?.();
    navigate('/login');
  };

  return (
    <div className="h-full min-h-0 bg-slate-50 text-slate-800">
      <div className="flex h-full min-h-0 overflow-hidden">
        <aside className={`${collapsed ? 'w-[76px]' : 'w-[268px]'} hidden h-full flex-shrink-0 flex-col border-r border-slate-800 bg-slate-950 text-white transition-all duration-200 lg:flex`}>
          <div className={`flex h-[72px] items-center border-b border-white/10 px-4 ${collapsed ? 'justify-center' : 'justify-between'}`}>
            {!collapsed && (
              <button onClick={() => navigate('/dashboard/affiliate')} className="flex min-w-0 items-center gap-3 text-left">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-600 to-emerald-500 text-lg font-black text-white shadow-lg shadow-primary-500/25">
                  A
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black">Affiliate Hub</span>
                  <span className="block truncate text-[11px] font-semibold text-slate-400">{user?.name || 'Partner workspace'}</span>
                </span>
              </button>
            )}
            {collapsed && (
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-600 to-emerald-500 text-lg font-black text-white">
                A
              </span>
            )}
          </div>

          <AffiliateNav collapsed={collapsed} />

          <div className="border-t border-white/10 p-3">
            <button
              onClick={() => navigate('/dashboard')}
              className={`mb-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? 'Back to LAP' : undefined}
            >
              <ChevronLeft className="h-5 w-5" />
              {!collapsed && 'Back to LAP'}
            </button>
            <button
              onClick={handleLogout}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/15 hover:text-rose-100 ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? 'Logout' : undefined}
            >
              <LogOut className="h-5 w-5" />
              {!collapsed && 'Logout'}
            </button>
            <button
              onClick={() => setCollapsed((value) => !value)}
              className="mt-3 flex w-full items-center justify-center rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-400 transition hover:border-white/20 hover:text-white"
              aria-label={collapsed ? 'Expand affiliate sidebar' : 'Collapse affiliate sidebar'}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>
        </aside>

        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.45 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black lg:hidden"
                onClick={() => setDrawerOpen(false)}
              />
              <motion.aside
                initial={{ x: -290 }}
                animate={{ x: 0 }}
                exit={{ x: -290 }}
                transition={{ type: 'spring', damping: 24, stiffness: 220 }}
                className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-slate-950 text-white shadow-2xl lg:hidden"
              >
                <div className="flex h-[72px] items-center justify-between border-b border-white/10 px-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-600 to-emerald-500 text-lg font-black text-white">
                      A
                    </span>
                    <div>
                      <p className="text-sm font-black">Affiliate Hub</p>
                      <p className="text-[11px] font-semibold text-slate-400">{user?.name || 'Partner workspace'}</p>
                    </div>
                  </div>
                  <button onClick={() => setDrawerOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close affiliate menu">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <AffiliateNav collapsed={false} onNavigate={() => setDrawerOpen(false)} />
                <div className="border-t border-white/10 p-3">
                  <button onClick={() => navigate('/dashboard')} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white">
                    <ChevronLeft className="h-5 w-5" />
                    Back to LAP
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-[72px] flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white/90 px-4 shadow-sm backdrop-blur md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setDrawerOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm lg:hidden"
                aria-label="Open affiliate menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-xs font-black uppercase tracking-wide text-primary-600">Affiliate Dashboard</p>
                <h1 className="truncate text-lg font-black text-slate-950 md:text-xl">{activePage?.name || 'Dashboard'}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:text-slate-950 md:flex"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to LAP
              </button>
              <NotificationMenu notifs={notifs} unread={unread} open={notifOpen} setOpen={setNotifOpen} />
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 p-4 custom-scrollbar md:p-6 lg:p-8">
            {children}
          </main>
        </section>
      </div>
    </div>
  );
};

export const AffiliateShell = ({ children }) => (
  <ThemeProvider>
    <NotificationProvider>
      <AffiliateAuthProvider>
        <AffiliateInner>{children}</AffiliateInner>
      </AffiliateAuthProvider>
    </NotificationProvider>
  </ThemeProvider>
);

export default AffiliateShell;
