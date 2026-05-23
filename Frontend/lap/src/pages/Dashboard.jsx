import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import usePermission from '../hooks/usePermission'

const CARDS = {
  superadmin: [
    { label: 'Employees',   path: '/dashboard/employees',   icon: '👥', color: '#6366f1', desc: 'Manage all employees' },
    { label: 'Departments', path: '/dashboard/departments', icon: '🏢', color: '#0ea5e9', desc: 'Org structure' },
    { label: 'Attendance',  path: '/dashboard/attendance',  icon: '📅', color: '#10b981', desc: 'Track attendance' },
    { label: 'Leave',       path: '/dashboard/leave',       icon: '🌴', color: '#f59e0b', desc: 'Leave requests' },
    { label: 'Payroll',     path: '/dashboard/payroll',     icon: '💰', color: '#ef4444', desc: 'Process payroll' },
    { label: 'Reports',     path: '/dashboard/reports',     icon: '📊', color: '#8b5cf6', desc: 'Analytics & exports' },
    { label: 'Permissions', path: '/dashboard/permissions', icon: '🔐', color: '#374151', desc: 'Role access control' },
  ],
  admin: [
    { label: 'Employees',   path: '/dashboard/employees',   icon: '👥', color: '#6366f1', desc: 'Manage all employees' },
    { label: 'Departments', path: '/dashboard/departments', icon: '🏢', color: '#0ea5e9', desc: 'Org structure' },
    { label: 'Attendance',  path: '/dashboard/attendance',  icon: '📅', color: '#10b981', desc: 'Track attendance' },
    { label: 'Leave',       path: '/dashboard/leave',       icon: '🌴', color: '#f59e0b', desc: 'Leave requests' },
    { label: 'Payroll',     path: '/dashboard/payroll',     icon: '💰', color: '#ef4444', desc: 'Process payroll' },
    { label: 'Reports',     path: '/dashboard/reports',     icon: '📊', color: '#8b5cf6', desc: 'Analytics & exports' },
    { label: 'Permissions', path: '/dashboard/permissions', icon: '🔐', color: '#374151', desc: 'Role access control' },
  ],
  manager: [
    { label: 'My Team',        path: '/dashboard/employees',  icon: '👥', color: '#6366f1', desc: 'Your team members' },
    { label: 'Attendance',     path: '/dashboard/attendance', icon: '📅', color: '#10b981', desc: 'Team attendance' },
    { label: 'Leave Approvals',path: '/dashboard/leave',      icon: '🌴', color: '#f59e0b', desc: 'Pending approvals' },
    { label: 'Reports',        path: '/dashboard/reports',    icon: '📊', color: '#8b5cf6', desc: 'Team reports' },
  ],
  hr: [
    { label: 'Employees',  path: '/dashboard/employees',  icon: '👥', color: '#6366f1', desc: 'Manage employees' },
    { label: 'Attendance', path: '/dashboard/attendance', icon: '📅', color: '#10b981', desc: 'Attendance records' },
    { label: 'Leave',      path: '/dashboard/leave',      icon: '🌴', color: '#f59e0b', desc: 'All leave requests' },
    { label: 'Payroll',    path: '/dashboard/payroll',    icon: '💰', color: '#ef4444', desc: 'Payroll assist' },
    { label: 'Reports',    path: '/dashboard/reports',    icon: '📊', color: '#8b5cf6', desc: 'HR reports' },
  ],
  employee: [
    { label: 'Attendance', path: '/dashboard/attendance', icon: '📅', color: '#10b981', desc: 'Check in / out' },
    { label: 'My Leave',   path: '/dashboard/leave',      icon: '🌴', color: '#f59e0b', desc: 'Apply & track leave' },
    { label: 'My Payslip', path: '/dashboard/payslip',    icon: '🧾', color: '#6366f1', desc: 'Download payslips' },
  ],
}

export default function Dashboard() {
  const role     = useSelector((s) => s.auth.role) || 'employee'
  const user     = useSelector((s) => s.auth.user)
  const navigate = useNavigate()
  const { can }  = usePermission()
  const cards    = CARDS[role] || CARDS.employee

  return (
    <div>
      {/* Welcome banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        borderRadius: '14px', padding: '28px 32px',
        marginBottom: '28px', color: '#fff',
      }}>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>
          Welcome back, {user} 👋
        </h2>
        <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '14px', textTransform: 'capitalize' }}>
          {role} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Quick access cards */}
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 16px' }}>
        Quick Access
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px',
      }}>
        {cards.map((card) => (
          <button
            key={card.path}
            onClick={() => navigate(card.path)}
            style={{
              background: '#fff', border: '1px solid #e5e7eb',
              borderRadius: '12px', padding: '22px 20px',
              cursor: 'pointer', textAlign: 'left',
              transition: 'all 0.15s', display: 'flex',
              flexDirection: 'column', gap: '10px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'
              e.currentTarget.style.borderColor = card.color
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.borderColor = '#e5e7eb'
            }}
          >
            <div style={{
              width: '42px', height: '42px', borderRadius: '10px',
              background: card.color + '18',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '20px',
            }}>
              {card.icon}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#111' }}>{card.label}</p>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#aaa' }}>{card.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Coming soon placeholder for stats */}
      <div style={{
        marginTop: '28px', background: '#fff', borderRadius: '12px',
        border: '1px solid #e5e7eb', padding: '24px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '120px',
      }}>
        <p style={{ color: '#ccc', fontSize: '14px', margin: 0 }}>
          📈 Stats & charts will load here in Phase 6 (Reports)
        </p>
      </div>
    </div>
  )
}