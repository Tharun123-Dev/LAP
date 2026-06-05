// Dashboard.jsx — Fully Responsive (sizes increased 30-50%, image icons throughout)
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import usePermission from '../hooks/usePermission'
import { getDashboardStatsApi } from '../api/services/payroll'

// ── Responsive hook ───────────────────────────────────────────────────────────
function useWindowWidth() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280)
  useEffect(() => {
    const h = () => setW(window.innerWidth)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return w
}

const MONTH_NAMES = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTH_FULL  = ['','January','February','March','April','May','June','July','August','September','October','November','December']

const fmt  = v => `₹${parseFloat(v||0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`
const fmt2 = v => `₹${parseFloat(v||0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

// ── Image icon paths — place these PNGs in /public/icons/ ────────────────────
// Recommended: 48×48px or 64×64px, transparent background
// Sources: icons8.com · flaticon.com · heroicons.dev
const ICONS = {
  employees:     '/icons/employees.png',
  departments:   '/icons/departments.png',
  attendance:    '/icons/attendance.png',
  leave:         '/icons/leave.png',
  payroll:       '/icons/payroll.png',
  reports:       '/icons/reports.png',
  permissions:   '/icons/permissions.png',
  myTeam:        '/icons/my-team.png',
  myPayslip:     '/icons/my-payslip.png',
  today:         '/icons/today.png',
  leaveLeft:     '/icons/leave-left.png',
  checkedIn:     '/icons/checked-in.png',
  pendingLeaves: '/icons/pending-leaves.png',
  absent:        '/icons/absent.png',
  teamSize:      '/icons/team-size.png',
  gross:         '/icons/payroll.png',
  pf:            '/icons/permissions.png',
  tds:           '/icons/my-payslip.png',
  deductions:    '/icons/leave-left.png',
  netPay:        '/icons/checked-in.png',
}

const CARDS = {
  superadmin: [
    { label: 'Employees',   path: '/dashboard/employees',   icon: ICONS.employees,   color: '#6366f1', codes: ['view_employees', 'create_employee'] },
    { label: 'Departments', path: '/dashboard/departments', icon: ICONS.departments, color: '#0ea5e9', codes: ['view_departments', 'create_department'] },
    { label: 'Attendance',  path: '/dashboard/attendance',  icon: ICONS.attendance,  color: '#10b981', codes: ['view_attendance', 'view_team_attendance'] },
    { label: 'Leave',       path: '/dashboard/leave',       icon: ICONS.leave,       color: '#f59e0b', codes: ['view_leave', 'apply_leave', 'approve_leave', 'view_all_leave'] },
    { label: 'Payroll',     path: '/dashboard/payroll',     icon: ICONS.payroll,     color: '#ef4444', codes: ['view_payslip', 'view_payroll', 'process_payroll'] },
    { label: 'Reports',     path: '/dashboard/reports',     icon: ICONS.reports,     color: '#14b8a6', codes: ['view_reports', 'self_reports'] },
    { label: 'Permissions', path: '/dashboard/permissions', icon: ICONS.permissions, color: '#374151', codes: ['manage_permissions'] },
  ],
  admin: [
    { label: 'Employees',   path: '/dashboard/employees',   icon: ICONS.employees,   color: '#6366f1', codes: ['view_employees', 'create_employee'] },
    { label: 'Departments', path: '/dashboard/departments', icon: ICONS.departments, color: '#0ea5e9', codes: ['view_departments', 'create_department'] },
    { label: 'Attendance',  path: '/dashboard/attendance',  icon: ICONS.attendance,  color: '#10b981', codes: ['view_attendance', 'view_team_attendance'] },
    { label: 'Leave',       path: '/dashboard/leave',       icon: ICONS.leave,       color: '#f59e0b', codes: ['view_leave', 'apply_leave', 'approve_leave', 'view_all_leave'] },
    { label: 'Payroll',     path: '/dashboard/payroll',     icon: ICONS.payroll,     color: '#ef4444', codes: ['view_payslip', 'view_payroll', 'process_payroll'] },
    { label: 'Reports',     path: '/dashboard/reports',     icon: ICONS.reports,     color: '#14b8a6', codes: ['view_reports', 'self_reports'] },
    { label: 'Permissions', path: '/dashboard/permissions', icon: ICONS.permissions, color: '#374151', codes: ['manage_permissions'] },
  ],
  manager: [
    { label: 'My Team',    path: '/dashboard/employees',  icon: ICONS.myTeam,     color: '#6366f1', codes: ['view_employees', 'create_employee'] },
    { label: 'Attendance', path: '/dashboard/attendance', icon: ICONS.attendance, color: '#10b981', codes: ['view_attendance', 'view_team_attendance'] },
    { label: 'Leave',      path: '/dashboard/leave',      icon: ICONS.leave,      color: '#f59e0b', codes: ['view_leave', 'apply_leave', 'approve_leave', 'view_all_leave'] },
    { label: 'Reports',    path: '/dashboard/reports',    icon: ICONS.reports,    color: '#14b8a6', codes: ['view_reports', 'self_reports'] },
  ],
  hr: [
    { label: 'Employees',  path: '/dashboard/employees',  icon: ICONS.employees,  color: '#6366f1', codes: ['view_employees', 'create_employee'] },
    { label: 'Attendance', path: '/dashboard/attendance', icon: ICONS.attendance, color: '#10b981', codes: ['view_attendance', 'view_team_attendance'] },
    { label: 'Leave',      path: '/dashboard/leave',      icon: ICONS.leave,      color: '#f59e0b', codes: ['view_leave', 'apply_leave', 'approve_leave', 'view_all_leave'] },
    { label: 'Payroll',    path: '/dashboard/payroll',    icon: ICONS.payroll,    color: '#ef4444', codes: ['view_payslip', 'view_payroll', 'process_payroll'] },
    { label: 'Reports',    path: '/dashboard/reports',    icon: ICONS.reports,    color: '#14b8a6', codes: ['view_reports', 'self_reports'] },
  ],
  employee: [
    { label: 'Attendance', path: '/dashboard/attendance', icon: ICONS.attendance, color: '#10b981', codes: ['view_attendance'] },
    { label: 'My Leave',   path: '/dashboard/leave',      icon: ICONS.leave,      color: '#f59e0b', codes: ['view_leave', 'apply_leave'] },
    { label: 'My Payslip', path: '/dashboard/payroll',    icon: ICONS.myPayslip,  color: '#6366f1', codes: ['view_payslip'] },
    { label: 'My Reports', path: '/dashboard/reports',    icon: ICONS.reports,    color: '#14b8a6', codes: ['self_reports'] },
  ],
}

const DASHBOARD_PERMISSIONS = {
  employees:   ['view_employees', 'create_employee'],
  departments: ['view_departments', 'create_department'],
  attendance:  ['view_attendance', 'view_team_attendance'],
  leave:       ['view_leave', 'apply_leave', 'approve_leave', 'view_all_leave'],
  payroll:     ['view_payslip', 'view_payroll', 'process_payroll'],
  reports:     ['view_reports', 'self_reports'],
  payslip:     ['view_payslip'],
}

export default function Dashboard() {
  const role     = useSelector(s => s.auth.role) || 'employee'
  const user     = useSelector(s => s.auth.user)
  const navigate = useNavigate()
  const { can, canAny }  = usePermission()
  const cards    = Object.values(CARDS)
    .flat()
    .filter((card, index, allCards) => allCards.findIndex((item) => item.path === card.path && item.label === card.label) === index)
    .filter(card => !card.codes?.length || canAny(card.codes))
  const width    = useWindowWidth()
  const isMobile = width <= 640

  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getDashboardStatsApi()
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const dateStr = new Date().toLocaleDateString(undefined, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  // ~40% bigger card min-width vs original 140/150px
  const cardMinW = isMobile ? '190px' : '210px'

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: '1200px' }}>

      {/* ── Welcome Banner ───────────────────────────────────────────────── */}
      <div style={{
        background:   'linear-gradient(135deg,#1a1a2e,#16213e)',
        borderRadius: '16px',
        padding:      isMobile ? '22px 18px' : '30px 32px',
        marginBottom: '24px',
        color:        '#fff',
      }}>
        <h2 style={{ margin: 0, fontSize: isMobile ? '18px' : '24px', fontWeight: 700 }}>
          Welcome back, {user} 👋
        </h2>
        <p style={{ margin: '5px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '13px', textTransform: 'capitalize' }}>
          {role} · {dateStr}
        </p>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      {!loading && stats && (
        <>
          {stats.scope === 'company' && <AdminStats stats={stats} navigate={navigate} isMobile={isMobile} canAny={canAny} />}
          {stats.scope === 'team' && <ManagerStats stats={stats} navigate={navigate} isMobile={isMobile} canAny={canAny} />}
          {(!stats.scope || stats.scope === 'personal') && <EmployeeStats stats={stats} navigate={navigate} isMobile={isMobile} can={can} canAny={canAny} />}
        </>
      )}

      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${cardMinW}, 1fr))`, gap: '12px', marginBottom: '24px' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ height: '100px', background: '#f3f4f6', borderRadius: '14px', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      )}

      {/* ── Quick Access ─────────────────────────────────────────────────── */}
      <p style={{ margin: '24px 0 12px', fontSize: '12px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Quick Access
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${cardMinW}, 1fr))`, gap: '14px' }}>
        {cards.map(card => (
          <button
            key={card.path}
            onClick={() => navigate(card.path)}
            style={{
              background:    '#fff',
              border:        '1px solid #e5e7eb',
              borderRadius:  '16px',
              padding:       isMobile ? '18px 16px' : '24px 20px',
              cursor:        'pointer',
              textAlign:     'left',
              display:       'flex',
              flexDirection: 'column',
              gap:           '12px',
              transition:    'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform   = 'translateY(-3px)'
              e.currentTarget.style.borderColor = card.color
              e.currentTarget.style.boxShadow   = '0 8px 24px rgba(0,0,0,0.10)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform   = 'translateY(0)'
              e.currentTarget.style.borderColor = '#e5e7eb'
              e.currentTarget.style.boxShadow   = 'none'
            }}
          >
            {/* ── Image icon ── */}
            <div style={{
              width:          '52px',
              height:         '52px',
              borderRadius:   '13px',
              background:     card.color + '18',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
            }}>
              <img
                src={card.icon}
                alt={card.label}
                style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                onError={e => { e.currentTarget.style.display = 'none' }}
              />
            </div>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#111' }}>{card.label}</p>
          </button>
        ))}
      </div>

      {/* ── Deduction sections ───────────────────────────────────────────── */}
      {can('view_payslip') && (
        <DeductionHistorySection isMobile={isMobile} />
      )}
      {canAny(['view_payroll', 'process_payroll']) && (
        <AdminDeductionSection isMobile={isMobile} />
      )}
    </div>
  )
}

// ── Employee Stats ────────────────────────────────────────────────────────────
function EmployeeStats({ stats, navigate, isMobile, can, canAny }) {
  const att = stats.attendance   || {}
  const pay = stats.last_payslip || {}
  const lv  = stats.leave        || {}
  const showAttendance = canAny(DASHBOARD_PERMISSIONS.attendance)
  const showLeave      = canAny(DASHBOARD_PERMISSIONS.leave)
  const showPayslip    = can(DASHBOARD_PERMISSIONS.payslip[0])

  const STATUS_COLOR = {
    present: '#16a34a', late: '#d97706', half_day: '#b45309',
    absent: '#dc2626', leave: '#7c3aed', not_started: '#9ca3af',
  }
  const todayColor = STATUS_COLOR[att.today_status] || '#9ca3af'

  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? '180px' : '200px'}, 1fr))`, gap: '12px', marginBottom: '14px' }}>
        {showAttendance && (
          <StatCard icon={ICONS.today}     label="Today"
            value={att.today_status?.replace('_',' ') || 'Not started'}
            sub={att.today_checked_in ? (att.today_checked_out ? 'Day complete' : 'Checked in') : 'Not checked in'}
            color={todayColor} onClick={() => navigate('/dashboard/attendance')}
          />
        )}
        {showAttendance && (
          <StatCard icon={ICONS.attendance} label="This Month"
            value={`${att.present_this_month || 0} days`}
            sub={`${att.lop_this_month || 0} LOP`}
            color="#10b981" onClick={() => navigate('/dashboard/attendance')}
          />
        )}
        {showLeave && (
          <StatCard icon={ICONS.leaveLeft} label="Leave Left"
            value={`${lv.balances?.reduce((s,b) => s + b.remaining, 0).toFixed(0) || 0} days`}
            sub={`${lv.pending_requests || 0} pending`}
            color="#f59e0b" onClick={() => navigate('/dashboard/leave')}
          />
        )}
        {showPayslip && (
          <StatCard icon={ICONS.myPayslip} label={pay.month ? `${MONTH_NAMES[pay.month]} ${pay.year}` : 'Payslip'}
            value={fmt(pay.net_pay)}
            sub={pay.lop_days > 0 ? `${pay.lop_days} LOP deducted` : 'No LOP'}
            color={pay.lop_days > 0 ? '#dc2626' : '#6366f1'}
            onClick={() => navigate('/dashboard/payroll')}
          />
        )}
      </div>

      {showPayslip && pay.month && (
        <div style={cardBox}>
          <SectionHeader
            title={`${MONTH_FULL[pay.month]} ${pay.year} — Deduction Breakdown`}
            action="View all payslips →"
            onAction={() => navigate('/dashboard/payroll')}
          />
          <MiniGrid items={[
            { label: 'Gross',        value: pay.gross,            color: '#1d4ed8', icon: ICONS.gross },
            { label: 'PF',           value: pay.pf,               color: '#7c3aed', icon: ICONS.pf },
            { label: 'TDS',          value: pay.tds,              color: '#dc2626', icon: ICONS.tds },
            { label: 'LOP',          value: pay.lop_deduction,    color: '#f59e0b', icon: ICONS.absent },
            { label: 'Total Deduct', value: pay.total_deductions, color: '#ef4444', icon: ICONS.deductions },
            { label: 'Net Pay',      value: pay.net_pay,          color: '#16a34a', icon: ICONS.netPay },
          ]} isMobile={isMobile} />
        </div>
      )}
    </div>
  )
}

