import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function Shell() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Topbar />
        <main style={{ flex: 1, background: '#f9fafb', overflowY: 'auto', padding: '28px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}