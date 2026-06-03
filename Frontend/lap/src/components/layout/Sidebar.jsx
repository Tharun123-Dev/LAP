import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  Building2,
  CalendarCheck,
  FileBarChart,
  Gauge,
  Handshake,
  HelpCircle,
  KeyRound,
  ListTodo,
  LogOut,
  Settings,
  SlidersHorizontal,
  Users,
  WalletCards,
  X,
} from 'lucide-react'
import { logout } from '../../store/authSlice'
import { store } from '../../store'
import { NAV_ITEMS, SUPERADMIN_NAV } from '../../config/navigation'

const iconFallback = (label) => label?.charAt(0)?.toUpperCase() || '?'
const iconByLabel = {
  Dashboard: Gauge,
  'Affiliate Dashboard': Handshake,
  Employees: Users,
  Departments: Building2,
  Attendance: CalendarCheck,
  Leave: CalendarCheck,
  Payroll: WalletCards,
  'Support Tickets': HelpCircle,
  Reports: FileBarChart,
  'Self Reports': FileBarChart,
  Permissions: KeyRound,
  Notifications: Bell,
  Settings: Settings,
  'System Settings': SlidersHorizontal,
  Tasks: ListTodo,
}

function NavIcon({ item }) {
  const [missing, setMissing] = useState(false)
  const isImageIcon = typeof item.icon === 'string' && item.icon.startsWith('/')
  const LucideIcon = iconByLabel[item.label]

  if (missing && LucideIcon) return <LucideIcon className="h-5 w-5 flex-shrink-0" strokeWidth={2.1} />
  if (!isImageIcon && LucideIcon) return <LucideIcon className="h-5 w-5 flex-shrink-0" strokeWidth={2.1} />

  if (!isImageIcon) {
    return (
      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-white/10 text-[11px] font-black text-white">
        {item.icon || iconFallback(item.label)}
      </span>
    )
  }

  return (
    <img
      src={item.icon}
      alt=""
      className="h-5 w-5 flex-shrink-0 object-contain"
      onError={() => setMissing(true)}
    />
  )
}

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [auth, setAuth] = useState(() => store.getState().auth || {})

  useEffect(() => {
    return store.subscribe(() => setAuth(store.getState().auth || {}))
  }, [])

  const role = auth.role || 'employee'
  const user = auth.user

  const items = role === 'superadmin' || role === 'admin'
    ? SUPERADMIN_NAV
    : NAV_ITEMS

  const go = (path) => {
    navigate(path)
    onClose?.()
  }

  const handleLogout = () => {
    store.dispatch(logout())
    navigate('/login')
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-[268px] flex-shrink-0 flex-col bg-slate-950 text-white shadow-2xl transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 lg:shadow-none ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        <button onClick={() => go('/dashboard')} className="flex min-w-0 items-center gap-3 text-left">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-600 to-emerald-500 text-lg font-black shadow-lg shadow-primary-500/20">
            L
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-black">LAP System</span>
            <span className="block truncate text-[11px] font-semibold capitalize text-slate-400">{role}</span>
          </span>
        </button>
        <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden" aria-label="Close main menu">
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 custom-scrollbar">
        {items.map((item) => {
          const active = item.path === '/dashboard'
            ? location.pathname === '/dashboard'
            : location.pathname.startsWith(item.path)

          return (
            <button
              key={item.path}
              onClick={() => go(item.path)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition-all ${
                active
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <NavIcon item={item} />
              <span className="min-w-0 truncate">{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="mb-3 flex min-w-0 items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-black">
            {(user || role || 'U')?.charAt(0)?.toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{user || 'User'}</p>
            <p className="truncate text-[11px] font-semibold capitalize text-slate-400">{role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/15 hover:text-rose-100"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  )
}
