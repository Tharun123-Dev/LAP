// src/affiliate/layouts/AffiliateShell.jsx
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  ChevronDown,
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

const navSections = [
  {
    name: 'Dashboard',
    href: '/dashboard/affiliate',
    icon: LayoutDashboard,
  },
  {
    name: 'Growth',
    icon: Users,
    children: [
      { name: 'Referrals', href: '/dashboard/affiliate/referrals', icon: Users },
      { name: 'Referral Links', href: '/dashboard/affiliate/referral-links', icon: LinkIcon },
    ],
  },
  {
    name: 'Earnings',
    icon: DollarSign,
    children: [
      { name: 'Earnings Overview', href: '/dashboard/affiliate/earnings', icon: DollarSign },
      { name: 'Commission History', href: '/dashboard/affiliate/commissions', icon: FileText },
    ],
  },
  {
    name: 'Payments',
    icon: CreditCard,
    children: [
      { name: 'Payment History', href: '/dashboard/affiliate/payments', icon: CreditCard },
    ],
  },
  {
    name: 'Workspace',
    icon: Settings,
    children: [
      { name: 'Notifications', href: '/dashboard/affiliate/notifications', icon: Bell },
      { name: 'Settings', href: '/dashboard/affiliate/settings', icon: Settings },
      { name: 'Preferences', href: '/dashboard/affiliate/preferences', icon: Settings },
      { name: 'Profile', href: '/dashboard/affiliate/profile', icon: User },
    ],
  },
];

const isAffiliateRouteActive = (pathname, href) => (
  href === '/dashboard/affiliate'
    ? pathname === href
    : pathname.startsWith(href)
);

function AffiliateNav({ collapsed, onNavigate }) {
  const location = useLocation();
  const [openSections, setOpenSections] = useState(() => ({
    Growth: true,
    Earnings: true,
    Payments: true,
    Workspace: true,
  }));

  useEffect(() => {
    const next = {};
    navSections.forEach((section) => {
      if (section.children?.some((child) => isAffiliateRouteActive(location.pathname, child.href))) {
        next[section.name] = true;
      }
    });
    if (Object.keys(next).length > 0) {
      setOpenSections((current) => ({ ...current, ...next }));
    }
  }, [location.pathname]);

  const toggleSection = (name) => {
    setOpenSections((current) => ({ ...current, [name]: !current[name] }));
  };

  return (
    <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4 space-y-1">
      {navSections.map((section) => {
        const Icon = section.icon;
        const sectionActive = section.href
          ? isAffiliateRouteActive(location.pathname, section.href)
          : section.children?.some((child) => isAffiliateRouteActive(location.pathname, child.href));

        if (!section.children) {
          return (
            <Link
              key={section.href}
              to={section.href}
              onClick={onNavigate}
              title={collapsed ? section.name : undefined}
              className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all ${
                sectionActive
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="truncate">{section.name}</span>}
            </Link>
          );
        }

        const open = openSections[section.name] || sectionActive;

        return (
          <div key={section.name} className="space-y-1">
            <button
              type="button"
              onClick={() => toggleSection(section.name)}
              title={collapsed ? section.name : undefined}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition-all ${
                sectionActive
                  ? 'bg-white/10 text-white'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`}
              aria-expanded={open}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="min-w-0 flex-1 truncate">{section.name}</span>
                  <ChevronDown className={`h-4 w-4 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>

            {!collapsed && (
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-4 space-y-1 border-l border-white/10 pl-3">
                      {section.children.map((item) => {
                        const active = isAffiliateRouteActive(location.pathname, item.href);
                        const ChildIcon = item.icon;

                        return (
                          <Link
                            key={item.href}
                            to={item.href}
                            onClick={onNavigate}
                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                              active
                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                                : 'text-slate-400 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <ChildIcon className="h-4 w-4 flex-shrink-0" />
                            <span className="min-w-0 truncate">{item.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
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
  const [hoverExpanded, setHoverExpanded] = useState(false);
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
  const effectiveCollapsed = collapsed && !hoverExpanded;

  return (
    <div className="h-full min-h-0 bg-slate-50 text-slate-800">
      <div className="flex h-full min-h-0 overflow-hidden">
        <aside
          onMouseEnter={() => collapsed && setHoverExpanded(true)}
          onMouseLeave={() => setHoverExpanded(false)}
          className={`${effectiveCollapsed ? 'w-[76px]' : 'w-[268px]'} hidden h-full flex-shrink-0 flex-col border-r border-slate-800 bg-slate-950 text-white transition-all duration-200 lg:flex`}
        >
          <div className={`flex h-[72px] items-center border-b border-white/10 px-4 ${effectiveCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!effectiveCollapsed && (
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
            {effectiveCollapsed && (
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-600 to-emerald-500 text-lg font-black text-white">
                A
              </span>
            )}
          </div>

          <AffiliateNav collapsed={effectiveCollapsed} />

          <div className="border-t border-white/10 p-3">
            <button
              onClick={() => navigate('/dashboard')}
              className={`mb-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white ${effectiveCollapsed ? 'justify-center' : ''}`}
              title={effectiveCollapsed ? 'Back to LAP' : undefined}
            >
              <ChevronLeft className="h-5 w-5" />
              {!effectiveCollapsed && 'Back to LAP'}
            </button>
            <button
              onClick={handleLogout}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/15 hover:text-rose-100 ${effectiveCollapsed ? 'justify-center' : ''}`}
              title={effectiveCollapsed ? 'Logout' : undefined}
            >
              <LogOut className="h-5 w-5" />
              {!effectiveCollapsed && 'Logout'}
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
