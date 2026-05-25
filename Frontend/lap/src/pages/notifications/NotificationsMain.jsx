import { useState, useEffect } from 'react'
import notificationsService from '../../api/services/notifications'

const TYPE_ICONS = {
  leave_applied: '📋',
  leave_approved: '✅',
  leave_rejected: '❌',
  leave_cancelled: '🚫',
  attendance_absent: '🔴',
  regularization: '🔄',
  payroll_processed: '💰',
  leave_balance_low: '⚠️',
  new_account: '👋',
  general: '🔔',
}

const TYPE_COLORS = {
  leave_applied: '#3b82f6',
  leave_approved: '#22c55e',
  leave_rejected: '#ef4444',
  leave_cancelled: '#6b7280',
  attendance_absent: '#ef4444',
  regularization: '#f59e0b',
  payroll_processed: '#8b5cf6',
  leave_balance_low: '#f59e0b',
  new_account: '#06b6d4',
  general: '#6b7280',
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all | unread

  const load = async () => {
    try {
      setLoading(true)
      const res = await notificationsService.getAll()
      setNotifications(res.data.notifications || [])
      setUnread(res.data.unread_count || 0)
    } catch {
      /* silent */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleMarkRead = async id => {
    await notificationsService.markRead(id)
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)))
    setUnread(u => Math.max(0, u - 1))
  }

  const handleMarkAllRead = async () => {
    await notificationsService.markAllRead()
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnread(0)
  }

  const handleDelete = async id => {
    const notif = notifications.find(n => n.id === id)
    await notificationsService.delete(id)
    setNotifications(prev => prev.filter(n => n.id !== id))
    if (notif && !notif.is_read) setUnread(u => Math.max(0, u - 1))
  }

  const filtered = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#111' }}>
            Notifications
            {unread > 0 && (
              <span
                style={{
                  marginLeft: '10px',
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: '999px',
                  fontSize: '12px',
                  padding: '2px 8px',
                  fontWeight: 600,
                }}
              >
                {unread} unread
              </span>
            )}
          </h2>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: '13px' }}>
            Your latest activity and system alerts
          </p>
        </div>

        {unread > 0 && (
          <button
            onClick={handleMarkAllRead}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              background: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
              color: '#374151',
              fontWeight: 500,
            }}
          >
            ✓ Mark all read
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['all', 'unread'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              background: filter === f ? '#1a1a2e' : '#f3f4f6',
              color: filter === f ? '#fff' : '#6b7280',
            }}
          >
            {f === 'all' ? `All (${notifications.length})` : `Unread (${unread})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#aaa', fontSize: '14px' }}>
          Loading notifications...
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px',
            color: '#aaa',
            background: '#fafafa',
            borderRadius: '12px',
            border: '1px dashed #e5e7eb',
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔔</div>
          <p style={{ margin: 0, fontSize: '14px' }}>
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(notif => (
            <div
              key={notif.id}
              style={{
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start',
                padding: '14px 16px',
                borderRadius: '10px',
                background: notif.is_read ? '#fff' : '#f0f4ff',
                border: `1px solid ${notif.is_read ? '#e5e7eb' : '#c7d2fe'}`,
                transition: 'background 0.2s',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: `${TYPE_COLORS[notif.type] || '#6b7280'}18`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                }}
              >
                {TYPE_ICONS[notif.type] || '🔔'}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '14px',
                      fontWeight: notif.is_read ? 500 : 700,
                      color: '#111',
                      lineHeight: 1.3,
                    }}
                  >
                    {notif.title}
                  </p>
                  <span style={{ fontSize: '11px', color: '#aaa', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {timeAgo(notif.created_at)}
                  </span>
                </div>

                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: '13px',
                    color: '#555',
                    whiteSpace: 'pre-line',
                    lineHeight: '1.5',
                  }}
                >
                  {notif.body}
                </p>

                {(notif.type === 'leave_approved' || notif.type === 'leave_rejected') && (
                  <div
                    style={{
                      display: 'inline-block',
                      marginTop: '6px',
                      fontSize: '11px',
                      background: notif.type === 'leave_approved' ? '#d1fae5' : '#fee2e2',
                      color: notif.type === 'leave_approved' ? '#065f46' : '#991b1b',
                      padding: '2px 10px',
                      borderRadius: '20px',
                      fontWeight: 600,
                    }}
                  >
                    {notif.type === 'leave_approved' ? '✓ Approved' : '✗ Rejected'}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                {!notif.is_read && (
                  <button
                    onClick={() => handleMarkRead(notif.id)}
                    title="Mark as read"
                    style={{
                      background: '#e0e7ff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: '#4338ca',
                    }}
                  >
                    ✓
                  </button>
                )}
                <button
                  onClick={() => handleDelete(notif.id)}
                  title="Delete"
                  style={{
                    background: '#fee2e2',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: '#dc2626',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}