// ── Admin Stats ───────────────────────────────────────────────────────────────
function AdminStats({ stats, navigate, isMobile, canAny }) {
  const hc  = stats.headcount    || {}
  const pay = stats.last_payroll || {}
  const showEmployees   = canAny(DASHBOARD_PERMISSIONS.employees)
  const showDepartments = canAny(DASHBOARD_PERMISSIONS.departments)
  const showAttendance  = canAny(DASHBOARD_PERMISSIONS.attendance)
  const showLeave       = canAny(DASHBOARD_PERMISSIONS.leave)
  const showPayroll     = canAny(['view_payroll', 'process_payroll'])

  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? '180px' : '200px'}, 1fr))`, gap: '12px', marginBottom: '14px' }}>
        {showEmployees && <StatCard icon={ICONS.employees}     label="Total Employees"  value={hc.total_employees || 0}    sub="Active"          color="#6366f1" onClick={() => navigate('/dashboard/employees')} />}
        {showAttendance && <StatCard icon={ICONS.checkedIn}     label="Checked In Today" value={hc.checked_in_today || 0}  sub="Today"           color="#10b981" onClick={() => navigate('/dashboard/attendance')} />}
        {showLeave && <StatCard icon={ICONS.pendingLeaves} label="Pending Leaves"   value={hc.pending_leaves || 0}    sub="Awaiting action" color="#f59e0b" onClick={() => navigate('/dashboard/leave')} />}
        {showDepartments && <StatCard icon={ICONS.departments}   label="Departments"      value={hc.total_departments || 0} sub="Active"          color="#0ea5e9" onClick={() => navigate('/dashboard/departments')} />}
      </div>

      {showPayroll && pay && (
        <div style={cardBox}>
          <SectionHeader
            title={pay.month ? `${MONTH_FULL[pay.month]} ${pay.year} Payroll` : 'Latest Payroll'}
            badge={pay.status}
            action="Manage payroll →"
            onAction={() => navigate('/dashboard/payroll')}
          />
          <MiniGrid items={[
            { label: 'Total Gross',    value: pay.total_gross,    color: '#1d4ed8' },
            { label: 'Total Net',      value: pay.total_net,      color: '#16a34a' },
            { label: 'Total PF',       value: pay.total_pf,       color: '#7c3aed' },
            { label: 'Total TDS',      value: pay.total_tds,      color: '#dc2626' },
            { label: 'Total LOP',      value: pay.total_lop,      color: '#f59e0b' },
            { label: 'Employees Paid', value: pay.employees_paid, color: '#374151', isCount: true },
          ]} isMobile={isMobile} />
          {pay.employees_lop > 0 && (
            <div style={{ marginTop: '12px', padding: '10px 14px', background: '#fef9c3', borderRadius: '8px', fontSize: '13px', color: '#854d0e' }}>
              ⚠ <strong>{pay.employees_lop}</strong> employee{pay.employees_lop > 1 ? 's' : ''} had LOP deductions this month
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Manager Stats ─────────────────────────────────────────────────────────────
function ManagerStats({ stats, navigate, isMobile, canAny }) {
  const team = stats.team || {}
  const showTeam       = canAny(DASHBOARD_PERMISSIONS.employees)
  const showAttendance = canAny(DASHBOARD_PERMISSIONS.attendance)
  const showLeave      = canAny(DASHBOARD_PERMISSIONS.leave)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? '180px' : '200px'}, 1fr))`, gap: '12px', marginBottom: '14px' }}>
      {showTeam && <StatCard icon={ICONS.teamSize}      label="Team Size"      value={team.total || 0}            sub="Members"         color="#6366f1" onClick={() => navigate('/dashboard/employees')} />}
      {showAttendance && <StatCard icon={ICONS.checkedIn}     label="Checked In"     value={team.checked_in_today || 0} sub="Today"           color="#10b981" onClick={() => navigate('/dashboard/attendance')} />}
      {showAttendance && <StatCard icon={ICONS.absent}        label="Absent Today"   value={team.absent_today || 0}     sub="Not checked in"  color="#dc2626" onClick={() => navigate('/dashboard/attendance')} />}
      {showLeave && <StatCard icon={ICONS.pendingLeaves} label="Pending Leaves" value={team.pending_leaves || 0}   sub="Awaiting action" color="#f59e0b" onClick={() => navigate('/dashboard/leave')} />}
    </div>
  )
}

