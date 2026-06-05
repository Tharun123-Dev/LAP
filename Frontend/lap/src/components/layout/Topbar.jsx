import { Menu } from 'lucide-react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { NAV_ITEMS } from '../../config/navigation'

export default function Topbar({ onMenuClick }) {
  const location = useLocation()
  const role = useSelector((s) => s.auth.role) || 'employee'
  const permissions = useSelector((s) => s.auth.permissions) || []
  const user = useSelector((s) => s.auth.user)

  const items = NAV_ITEMS.filter((item) => item.always || item.codes?.some((code) => permissions.includes(code)))

  const title = items.find((item) => (
    item.path === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(item.path)
  ))?.label || 'Dashboard'

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white/90 px-4 shadow-sm backdrop-blur md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-primary-200 hover:text-primary-600 lg:hidden"
          aria-label="Open main menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">LAP System</p>
          <h1 className="truncate text-lg font-black text-slate-950">{title}</h1>
        </div>
      </div>
      <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600">
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs text-white">
          {(user || role || 'U')?.charAt(0)?.toUpperCase()}
        </span>
        <span className="hidden max-w-[160px] truncate sm:block">{user || role}</span>
      </div>
    </header>
  )
}
