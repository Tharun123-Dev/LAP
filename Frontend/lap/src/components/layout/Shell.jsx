// Shell.jsx — FULL REPLACEMENT
// Sidebar fixed left, Topbar sticky top, only main content scrolls
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar  from './Topbar'

const SIDEBAR_W  = 230
const COLLAPSED_W = 64

export default function Shell() {
  const [collapsed, setCollapsed] = useState(false)
  const sideW = collapsed ? COLLAPSED_W : SIDEBAR_W

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>

      {/* ── Fixed Sidebar ─────────────────────────────── */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0,
        width: sideW,
        height: '100vh',
        zIndex: 200,
        transition: 'width 0.2s ease',
        flexShrink: 0,
      }}>
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* ── Right column (pushes right of sidebar) ────── */}
      <div style={{
        marginLeft: sideW,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        transition: 'margin-left 0.2s ease',
        minWidth: 0,
      }}>

        {/* Sticky Topbar */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          flexShrink: 0,
        }}>
          <Topbar />
        </div>

        {/* Scrollable content */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          background: '#f9fafb',
          padding: '28px',
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}