// ── Employee Deduction History ────────────────────────────────────────────────
function DeductionHistorySection({ isMobile }) {
  const [data,     setData]     = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [year,     setYear]     = useState(new Date().getFullYear())
  const [expanded, setExpanded] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { load() }, [year])

  const load = () => {
    setLoading(true)
    import('../api/services/payroll').then(({ getMyDeductionsApi }) => {
      getMyDeductionsApi(year).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false))
    })
  }

  if (!data && !loading) return null
  const ytd     = data?.ytd     || {}
  const history = data?.history || []

  return (
    <div style={{ marginTop: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <p style={sectionLabel}>My Deduction History</p>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={year} onChange={e => setYear(parseInt(e.target.value))} style={selStyle}>
            {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => navigate('/dashboard/payroll')} style={actionLink}>View payslips →</button>
        </div>
      </div>

      {ytd.months_paid > 0 && (
        <div style={{ ...cardBox, marginBottom: '14px' }}>
          <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, color: '#555' }}>Year-to-Date ({ytd.months_paid} months)</p>
          <MiniGrid items={[
            { label: 'YTD Gross',    value: ytd.gross,          color: '#1d4ed8' },
            { label: 'YTD Net',      value: ytd.net_pay,        color: '#16a34a' },
            { label: 'YTD PF',       value: ytd.pf_employee,    color: '#7c3aed' },
            { label: 'YTD TDS',      value: ytd.tds,            color: '#dc2626' },
            { label: 'YTD LOP ₹',   value: ytd.lop_deduction,  color: '#f59e0b' },
            { label: 'YTD LOP Days', value: ytd.lop_days + ' d', color: '#f59e0b', raw: true },
          ]} isMobile={isMobile} />
        </div>
      )}

      {loading && <p style={{ color: '#888', fontSize: '13px' }}>Loading history...</p>}

      {history.length > 0 && (
        <div style={{ ...cardBox, padding: 0 }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '640px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Month','Days','LOP','Gross','PF','TDS','LOP Deduct','Total Deduct','Net Pay',''].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <>
                    <tr key={h.month}
                      style={{ borderTop: '1px solid #f1f5f9', background: i%2===0?'#fff':'#fafafa', cursor: 'pointer' }}
                      onClick={() => setExpanded(expanded === h.month ? null : h.month)}>
                      <td style={td}><strong style={{ color: '#111' }}>{MONTH_NAMES[h.month]} {h.year}</strong></td>
                      <td style={td}>{h.present_days}/{h.working_days}</td>
                      <td style={td}>{h.lop_days > 0 ? <span style={{ color:'#dc2626',fontWeight:700 }}>{h.lop_days}d</span> : <span style={{ color:'#aaa' }}>—</span>}</td>
                      <td style={td}>{fmt(h.gross)}</td>
                      <td style={{ ...td, color:'#7c3aed' }}>{fmt(h.pf_employee)}</td>
                      <td style={{ ...td, color:'#dc2626' }}>{h.tds>0?fmt(h.tds):<span style={{ color:'#aaa' }}>—</span>}</td>
                      <td style={{ ...td, color: h.lop_deduction>0?'#f59e0b':'#aaa', fontWeight: h.lop_deduction>0?700:400 }}>{h.lop_deduction>0?fmt(h.lop_deduction):'—'}</td>
                      <td style={{ ...td, color:'#ef4444', fontWeight:600 }}>{fmt(h.total_deductions)}</td>
                      <td style={{ ...td, color:'#16a34a', fontWeight:800 }}>{fmt(h.net_pay)}</td>
                      <td style={td}><span style={{ fontSize:'11px',color:'#6366f1' }}>{expanded===h.month?'▲':'▼'}</span></td>
                    </tr>
                    {expanded === h.month && (
                      <tr key={`exp-${h.month}`} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td colSpan={10} style={{ padding: 0, background: '#fffbeb' }}>
                          <div style={{ padding: '16px 18px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: '16px' }}>
                              <DeductionBreakdown h={h} />
                              <AttendanceSummary h={h} />
                              {h.adjustments?.length > 0 && <AdjustmentsBox h={h} />}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && history.length === 0 && (
        <div style={{ textAlign:'center', padding:'48px', color:'#aaa', background:'#fff', borderRadius:'14px', border:'1px solid #e5e7eb' }}>
          <img src={ICONS.myPayslip} alt="" style={{ width:'48px', height:'48px', opacity:0.25, marginBottom:'10px', display:'block', margin:'0 auto 10px' }} onError={e => { e.currentTarget.style.display='none' }} />
          <p style={{ margin:0, fontSize:'14px' }}>No payslips available for {year}</p>
        </div>
      )}
    </div>
  )
}

// ── Admin Deduction Summary ───────────────────────────────────────────────────
function AdminDeductionSection({ isMobile }) {
  const navigate = useNavigate()
  const now = new Date()
  const [month,      setMonth]      = useState(now.getMonth() + 1)
  const [year,       setYear]       = useState(now.getFullYear())
  const [data,       setData]       = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [selEmp,     setSelEmp]     = useState(null)
  const [empData,    setEmpData]    = useState(null)
  const [empLoading, setEmpLoading] = useState(false)
  const MONTH_ARR = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  useEffect(() => { load() }, [month, year])

  const load = () => {
    setLoading(true)
    import('../api/services/payroll').then(({ getDeductionSummaryApi }) => {
      getDeductionSummaryApi(month, year).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false))
    })
  }

  const loadEmpDetail = (empId) => {
    setSelEmp(empId)
    setEmpLoading(true)
    import('../api/services/payroll').then(({ getEmpDeductionsApi }) => {
      getEmpDeductionsApi(empId, year).then(r => setEmpData(r.data)).catch(() => {}).finally(() => setEmpLoading(false))
    })
  }

  const summary = data?.summary || {}
  const entries = data?.entries  || []

  return (
    <div style={{ marginTop: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <p style={sectionLabel}>Deduction Summary — All Employees</p>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={month} onChange={e => setMonth(parseInt(e.target.value))} style={selStyle}>
            {MONTH_ARR.slice(1).map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(parseInt(e.target.value))} style={selStyle}>
            {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => navigate('/dashboard/payroll')} style={actionLink}>Manage payroll →</button>
        </div>
      </div>

      {summary.total_employees > 0 && (
        <MiniGrid items={[
          { label:'Employees',   value:summary.total_employees,    color:'#374151', raw:true },
          { label:'With LOP',    value:summary.employees_with_lop, color:'#f59e0b', raw:true },
          { label:'With OT',     value:summary.employees_with_ot,  color:'#7c3aed', raw:true },
          { label:'Total Gross', value:summary.total_gross,        color:'#1d4ed8' },
          { label:'Total Net',   value:summary.total_net,          color:'#16a34a' },
          { label:'Total PF',    value:summary.total_pf,           color:'#7c3aed' },
          { label:'Total TDS',   value:summary.total_tds,          color:'#dc2626' },
          { label:'Total LOP ₹', value:summary.total_lop,          color:'#f59e0b' },
        ]} isMobile={isMobile} wrapStyle={{ marginBottom: '14px' }} />
      )}

      {loading && <p style={{ color:'#888', fontSize:'13px' }}>Loading...</p>}

      {entries.length > 0 && (
        <div style={{ ...cardBox, padding: 0, marginBottom: selEmp ? '14px' : 0 }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '720px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Employee','Dept','Days','LOP','Gross','PF','TDS','LOP Deduct','Net Pay',''].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => (
                  <tr key={e.emp_id}
                    style={{ borderTop:'1px solid #f1f5f9', background: selEmp===e.emp_id?'#eff6ff':i%2===0?'#fff':'#fafafa', cursor:'pointer' }}
                    onClick={() => loadEmpDetail(selEmp===e.emp_id ? null : e.emp_id)}>
                    <td style={td}>
                      <div style={{ display:'flex', alignItems:'center', gap:'9px' }}>
                        <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:'#1a1a2e', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:700, flexShrink:0 }}>
                          {e.name?.[0]}
                        </div>
                        <div>
                          <p style={{ margin:0, fontWeight:600, color:'#111', whiteSpace:'nowrap' }}>{e.name}</p>
                          <p style={{ margin:0, color:'#aaa', fontSize:'11px' }}>{e.emp_code}</p>
                        </div>
                      </div>
                    </td>
                    <td style={td}>{e.department}</td>
                    <td style={td}>{e.present_days}/{e.working_days}</td>
                    <td style={td}>{e.lop_days>0?<span style={{ color:'#dc2626',fontWeight:700 }}>{e.lop_days}d</span>:<span style={{ color:'#aaa' }}>—</span>}</td>
                    <td style={td}>{fmt(e.gross)}</td>
                    <td style={{ ...td, color:'#7c3aed' }}>{fmt(e.pf_employee)}</td>
                    <td style={{ ...td, color:'#dc2626' }}>{e.tds>0?fmt(e.tds):<span style={{ color:'#aaa' }}>—</span>}</td>
                    <td style={{ ...td, color:e.lop_deduction>0?'#f59e0b':'#aaa', fontWeight:e.lop_deduction>0?700:400 }}>{e.lop_deduction>0?fmt(e.lop_deduction):'—'}</td>
                    <td style={{ ...td, color:'#16a34a', fontWeight:800 }}>{fmt(e.net_pay)}</td>
                    <td style={td}><span style={{ fontSize:'11px', color:'#6366f1', fontWeight:600 }}>{selEmp===e.emp_id?'▲ Hide':'▼ Detail'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && entries.length === 0 && (
        <div style={{ textAlign:'center', padding:'48px', color:'#aaa', background:'#fff', borderRadius:'14px', border:'1px solid #e5e7eb' }}>
          No payroll data for {MONTH_ARR[month]} {year}
        </div>
      )}

      {selEmp && empData && (
        <div style={{ ...cardBox, border:'1px solid #6366f1' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px', flexWrap:'wrap', gap:'8px' }}>
            <div>
              <h3 style={{ margin:0, fontSize:'15px', fontWeight:700, color:'#111' }}>{empData.employee?.name} — Full Year</h3>
              <p style={{ margin:'4px 0 0', fontSize:'12px', color:'#888' }}>{empData.employee?.emp_code} · {empData.employee?.emp_type} · {year}</p>
            </div>
            <button onClick={() => { setSelEmp(null); setEmpData(null) }} style={{ background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#888' }}>✕</button>
          </div>
          {empData.ytd && (
            <MiniGrid items={[
              { label:'YTD Gross', value:empData.ytd.gross,         color:'#1d4ed8' },
              { label:'YTD Net',   value:empData.ytd.net_pay,       color:'#16a34a' },
              { label:'YTD PF',    value:empData.ytd.pf_employee,   color:'#7c3aed' },
              { label:'YTD TDS',   value:empData.ytd.tds,           color:'#dc2626' },
              { label:'YTD LOP ₹', value:empData.ytd.lop_deduction, color:'#f59e0b' },
              { label:'LOP Days',  value:empData.ytd.lop_days+'d',  color:'#f59e0b', raw:true },
            ]} isMobile={isMobile} wrapStyle={{ marginBottom:'14px' }} />
          )}
          {empLoading && <p style={{ color:'#888', fontSize:'13px' }}>Loading...</p>}
          {empData.history?.length > 0 && (
            <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px', minWidth:'580px' }}>
                <thead>
                  <tr style={{ background:'#f8fafc' }}>
                    {['Month','Days','LOP','Gross','PF','TDS','LOP Deduct','Net Pay'].map(h => <th key={h} style={th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {empData.history.map((h,i) => (
                    <tr key={h.month} style={{ borderTop:'1px solid #f1f5f9', background:i%2===0?'#fff':'#fafafa' }}>
                      <td style={td}><strong>{MONTH_NAMES[h.month]} {h.year}</strong></td>
                      <td style={td}>{h.present_days}/{h.working_days}</td>
                      <td style={td}>{h.lop_days>0?<span style={{ color:'#dc2626',fontWeight:700 }}>{h.lop_days}d</span>:<span style={{ color:'#aaa' }}>—</span>}</td>
                      <td style={td}>{fmt(h.gross)}</td>
                      <td style={{ ...td, color:'#7c3aed' }}>{fmt(h.pf_employee)}</td>
                      <td style={{ ...td, color:'#dc2626' }}>{h.tds>0?fmt(h.tds):'—'}</td>
                      <td style={{ ...td, color:h.lop_deduction>0?'#f59e0b':'#aaa', fontWeight:h.lop_deduction>0?700:400 }}>{h.lop_deduction>0?fmt(h.lop_deduction):'—'}</td>
                      <td style={{ ...td, color:'#16a34a', fontWeight:800 }}>{fmt(h.net_pay)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background:   '#fff',
        border:       '1px solid #e5e7eb',
        borderRadius: '14px',
        padding:      '16px 18px',
        cursor:       onClick ? 'pointer' : 'default',
        borderLeft:   `4px solid ${color}`,
        transition:   'box-shadow 0.15s',
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.09)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
    >
      <p style={{ margin: 0, fontSize: '12px', color: '#888', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <img
          src={icon}
          alt=""
          style={{ width: '16px', height: '16px', objectFit: 'contain', flexShrink: 0 }}
          onError={e => { e.currentTarget.style.display = 'none' }}
        />
        {label}
      </p>
      <p style={{ margin: '6px 0 3px', fontSize: '22px', fontWeight: 800, color }}>{value}</p>
      <p style={{ margin: 0, fontSize: '12px', color: '#aaa' }}>{sub}</p>
    </div>
  )
}

function MiniGrid({ items, isMobile, wrapStyle = {} }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? '130px' : '145px'}, 1fr))`, gap: '10px', ...wrapStyle }}>
      {items.map(s => (
        <div key={s.label} style={{ background: '#f8fafc', borderRadius: '10px', padding: '11px 13px', borderLeft: `3px solid ${s.color}` }}>
          <p style={{ margin: 0, fontSize: '11px', color: '#888', display: 'flex', alignItems: 'center', gap: '5px' }}>
            {s.icon && (
              <img
                src={s.icon}
                alt=""
                style={{ width: '12px', height: '12px', objectFit: 'contain', flexShrink: 0 }}
                onError={e => { e.currentTarget.style.display = 'none' }}
              />
            )}
            {s.label}
          </p>
          <p style={{ margin: '3px 0 0', fontSize: '15px', fontWeight: 800, color: s.color }}>
            {s.raw ? s.value : s.isCount ? (s.value || 0) : fmt(s.value)}
          </p>
        </div>
      ))}
    </div>
  )
}

function SectionHeader({ title, badge, action, onAction }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '6px' }}>
      <div>
        <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#111' }}>{title}</p>
        {badge && (
          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: badge === 'locked' ? '#dcfce7' : '#fef9c3', color: badge === 'locked' ? '#166534' : '#854d0e', fontWeight: 600, textTransform: 'capitalize' }}>
            {badge}
          </span>
        )}
      </div>
      {action && <button onClick={onAction} style={actionLink}>{action}</button>}
    </div>
  )
}

function DeductionBreakdown({ h }) {
  const items = [
    { label: 'PF (Employee 12%)', value: h.pf_employee,   color: '#7c3aed' },
    { label: 'ESI (Employee)',    value: h.esi_employee,   color: '#6366f1' },
    { label: 'Professional Tax',  value: h.pt,             color: '#0ea5e9' },
    { label: 'TDS',               value: h.tds,            color: '#dc2626' },
    { label: `LOP (${h.lop_days} days)`, value: h.lop_deduction, color: '#f59e0b' },
  ].filter(d => d.value > 0)
  return (
    <div>
      <p style={subLabel}>Deduction Breakdown</p>
      {items.map(d => <BreakRow key={d.label} label={d.label} value={fmt2(d.value)} color={d.color} />)}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0 0' }}>
        <span style={{ fontSize: '13px', fontWeight: 700 }}>Total Deductions</span>
        <span style={{ fontSize: '14px', fontWeight: 800, color: '#ef4444' }}>{fmt2(h.total_deductions)}</span>
      </div>
    </div>
  )
}

function AttendanceSummary({ h }) {
  return (
    <div>
      <p style={subLabel}>Attendance Summary</p>
      {[
        { label: 'Working Days', value: `${h.working_days} days` },
        { label: 'Present Days', value: `${h.present_days} days` },
        { label: 'LOP Days',     value: h.lop_days > 0 ? `${h.lop_days} days` : 'None', warn: h.lop_days > 0 },
        { label: 'OT Hours',     value: h.ot_hours > 0 ? `${h.ot_hours} hrs` : 'None' },
        { label: 'OT Pay',       value: h.ot_pay > 0 ? fmt2(h.ot_pay) : 'None' },
      ].map(r => <BreakRow key={r.label} label={r.label} value={r.value} color={r.warn ? '#dc2626' : '#111'} />)}
    </div>
  )
}

function AdjustmentsBox({ h }) {
  return (
    <div>
      <p style={subLabel}>Adjustments</p>
      {h.adjustments.map((adj, i) => (
        <BreakRow key={i} label={`${adj.type} — ${adj.reason}`} value={`${adj.type === 'deduction' ? '−' : '+'}${fmt2(adj.amount)}`} color={adj.type === 'deduction' ? '#dc2626' : '#16a34a'} />
      ))}
    </div>
  )
}

function BreakRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ fontSize: '13px', color: '#555' }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 600, color }}>{value}</span>
    </div>
  )
}

// ── Style constants ───────────────────────────────────────────────────────────
const td           = { padding: '11px 13px', color: '#333', verticalAlign: 'middle' }
const th           = { padding: '11px 13px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: '12px', textTransform: 'uppercase', whiteSpace: 'nowrap', letterSpacing: '0.03em', background: '#f8fafc' }
const selStyle     = { padding: '6px 10px', borderRadius: '7px', border: '1px solid #ddd', fontSize: '13px', outline: 'none', cursor: 'pointer' }
const actionLink   = { fontSize: '13px', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }
const cardBox      = { background: '#fff', borderRadius: '14px', border: '1px solid #e5e7eb', padding: '16px 18px', marginBottom: '10px' }
const sectionLabel = { margin: 0, fontSize: '12px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }
const subLabel     = { margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase' }
