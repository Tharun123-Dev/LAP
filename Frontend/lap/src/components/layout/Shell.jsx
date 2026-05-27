// Shell.jsx — Fully Responsive Layout
// Mobile: bottom tab bar + slide-over drawer
// Tablet: collapsible sidebar overlay
// Desktop: fixed sidebar + sticky topbar
import { useState, useEffect, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar  from './Topbar'

export const BREAKPOINTS = { mobile: 640, tablet: 1024 }

function useWindowWidth() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280)
  useEffect(() => {
    const h = () => setW(window.innerWidth)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return w
}

const SIDEBAR_W   = 230
const COLLAPSED_W = 64

export default function Shell() {
  const width       = useWindowWidth()
  const isMobile    = width <= BREAKPOINTS.mobile
  const isTablet    = width > BREAKPOINTS.mobile && width <= BREAKPOINTS.tablet
  const isDesktop   = width > BREAKPOINTS.tablet

  // Desktop: sidebar collapse state
  const [collapsed,   setCollapsed]   = useState(false)
  // Mobile/tablet: drawer open state
  const [drawerOpen,  setDrawerOpen]  = useState(false)

  // Close drawer on route change or resize to desktop
  useEffect(() => { if (isDesktop) setDrawerOpen(false) }, [isDesktop])

  const sideW = isDesktop ? (collapsed ? COLLAPSED_W : SIDEBAR_W) : SIDEBAR_W

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>

      {/* ── DESKTOP: fixed sidebar ─────────────────────────────────────────── */}
      {isDesktop && (
        <div style={{
          position:   'fixed', top: 0, left: 0,
          width:      sideW, height: '100vh',
          zIndex:     200,
          transition: 'width 0.22s ease',
          flexShrink: 0,
        }}>
          <Sidebar
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            onClose={() => {}}
            mode="desktop"
          />
        </div>
      )}

      {/* ── MOBILE / TABLET: slide-over drawer ────────────────────────────── */}
      {!isDesktop && (
        <>
          {/* Backdrop */}
          {drawerOpen && (
            <div
              onClick={() => setDrawerOpen(false)}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.45)',
                zIndex: 300,
                backdropFilter: 'blur(2px)',
              }}
            />
          )}
          {/* Drawer */}
          <div style={{
            position:   'fixed', top: 0, left: 0,
            width:      SIDEBAR_W, height: '100vh',
            zIndex:     400,
            transform:  drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.25s ease',
            boxShadow:  drawerOpen ? '4px 0 24px rgba(0,0,0,0.2)' : 'none',
          }}>
            <Sidebar
              collapsed={false}
              setCollapsed={() => {}}
              onClose={() => setDrawerOpen(false)}
              mode="drawer"
            />
          </div>
        </>
      )}

      {/* ── Right column ──────────────────────────────────────────────────── */}
      <div style={{
        marginLeft:     isDesktop ? sideW : 0,
        flex:           1,
        display:        'flex',
        flexDirection:  'column',
        height:         '100vh',
        overflow:       'hidden',
        transition:     'margin-left 0.22s ease',
        minWidth:       0,
      }}>

        {/* Sticky topbar */}
        <div style={{ position: 'sticky', top: 0, zIndex: 100, flexShrink: 0 }}>
          <Topbar onMenuClick={() => setDrawerOpen(o => !o)} isMobile={isMobile || isTablet} />
        </div>

        {/* Scrollable content */}
        <main style={{
          flex:       1,
          overflowY:  'auto',
          overflowX:  'hidden',
          background: '#f9fafb',
          padding:    isMobile ? '16px 12px 80px' : isTablet ? '20px 20px 24px' : '28px',
        }}>
          <Outlet />
        </main>

        {/* ── MOBILE: bottom tab bar ─────────────────────────────────────── */}
        {isMobile && <BottomTabBar />}
      </div>
    </div>
  )
}

// ── Bottom Tab Bar (mobile only) ──────────────────────────────────────────────
import { useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

const BOTTOM_TABS = [
  { label: 'Home',       path: '/dashboard',             icon: '🏠' },
  { label: 'Attendance', path: '/dashboard/attendance',  icon: '📅' },
  { label: 'Leave',      path: '/dashboard/leave',       icon: '🌴' },
  { label: 'More',       path: '__menu__',               icon: '☰'  },
]

function BottomTabBar() {
  const { pathname } = useLocation()
  const navigate     = useNavigate()

  return (
    <nav style={{
      position:        'fixed', bottom: 0, left: 0, right: 0,
      height:          '60px',
      background:      '#fff',
      borderTop:       '1px solid #e5e7eb',
      display:         'flex',
      alignItems:      'stretch',
      zIndex:          200,
      boxShadow:       '0 -2px 12px rgba(0,0,0,0.06)',
    }}>
      {BOTTOM_TABS.map(tab => {
        const active = tab.path !== '__menu__' && (
          tab.path === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(tab.path)
        )
        return (
          <button
            key={tab.path}
            onClick={() => tab.path !== '__menu__' && navigate(tab.path)}
            style={{
              flex:           1,
              border:         'none',
              background:     'transparent',
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            '2px',
              cursor:         'pointer',
              color:          active ? '#6366f1' : '#9ca3af',
              fontSize:       '10px',
              fontWeight:     active ? 700 : 400,
              padding:        '6px 4px',
              borderTop:      active ? '2px solid #6366f1' : '2px solid transparent',
              transition:     'color 0.15s',
            }}
          >
            <span style={{ fontSize: '18px' }}>{tab.icon}</span>
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}