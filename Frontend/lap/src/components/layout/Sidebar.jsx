// Sidebar.jsx — Fully Responsive
// Desktop: collapsible fixed sidebar
// Mobile/Tablet: full drawer with close button
import { useSelector, useDispatch } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { logout } from '../../store/authSlice'
import { NAV_ITEMS, SUPERADMIN_NAV } from '../../config/navigation'

// ── Sidebar image icon paths (place PNGs in /public/icons/) ─────────────────
// Each nav item in NAV_ITEMS / SUPERADMIN_NAV should have an `icon` field
// pointing to one of these paths, e.g. icon: '/icons/dashboard.png'
// If your nav config still uses emoji strings, replace them with these paths:
//
//   '/icons/dashboard.png'
//   '/icons/employees.png'
//   '/icons/departments.png'
//   '/icons/attendance.png'
//   '/icons/leave.png'
//   '/icons/payroll.png'
//   '/icons/permissions.png'
//   '/icons/reports.png'
//   '/icons/settings.png'
//
// Recommended icon size: 48×48px or 64×64px, transparent PNG background
// Sources: icons8.com, flaticon.com, heroicons.dev

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

  // Icon size: bigger in drawer/expanded, smaller when collapsed
  const iconSize  = collapsed && !isDrawer ? '22px' : '20px'
  const navPadH   = collapsed && !isDrawer ? '13px 0' : '13px 16px'

  return (
    <aside style={{
      width:         '100%',
      height:        '100vh',
      background:    '#1a1a2e',
      display:       'flex',
      flexDirection: 'column',
      overflow:      'hidden',
    }}>

      {/* ── Logo row ─────────────────────────────────────────────────────── */}
      <div style={{
        padding:        collapsed && !isDrawer ? '22px 0' : '20px 18px',
        borderBottom:   '1px solid rgba(255,255,255,0.08)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: collapsed && !isDrawer ? 'center' : 'space-between',
        minHeight:      '70px',
        flexShrink:     0,
      }}>
        {showLabel && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
            {/* Logo image — place your logo at /icons/logo.png */}
            <img
              src="/icons/logo.png"
              alt="Logo"
              style={{ width: '32px', height: '32px', objectFit: 'contain', flexShrink: 0 }}
              onError={e => { e.currentTarget.style.display = 'none' }}
            />
            <div>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: '16px', margin: 0 }}>LAP System</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {role}
              </p>
            </div>
          </div>
        )}

        {/* Collapsed: show only small logo icon */}
        {!showLabel && (
          <img
            src="/icons/logo.png"
            alt="Logo"
            style={{ width: '28px', height: '28px', objectFit: 'contain' }}
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
        )}

        {/* Drawer: close button | Desktop: collapse toggle */}
        {isDrawer ? (
          <button onClick={onClose} style={closeBtn} aria-label="Close menu">✕</button>
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
        flex:          1,
        padding:       '12px 8px',
        display:       'flex',
        flexDirection: 'column',
        gap:           '3px',
        overflowY:     'auto',
        overflowX:     'hidden',
      }}>
        {items.map(item => {
          const active = isActive(item.path)
          // Support both image path strings and legacy emoji strings
          const isImgPath = typeof item.icon === 'string' && item.icon.startsWith('/')

          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              title={collapsed && !isDrawer ? item.label : ''}
              style={{
                display:        'flex',
                alignItems:     'center',
                gap:            '12px',
                padding:        navPadH,
                justifyContent: collapsed && !isDrawer ? 'center' : 'flex-start',
                borderRadius:   '10px',
                border:         'none',
                background:     active ? 'rgba(99,102,241,0.18)' : 'transparent',
                color:          active ? '#a5b4fc' : 'rgba(255,255,255,0.55)',
                cursor:         'pointer',
                fontSize:       '13px',
                fontWeight:     active ? 600 : 400,
                width:          '100%',
                textAlign:      'left',
                borderLeft:     active ? '3px solid #6366f1' : '3px solid transparent',
                transition:     'background 0.15s, color 0.15s',
                whiteSpace:     'nowrap',
                overflow:       'hidden',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              {/* Icon: image if path, emoji fallback */}
              {isImgPath ? (
                <img
                  src={item.icon}
                  alt=""
                  style={{
                    width:      iconSize,
                    height:     iconSize,
                    objectFit:  'contain',
                    flexShrink: 0,
                    // Tint active items to indigo; inactive to soft white
                    filter:     active
                      ? 'invert(71%) sepia(50%) saturate(500%) hue-rotate(200deg) brightness(105%)'
                      : 'invert(1) brightness(0.55)',
                    transition: 'filter 0.15s',
                  }}
                  onError={e => { e.currentTarget.style.display = 'none' }}
                />
              ) : (
                <span style={{ fontSize: iconSize, flexShrink: 0, lineHeight: 1 }}>{item.icon}</span>
              )}

              {showLabel && (
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '13px' }}>
                  {item.label}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* ── User + Logout ─────────────────────────────────────────────────── */}
      <div style={{
        padding:    collapsed && !isDrawer ? '14px 8px' : '14px 16px',
        borderTop:  '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
      }}>
        {showLabel && (
          <div style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '10px',
            marginBottom: '12px',
          }}>
            {/* User avatar circle */}
            <div style={{
              width:           '36px',
              height:          '36px',
              borderRadius:    '50%',
              background:      'linear-gradient(135deg,#6366f1,#4f46e5)',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              fontSize:        '14px',
              fontWeight:      700,
              color:           '#fff',
              flexShrink:      0,
            }}>
              {user?.[0]?.toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ color: '#fff', fontSize: '13px', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '2px 0 0', textTransform: 'capitalize' }}>
                {role}
              </p>
            </div>
          </div>
        )}

        {/* Collapsed: just show avatar */}
        {!showLabel && (
          <div style={{
            width:          '36px',
            height:         '36px',
            borderRadius:   '50%',
            background:     'linear-gradient(135deg,#6366f1,#4f46e5)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       '14px',
            fontWeight:     700,
            color:          '#fff',
            margin:         '0 auto 10px',
          }}>
            {user?.[0]?.toUpperCase()}
          </div>
        )}

        <button
          onClick={handleLogout}
          title={collapsed && !isDrawer ? 'Logout' : ''}
          style={{
            width:          '100%',
            padding:        '10px',
            background:     'rgba(239,68,68,0.15)',
            color:          '#f87171',
            border:         'none',
            borderRadius:   '8px',
            cursor:         'pointer',
            fontSize:       '13px',
            fontWeight:     500,
            display:        'flex',
            alignItems:     'center',
            justifyContent: collapsed && !isDrawer ? 'center' : 'flex-start',
            gap:            '10px',
            transition:     'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.25)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
        >
          {/* Logout icon image */}
          <img
            src="/icons/logout.png"
            alt="Logout"
            style={{ width: '18px', height: '18px', objectFit: 'contain', flexShrink: 0, filter: 'invert(60%) sepia(80%) saturate(500%) hue-rotate(310deg)' }}
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
          {showLabel && 'Logout'}
        </button>
      </div>
    </aside>
  )
}

const closeBtn = {
  background:     'rgba(255,255,255,0.1)',
  border:         'none',
  borderRadius:   '6px',
  color:          '#fff',
  cursor:         'pointer',
  width:          '34px',
  height:         '34px',
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'center',
  fontSize:       '14px',
  flexShrink:     0,
}

const toggleBtn = {
  background:     'rgba(255,255,255,0.08)',
  border:         'none',
  borderRadius:   '6px',
  color:          '#fff',
  cursor:         'pointer',
  width:          '30px',
  height:         '30px',
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'center',
  fontSize:       '11px',
  flexShrink:     0,
}