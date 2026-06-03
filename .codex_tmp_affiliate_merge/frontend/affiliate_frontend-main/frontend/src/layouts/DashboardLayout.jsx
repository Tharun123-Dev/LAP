import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Users, DollarSign, CreditCard, Link as LinkIcon, 
  Bell, LogOut, Menu, X, User, Briefcase
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import notificationService from '../services/notificationService';

export const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { addNotification } = useNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [headerNotifs, setHeaderNotifs] = useState([]);
  const [headerNotifsLoading, setHeaderNotifsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const fetchHeaderNotifs = async () => {
    try {
      setHeaderNotifsLoading(true);
      const data = await notificationService.getNotifications();
      setHeaderNotifs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setHeaderNotifsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetchHeaderNotifs();
    }
  }, [location.pathname]);

  const unreadCount = headerNotifs.filter(n => !n.read).length;

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Referrals', href: '/referrals', icon: Users },
    { name: 'Referral Links', href: '/referral-links', icon: LinkIcon },
    { name: 'Earnings', href: '/earnings', icon: DollarSign },
    { name: 'Payments', href: '/payments', icon: CreditCard },
    { name: 'Profile Settings', href: '/profile', icon: User },
  ];

  const handleLogout = () => {
    logout();
    addNotification('Logged out successfully', 'info');
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-300">
      
      {/* Header / Navbar */}
      <header className="h-[70px] border-b border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-8">
          {/* Brand Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-600 to-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-primary-500/20">
              A
            </div>
            <span className="hidden md:block font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-900 via-primary-600 to-emerald-600 dark:from-white dark:via-primary-400 dark:to-emerald-400 bg-clip-text text-transparent">
              Affiliate
            </span>
          </Link>

          {/* Navigation items for Desktop */}
          <nav className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          
          <button 
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Notifications Popover Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-950 dark:hover:text-white transition-all shadow-sm relative"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                )}
              </button>
              
              <AnimatePresence>
                {notifDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setNotifDropdownOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2.5 w-80 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-xl py-2 z-30"
                    >
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <span className="font-bold text-sm">Notifications</span>
                        <Link to="/notifications" onClick={() => setNotifDropdownOpen(false)} className="text-xs text-primary-500 hover:underline font-semibold">View all</Link>
                      </div>
                      <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
                        {headerNotifsLoading ? (
                          <div className="px-4 py-3 text-center text-xs text-slate-400">Loading...</div>
                        ) : headerNotifs.length === 0 ? (
                          <div className="px-4 py-3 text-center text-xs text-slate-400">No notifications</div>
                        ) : (
                          headerNotifs.slice(0, 5).map((n) => (
                            <div 
                              key={n.id}
                              onClick={() => {
                                setNotifDropdownOpen(false);
                                navigate('/notifications');
                              }}
                              className={`px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100/50 dark:border-slate-800/50 cursor-pointer ${!n.read ? 'bg-primary-50/20' : ''}`}
                            >
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{n.message}</p>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{new Date(n.date).toLocaleDateString()}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Dropdown */}
            <div className="relative ml-1">
              <button 
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all shadow-sm"
              >
                <img 
                  src={user?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=60&q=80'} 
                  alt={user?.name} 
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span className="text-sm font-semibold pr-1.5 hidden md:block">{user?.name ? user.name.split(' ')[0] : 'Sarah'}</span>
              </button>
              
              <AnimatePresence>
                {userDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setUserDropdownOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2.5 w-52 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-xl py-2 z-30"
                    >
                      <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Signed in as</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">{user?.email}</p>
                      </div>
                      <Link 
                        to="/profile" 
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        My Profile
                      </Link>
                      <button 
                        onClick={() => {
                          setUserDropdownOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center gap-2.5 w-full text-left px-4 py-2 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Log out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

          </div>
        </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black z-40 lg:hidden"
            />
            <motion.aside 
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-64 bg-white dark:bg-slate-900 z-50 lg:hidden flex flex-col shadow-2xl border-r border-slate-200 dark:border-slate-800"
            >
              <div className="h-[70px] px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-600 to-emerald-500 flex items-center justify-center text-white font-bold">
                    A
                  </div>
                  <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
                    AffiliateSaaS
                  </span>
                </div>
                <button 
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        isActive 
                          ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400' 
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Dynamic Route Outlet wrapper */}
      <main className="flex-grow p-6 md:p-8 overflow-y-auto custom-scrollbar">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
