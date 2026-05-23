import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import NAV from '../../config/navigation'

const getPageTitle = (role, pathname) => {
  const items = NAV[role] || []
  const match = items.find((i) =>
    pathname === '/dashboard' ? i.path === '/dashboard' : pathname.startsWith(i.path) && i.path !== '/dashboard'
  )
  return match?.label || 'Dashboard'
}

export default function Topbar() {
  const role = useSelector((s) => s.auth.role) || 'employee'
  const user = useSelector((s) => s.auth.user)
  const { pathname } = useLocation()
  const title = getPageTitle(role, pathname)
  const now   = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <header style={{
      height: '64px',
      background: '#fff',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      flexShrink: 0,
    }}>
      <div>
        <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#111', margin: 0 }}>{title}</h2>
        <p style={{ fontSize: '12px', color: '#aaa', margin: 0 }}>{now}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Notification bell placeholder */}
        <button style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', width: '36px', height: '36px', cursor: 'pointer', fontSize: '16px' }}>
          🔔
        </button>

        {/* Avatar */}
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: '#1a1a2e', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: 700,
        }}>
          {user?.charAt(0)?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  )
}