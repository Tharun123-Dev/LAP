// Sidebar.jsx — Fully Responsive
// Desktop: collapsible fixed sidebar
// Mobile/Tablet: full drawer with close button
import { useSelector, useDispatch } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { logout } from '../../store/authSlice'
import { NAV_ITEMS, SUPERADMIN_NAV } from '../../config/navigation'

export default function Sidebar({ collapsed, setCollapsed, onClose, mode }) {
  const role        = useSelector(s => s.auth.role) || 'employee'
  const user        = useSelector(s => s.auth.user)
  const permissions = useSelector(s => s.auth.permissions) || []
  const location    = useLocation()
  const navigate    = useNavigate()
  const dispatch    = useDispatch()
  const isDrawer    = mode === 'drawer'

  const items = (role === 'superadmin' || role === 'admin')
    ? SUPERADMIN_NAV
    : NAV_ITEMS.filter(item => {
        if (item.always) return true
        if (!item.codes?.length) return false
        return item.codes.some(code => permissions.includes(code))
      })

  const handleLogout = () => { dispatch(logout()); navigate('/login') }

  const handleNav = (path) => {
    navigate(path)
    if (isDrawer) onClose()
  }

  const isActive = path =>
    path === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(path)

  const showLabel = isDrawer || !collapsed

  return (
    <aside style={{
      width:          '100%',
      height:         '100vh',
      background:     '#1a1a2e',
      display:        'flex',
      flexDirection:  'column',
      overflow:       'hidden',
    }}>

      {/* ── Logo row ─────────────────────────────────────────────────────── */}
      <div style={{
        padding:         collapsed && !isDrawer ? '20px 0' : '18px 16px',
        borderBottom:    '1px solid rgba(255,255,255,0.08)',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  collapsed && !isDrawer ? 'center' : 'space-between',
        minHeight:       '64px',
        flexShrink:      0,
      }}>
        {showLabel && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: '16px', margin: 0 }}>LAP System</p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {role}
            </p>
          </div>
        )}

        {/* Drawer: close button | Desktop: collapse toggle */}
        {isDrawer ? (
          <button
            onClick={onClose}
            style={closeBtn}
            aria-label="Close menu"
          >
            ✕
          </button>
        ) : (
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={toggleBtn}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? '▶' : '◀'}
          </button>
        )}
      </div>

      {/* ── Nav items ────────────────────────────────────────────────────── */}
      <nav style={{
        flex:       1,
        padding:    '10px 8px',
        display:    'flex',
        flexDirection: 'column',
        gap:        '2px',
        overflowY:  'auto',
        overflowX:  'hidden',
      }}>
        {items.map(item => {
          const active = isActive(item.path)
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              title={collapsed && !isDrawer ? item.label : ''}
              style={{
                display:         'flex',
                alignItems:      'center',
                gap:             '10px',
                padding:         collapsed && !isDrawer ? '11px 0' : '11px 14px',
                justifyContent:  collapsed && !isDrawer ? 'center' : 'flex-start',
                borderRadius:    '8px',
                border:          'none',
                background:      active ? 'rgba(99,102,241,0.18)' : 'transparent',
                color:           active ? '#a5b4fc' : 'rgba(255,255,255,0.55)',
                cursor:          'pointer',
                fontSize:        '13px',
                fontWeight:      active ? 600 : 400,
                width:           '100%',
                textAlign:       'left',
                borderLeft:      active ? '3px solid #6366f1' : '3px solid transparent',
                transition:      'background 0.15s, color 0.15s',
                whiteSpace:      'nowrap',
                overflow:        'hidden',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ fontSize: '17px', flexShrink: 0 }}>{item.icon}</span>
              {showLabel && (
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* ── User + Logout ─────────────────────────────────────────────────── */}
      <div style={{
        padding:     collapsed && !isDrawer ? '12px 8px' : '12px 16px',
        borderTop:   '1px solid rgba(255,255,255,0.08)',
        flexShrink:  0,
      }}>
        {showLabel && (
          <div style={{ marginBottom: '10px' }}>
            <p style={{ color: '#fff', fontSize: '13px', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '2px 0 0', textTransform: 'capitalize' }}>
              {role}
            </p>
          </div>
        )}
        <button
          onClick={handleLogout}
          title={collapsed && !isDrawer ? 'Logout' : ''}
          style={{
            width:           '100%',
            padding:         '9px',
            background:      'rgba(239,68,68,0.15)',
            color:           '#f87171',
            border:          'none',
            borderRadius:    '8px',
            cursor:          'pointer',
            fontSize:        '13px',
            fontWeight:      500,
            display:         'flex',
            alignItems:      'center',
            justifyContent:  collapsed && !isDrawer ? 'center' : 'flex-start',
            gap:             '8px',
            transition:      'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.25)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
        >
          <span>🚪</span>
          {showLabel && 'Logout'}
        </button>
      </div>
    </aside>
  )
}

const closeBtn = {
  background:      'rgba(255,255,255,0.1)',
  border:          'none',
  borderRadius:    '6px',
  color:           '#fff',
  cursor:          'pointer',
  width:           '32px',
  height:          '32px',
  display:         'flex',
  alignItems:      'center',
  justifyContent:  'center',
  fontSize:        '14px',
  flexShrink:      0,
}

const toggleBtn = {
  background:      'rgba(255,255,255,0.08)',
  border:          'none',
  borderRadius:    '6px',
  color:           '#fff',
  cursor:          'pointer',
  width:           '28px',
  height:          '28px',
  display:         'flex',
  alignItems:      'center',
  justifyContent:  'center',
  fontSize:        '11px',
  flexShrink:      0,
}