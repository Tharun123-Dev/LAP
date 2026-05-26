// Sidebar.jsx — FULL REPLACEMENT
// Fixed height sidebar with internal scroll for nav items
import { useSelector, useDispatch } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { logout } from '../../store/authSlice'
import { NAV_ITEMS, SUPERADMIN_NAV } from '../../config/navigation'

export default function Sidebar({ collapsed, setCollapsed }) {
  const role        = useSelector(s => s.auth.role) || 'employee'
  const user        = useSelector(s => s.auth.user)
  const permissions = useSelector(s => s.auth.permissions) || []
  const location    = useLocation()
  const navigate    = useNavigate()
  const dispatch    = useDispatch()

  const items = (role === 'superadmin' || role === 'admin')
    ? SUPERADMIN_NAV
    : NAV_ITEMS.filter(item => {
        if (item.always) return true
        if (!item.codes?.length) return false
        return item.codes.some(code => permissions.includes(code))
      })

  const handleLogout = () => { dispatch(logout()); navigate('/login') }

  const isActive = path =>
    path === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(path)

  return (
    <aside style={{
      width: '100%',
      height: '100vh',
      background: '#1a1a2e',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>

      {/* Logo row */}
      <div style={{
        padding: collapsed ? '20px 0' : '20px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        minHeight: '64px',
        flexShrink: 0,
      }}>
        {!collapsed && (
          <div>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: '16px', margin: 0 }}>LAP System</p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{role}</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '6px',
            color: '#fff', cursor: 'pointer', width: '28px', height: '28px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', flexShrink: 0,
          }}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Nav — scrollable if many items */}
      <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto', overflowX: 'hidden' }}>
        {items.map(item => {
          const active = isActive(item.path)
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : ''}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: collapsed ? '10px 0' : '10px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: '8px', border: 'none',
                background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                cursor: 'pointer', fontSize: '13px',
                fontWeight: active ? 600 : 400,
                width: '100%', textAlign: 'left',
                borderLeft: active ? '3px solid #6366f1' : '3px solid transparent',
                transition: 'background 0.15s, color 0.15s',
                whiteSpace: 'nowrap', overflow: 'hidden',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div style={{ padding: collapsed ? '12px 8px' : '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        {!collapsed && (
          <div style={{ marginBottom: '10px' }}>
            <p style={{ color: '#fff', fontSize: '13px', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user}</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '2px 0 0', textTransform: 'capitalize' }}>{role}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          title={collapsed ? 'Logout' : ''}
          style={{
            width: '100%', padding: '8px',
            background: 'rgba(239,68,68,0.15)', color: '#f87171',
            border: 'none', borderRadius: '8px', cursor: 'pointer',
            fontSize: '13px', fontWeight: 500,
            display: 'flex', alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start', gap: '8px',
          }}
        >
          <span>🚪</span>
          {!collapsed && 'Logout'}
        </button>
      </div>
    </aside>
  )
}