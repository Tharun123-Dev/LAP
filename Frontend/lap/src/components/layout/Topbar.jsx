// Topbar.jsx — FULL REPLACEMENT
// ✓ button on notification: marks read + navigates to relevant page + decreases count
import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { NAV_ITEMS, SUPERADMIN_NAV } from '../../config/navigation'
import notificationsService from '../../api/services/notifications'

const TYPE_ICONS = {
  leave_applied:      '📋',
  leave_approved:     '✅',
  leave_rejected:     '❌',
  leave_cancelled:    '🚫',
  attendance_absent:  '🔴',
  regularization:     '🔄',
  payroll_processed:  '💰',
  leave_balance_low:  '⚠️',
  new_account:        '👋',
  general:            '🔔',
  policy_updated:     '⚙️',
}

// Maps notification type → route to navigate when ✓ clicked
const TYPE_ROUTE = {
  leave_applied:      '/dashboard/leave',
  leave_approved:     '/dashboard/leave',
  leave_rejected:     '/dashboard/leave',
  leave_cancelled:    '/dashboard/leave',
  attendance_absent:  '/dashboard/attendance',
  regularization:     '/dashboard/attendance',
  payroll_processed:  '/dashboard/payroll',
  leave_balance_low:  '/dashboard/leave',
  new_account:        '/dashboard/employees',
  policy_updated:     '/dashboard/settings/system',
  general:            '/dashboard/notifications',
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const getPageTitle = (role, permissions, pathname) => {
  const allItems = role === 'superadmin'
    ? SUPERADMIN_NAV
    : NAV_ITEMS.filter(item =>
        item.always || (item.codes && item.codes.some(code => permissions.includes(code)))
      )
  const match = allItems.find(i =>
    pathname === '/dashboard'
      ? i.path === '/dashboard'
      : pathname.startsWith(i.path) && i.path !== '/dashboard'
  )
  return match?.label || 'Dashboard'
}

export default function Topbar() {
  const role        = useSelector(s => s.auth.role) || 'employee'
  const user        = useSelector(s => s.auth.user)
  const permissions = useSelector(s => s.auth.permissions) || []
  const { pathname } = useLocation()
  const navigate    = useNavigate()
  const title = getPageTitle(role, permissions, pathname)
  const now   = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

  const [notifs, setNotifs] = useState([])
  const [unread, setUnread] = useState(0)
  const [open,   setOpen]   = useState(false)
  const dropRef = useRef(null)

  const fetchNotifs = async () => {
    try {
      const res = await notificationsService.getAll()
      setNotifs((res.data.notifications || []).slice(0, 10))
      setUnread(res.data.unread_count || 0)
    } catch { /* silent */ }
  }

  useEffect(() => {
    fetchNotifs()
    const id = setInterval(fetchNotifs, 60000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const h = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Mark read + navigate to relevant page + close dropdown + decrease count
  const handleMarkAndNavigate = async (notif, e) => {
    e.stopPropagation()
    // Mark read
    if (!notif.is_read) {
      try {
        await notificationsService.markRead(notif.id)
        setNotifs(p => p.map(n => n.id === notif.id ? { ...n, is_read: true } : n))
        setUnread(u => Math.max(0, u - 1))
      } catch { /* silent */ }
    }
    // Navigate to relevant page
    const route = TYPE_ROUTE[notif.type] || '/dashboard/notifications'
    setOpen(false)
    navigate(route)
  }

  const markAll = async e => {
    e.stopPropagation()
    try {
      await notificationsService.markAllRead()
      setNotifs(p => p.map(n => ({ ...n, is_read: true })))
      setUnread(0)
    } catch { /* silent */ }
  }

  return (
    <header style={{
      height: '64px', background: '#fff', borderBottom: '1px solid #e5e7eb',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px', flexShrink: 0, zIndex: 100,
    }}>
      <div>
        <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#111', margin: 0 }}>{title}</h2>
        <p style={{ fontSize: '12px', color: '#aaa', margin: 0 }}>{now}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

        {/* Bell button */}
        <div ref={dropRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              background: open ? '#f0f4ff' : '#f3f4f6',
              border: open ? '1px solid #c7d2fe' : '1px solid transparent',
              borderRadius: '8px', width: '36px', height: '36px', cursor: 'pointer',
              fontSize: '16px', position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            🔔
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: '-5px', right: '-5px',
                background: '#ef4444', color: '#fff', borderRadius: '999px',
                fontSize: '10px', fontWeight: 700, minWidth: '18px', height: '18px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 4px', border: '2px solid #fff',
              }}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {open && (
            <div style={{
              position: 'absolute', top: '44px', right: 0, width: '380px',
              background: '#fff', borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 10px 30px rgba(0,0,0,0.12)', overflow: 'hidden',
              zIndex: 300,
            }}>
              {/* Header */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#111' }}>
                  Notifications {unread > 0 && <span style={{ color: '#ef4444' }}>({unread})</span>}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {unread > 0 && (
                    <button onClick={markAll} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#4338ca', fontWeight: 500 }}>
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => { setOpen(false); navigate('/dashboard/notifications') }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#6b7280' }}>
                    See all
                  </button>
                </div>
              </div>

              {/* List */}
              <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                {notifs.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: '#aaa', fontSize: '13px' }}>No notifications</div>
                ) : notifs.map(n => (
                  <div
                    key={n.id}
                    onClick={() => handleMarkAndNavigate(n, { stopPropagation: () => {} })}
                    style={{
                      padding: '11px 14px', borderBottom: '1px solid #f9fafb',
                      display: 'flex', gap: '10px', alignItems: 'flex-start',
                      background: n.is_read ? '#fff' : '#f8f9ff',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = n.is_read ? '#f9fafb' : '#eef2ff'}
                    onMouseLeave={e => e.currentTarget.style.background = n.is_read ? '#fff' : '#f8f9ff'}
                  >
                    <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>{TYPE_ICONS[n.type] || '🔔'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: n.is_read ? 500 : 700, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {n.title}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7280', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {n.body}
                      </p>
                      <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#aaa' }}>{timeAgo(n.created_at)}</p>
                    </div>
                    {/* ✓ button — marks read AND navigates */}
                    <button
                      onClick={e => handleMarkAndNavigate(n, e)}
                      title="Mark read & go to page"
                      style={{
                        background: n.is_read ? '#f3f4f6' : '#e0e7ff',
                        border: 'none', borderRadius: '6px',
                        padding: '4px 8px', cursor: 'pointer',
                        fontSize: '12px', fontWeight: 700,
                        color: n.is_read ? '#aaa' : '#4338ca',
                        flexShrink: 0, alignSelf: 'center',
                        transition: 'background 0.15s',
                      }}
                    >
                      ✓
                    </button>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div style={{ padding: '10px 16px', borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
                <button
                  onClick={() => { setOpen(false); navigate('/dashboard/notifications') }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#4338ca', fontWeight: 500 }}
                >
                  View all notifications →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1a1a2e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
          {user?.charAt(0)?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  )
}