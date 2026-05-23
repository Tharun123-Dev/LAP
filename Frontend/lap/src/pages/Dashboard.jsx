// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import usePermission from '../hooks/usePermission'
import { getDashboardStatsApi } from '../api/services/payroll'

const MONTH_NAMES = ['','Jan','Feb','Mar','Apr','May','Jun',
                     'Jul','Aug','Sep','Oct','Nov','Dec']
const MONTH_FULL  = ['','January','February','March','April','May','June',
                     'July','August','September','October','November','December']

const fmt  = v  => `₹${parseFloat(v||0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`
const fmt2 = v  => `₹${parseFloat(v||0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

const CARDS = {
  superadmin: [
    { label: 'Employees',   path: '/dashboard/employees',   icon: '👥', color: '#6366f1' },
    { label: 'Departments', path: '/dashboard/departments', icon: '🏢', color: '#0ea5e9' },
    { label: 'Attendance',  path: '/dashboard/attendance',  icon: '📅', color: '#10b981' },
    { label: 'Leave',       path: '/dashboard/leave',       icon: '🌴', color: '#f59e0b' },
    { label: 'Payroll',     path: '/dashboard/payroll',     icon: '💰', color: '#ef4444' },
    { label: 'Permissions', path: '/dashboard/permissions', icon: '🔐', color: '#374151' },
  ],
  admin: [
    { label: 'Employees',   path: '/dashboard/employees',   icon: '👥', color: '#6366f1' },
    { label: 'Departments', path: '/dashboard/departments', icon: '🏢', color: '#0ea5e9' },
    { label: 'Attendance',  path: '/dashboard/attendance',  icon: '📅', color: '#10b981' },
    { label: 'Leave',       path: '/dashboard/leave',       icon: '🌴', color: '#f59e0b' },
    { label: 'Payroll',     path: '/dashboard/payroll',     icon: '💰', color: '#ef4444' },
    { label: 'Permissions', path: '/dashboard/permissions', icon: '🔐', color: '#374151' },
  ],
  manager: [
    { label: 'My Team',     path: '/dashboard/employees',   icon: '👥', color: '#6366f1' },
    { label: 'Attendance',  path: '/dashboard/attendance',  icon: '📅', color: '#10b981' },
    { label: 'Leave',       path: '/dashboard/leave',       icon: '🌴', color: '#f59e0b' },
  ],
  hr: [
    { label: 'Employees',   path: '/dashboard/employees',   icon: '👥', color: '#6366f1' },
    { label: 'Attendance',  path: '/dashboard/attendance',  icon: '📅', color: '#10b981' },
    { label: 'Leave',       path: '/dashboard/leave',       icon: '🌴', color: '#f59e0b' },
    { label: 'Payroll',     path: '/dashboard/payroll',     icon: '💰', color: '#ef4444' },
  ],
  employee: [
    { label: 'Attendance',  path: '/dashboard/attendance',  icon: '📅', color: '#10b981' },
    { label: 'My Leave',    path: '/dashboard/leave',       icon: '🌴', color: '#f59e0b' },
    { label: 'My Payslip',  path: '/dashboard/payroll',     icon: '🧾', color: '#6366f1' },
  ],
}

export default function Dashboard() {
  const role     = useSelector(s => s.auth.role) || 'employee'
  const user     = useSelector(s => s.auth.user)
  const navigate = useNavigate()
  const { can }  = usePermission()
  const cards    = CARDS[role] || CARDS.employee

  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getDashboardStatsApi()
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const dateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Welcome Banner */}
      <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)', borderRadius: '14px', padding: '24px 28px', marginBottom: '24px', color: '#fff' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Welcome back, {user} 👋</h2>
        <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '13px', textTransform: 'capitalize' }}>
          {role} · {dateStr}
        </p>
      </div>

      {/* Role-specific stats */}
      {!loading && stats && (
        <>
          {role === 'employee' && <EmployeeStats stats={stats} navigate={navigate} />}
          {(role === 'admin' || role === 'superadmin') && <AdminStats stats={stats} navigate={navigate} />}
          {role === 'manager' && <ManagerStats stats={stats} navigate={navigate} />}
          {role === 'hr' && <AdminStats stats={stats} navigate={navigate} />}
        </>
      )}

      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: '12px', marginBottom: '24px' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ height: '80px', background: '#f3f4f6', borderRadius: '12px' }} />
          ))}
        </div>
      )}

      {/* Quick Access */}
      <p style={{ margin: '24px 0 12px', fontSize: '12px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Quick Access
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: '12px' }}>
        {cards.map(card => (
          <button
            key={card.path}
            onClick={() => navigate(card.path)}
            style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '18px 16px', cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '10px', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.borderColor=card.color; e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.borderColor='#e5e7eb'; e.currentTarget.style.boxShadow='none' }}
          >
            <div style={{ width: '38px', height: '38px', borderRadius: '9px', background: card.color+'18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
              {card.icon}
            </div>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#111' }}>{card.label}</p>
          </button>
        ))}
      </div>

      {/* Deduction History Section */}
      {role === 'employee' && can('view_payslip') && (
        <DeductionHistorySection />
      )}
      {(role === 'admin' || role === 'superadmin' || role === 'hr') && can('view_payroll') && (
        <AdminDeductionSection />
      )}
    </div>
  )
}


// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEE STATS WIDGET
// ─────────────────────────────────────────────────────────────────────────────

function EmployeeStats({ stats, navigate }) {
  const att  = stats.attendance  || {}
  const pay  = stats.last_payslip || {}
  const lv   = stats.leave       || {}

  const STATUS_COLOR = {
    present: '#16a34a', late: '#d97706', half_day: '#b45309',
    absent: '#dc2626', leave: '#7c3aed', not_started: '#9ca3af',
  }
  const todayColor = STATUS_COLOR[att.today_status] || '#9ca3af'

  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: '12px', marginBottom: '12px' }}>

        {/* Today status */}
        <StatCard
          icon="📍" label="Today"
          value={att.today_status?.replace('_',' ') || 'Not started'}
          sub={att.today_checked_in
            ? (att.today_checked_out ? 'Day complete' : 'Checked in')
            : 'Not checked in'}
          color={todayColor}
          onClick={() => navigate('/dashboard/attendance')}
        />

        {/* This month */}
        <StatCard icon="📅" label="This Month"
          value={`${att.present_this_month || 0} days`}
          sub={`${att.lop_this_month || 0} LOP`}
          color="#10b981"
          onClick={() => navigate('/dashboard/attendance')}
        />

        {/* Leave balance */}
        <StatCard icon="🌴" label="Leave Left"
          value={`${lv.balances?.reduce((s,b) => s + b.remaining, 0).toFixed(0) || 0} days`}
          sub={`${lv.pending_requests || 0} pending`}
          color="#f59e0b"
          onClick={() => navigate('/dashboard/leave')}
        />

        {/* Last payslip */}
        <StatCard icon="🧾" label={pay.month ? `${MONTH_NAMES[pay.month]} ${pay.year}` : 'Payslip'}
          value={fmt(pay.net_pay)}
          sub={pay.lop_days > 0 ? `${pay.lop_days} LOP deducted` : 'No LOP'}
          color={pay.lop_days > 0 ? '#dc2626' : '#6366f1'}
          onClick={() => navigate('/dashboard/payroll')}
        />
      </div>

      {/* Last payslip deduction breakdown */}
      {pay.month && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px 20px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#111' }}>
              {MONTH_FULL[pay.month]} {pay.year} — Deduction Breakdown
            </p>
            <button
              onClick={() => navigate('/dashboard/payroll')}
              style={{ fontSize: '12px', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            >
              View all payslips →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: '10px' }}>
            {[
              { label: 'Gross',        value: pay.gross,            color: '#1d4ed8', icon: '💵' },
              { label: 'PF',           value: pay.pf,               color: '#7c3aed', icon: '🏦' },
              { label: 'TDS',          value: pay.tds,              color: '#dc2626', icon: '📋' },
              { label: 'LOP',          value: pay.lop_deduction,    color: '#f59e0b', icon: '⚠' },
              { label: 'Total Deduct', value: pay.total_deductions, color: '#ef4444', icon: '➖' },
              { label: 'Net Pay',      value: pay.net_pay,          color: '#16a34a', icon: '✅' },
            ].map(s => (
              <div key={s.label} style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px 12px', borderLeft: `3px solid ${s.color}` }}>
                <p style={{ margin: 0, fontSize: '10px', color: '#888' }}>{s.icon} {s.label}</p>
                <p style={{ margin: '3px 0 0', fontSize: '14px', fontWeight: 800, color: s.color }}>{fmt(s.value)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


// ─────────────────────────────────────────────────────────────────────────────
// ADMIN / HR STATS WIDGET
// ─────────────────────────────────────────────────────────────────────────────

function AdminStats({ stats, navigate }) {
  const hc  = stats.headcount   || {}
  const pay = stats.last_payroll || {}

  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: '12px', marginBottom: '12px' }}>
        <StatCard icon="👥" label="Total Employees" value={hc.total_employees || 0}       sub="Active"          color="#6366f1" onClick={() => navigate('/dashboard/employees')} />
        <StatCard icon="📍" label="Checked In Today" value={hc.checked_in_today || 0}     sub="Today"           color="#10b981" onClick={() => navigate('/dashboard/attendance')} />
        <StatCard icon="🌴" label="Pending Leaves"  value={hc.pending_leaves || 0}        sub="Awaiting action" color="#f59e0b" onClick={() => navigate('/dashboard/leave')} />
        <StatCard icon="🏢" label="Departments"     value={hc.total_departments || 0}      sub="Active"          color="#0ea5e9" onClick={() => navigate('/dashboard/departments')} />
      </div>

      {pay && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px 20px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#111' }}>
                {pay.month ? `${MONTH_FULL[pay.month]} ${pay.year}` : 'Latest'} Payroll
              </p>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: pay.status === 'locked' ? '#dcfce7' : '#fef9c3', color: pay.status === 'locked' ? '#166534' : '#854d0e', fontWeight: 600, textTransform: 'capitalize' }}>
                {pay.status || 'No payroll run'}
              </span>
            </div>
            <button onClick={() => navigate('/dashboard/payroll')} style={{ fontSize: '12px', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              Manage payroll →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: '10px' }}>
            {[
              { label: 'Total Gross',    value: pay.total_gross,   color: '#1d4ed8' },
              { label: 'Total Net',      value: pay.total_net,     color: '#16a34a' },
              { label: 'Total PF',       value: pay.total_pf,      color: '#7c3aed' },
              { label: 'Total TDS',      value: pay.total_tds,     color: '#dc2626' },
              { label: 'Total LOP',      value: pay.total_lop,     color: '#f59e0b' },
              { label: 'Employees Paid', value: pay.employees_paid, color: '#374151', isCount: true },
            ].map(s => (
              <div key={s.label} style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px 12px', borderLeft: `3px solid ${s.color}` }}>
                <p style={{ margin: 0, fontSize: '10px', color: '#888' }}>{s.label}</p>
                <p style={{ margin: '3px 0 0', fontSize: '14px', fontWeight: 800, color: s.color }}>
                  {s.isCount ? s.value || 0 : fmt(s.value)}
                </p>
              </div>
            ))}
          </div>
          {pay.employees_lop > 0 && (
            <div style={{ marginTop: '12px', padding: '8px 12px', background: '#fef9c3', borderRadius: '8px', fontSize: '12px', color: '#854d0e' }}>
              ⚠ <strong>{pay.employees_lop}</strong> employee{pay.employees_lop > 1 ? 's' : ''} had LOP deductions this month
            </div>
          )}
        </div>
      )}
    </div>
  )
}


// ─────────────────────────────────────────────────────────────────────────────
// MANAGER STATS WIDGET
// ─────────────────────────────────────────────────────────────────────────────

function ManagerStats({ stats, navigate }) {
  const team = stats.team || {}
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: '12px', marginBottom: '12px' }}>
      <StatCard icon="👥" label="Team Size"      value={team.total || 0}            sub="Members"         color="#6366f1" onClick={() => navigate('/dashboard/employees')} />
      <StatCard icon="✅" label="Checked In"     value={team.checked_in_today || 0} sub="Today"           color="#10b981" onClick={() => navigate('/dashboard/attendance')} />
      <StatCard icon="❌" label="Absent Today"   value={team.absent_today || 0}     sub="Not checked in"  color="#dc2626" onClick={() => navigate('/dashboard/attendance')} />
      <StatCard icon="🌴" label="Pending Leaves" value={team.pending_leaves || 0}   sub="Awaiting action" color="#f59e0b" onClick={() => navigate('/dashboard/leave')} />
    </div>
  )
}


// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEE — DEDUCTION HISTORY (own, full year)
// ─────────────────────────────────────────────────────────────────────────────

function DeductionHistorySection() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [year,    setYear]    = useState(new Date().getFullYear())
  const [expanded, setExpanded] = useState(null)
  const navigate = useNavigate()



  useEffect(() => { load() }, [year])

  const load = () => {
    setLoading(true)
    import('../api/services/payroll').then(({ getMyDeductionsApi }) => {
      getMyDeductionsApi(year)
        .then(r => setData(r.data))
        .catch(() => {})
        .finally(() => setLoading(false))
    })
  }

  if (!data && !loading) return null

  const ytd = data?.ytd || {}
  const history = data?.history || []

  return (
    <div style={{ marginTop: '28px' }}>
      {/* Section header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          My Deduction History
        </p>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={year}
            onChange={e => setYear(parseInt(e.target.value))}
            style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '12px', outline: 'none' }}
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button onClick={() => navigate('/dashboard/payroll')} style={{ fontSize: '12px', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            View payslips →
          </button>
        </div>
      </div>

      {/* YTD summary */}
      {ytd.months_paid > 0 && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px 20px', marginBottom: '14px' }}>
          <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 700, color: '#555' }}>
            Year-to-Date ({ytd.months_paid} months)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))', gap: '10px' }}>
            {[
              { label: 'YTD Gross',  value: ytd.gross,            color: '#1d4ed8' },
              { label: 'YTD Net',    value: ytd.net_pay,          color: '#16a34a' },
              { label: 'YTD PF',     value: ytd.pf_employee,      color: '#7c3aed' },
              { label: 'YTD TDS',    value: ytd.tds,              color: '#dc2626' },
              { label: 'YTD LOP ₹',  value: ytd.lop_deduction,    color: '#f59e0b' },
              { label: 'YTD LOP Days', value: ytd.lop_days + ' d', color: '#f59e0b', raw: true },
            ].map(s => (
              <div key={s.label} style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px 12px', borderLeft: `3px solid ${s.color}` }}>
                <p style={{ margin: 0, fontSize: '10px', color: '#888' }}>{s.label}</p>
                <p style={{ margin: '3px 0 0', fontSize: '14px', fontWeight: 800, color: s.color }}>
                  {s.raw ? s.value : fmt(s.value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && <p style={{ color: '#888', fontSize: '13px' }}>Loading history...</p>}

      {/* Month-by-month table */}
      {history.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Month', 'Days', 'LOP', 'Gross', 'PF', 'TDS', 'LOP Deduction', 'Total Deduct', 'Net Pay', ''].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: '11px', textTransform: 'uppercase', whiteSpace: 'nowrap', letterSpacing: '0.03em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <>
                    <tr
                      key={h.month}
                      style={{ borderTop: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa', cursor: 'pointer' }}
                      onClick={() => setExpanded(expanded === h.month ? null : h.month)}
                    >
                      <td style={td}><strong style={{ color: '#111' }}>{MONTH_NAMES[h.month]} {h.year}</strong></td>
                      <td style={td}>{h.present_days}/{h.working_days}</td>
                      <td style={td}>
                        {h.lop_days > 0
                          ? <span style={{ color: '#dc2626', fontWeight: 700 }}>{h.lop_days}d</span>
                          : <span style={{ color: '#aaa' }}>—</span>
                        }
                      </td>
                      <td style={td}>{fmt(h.gross)}</td>
                      <td style={{ ...td, color: '#7c3aed' }}>{fmt(h.pf_employee)}</td>
                      <td style={{ ...td, color: '#dc2626' }}>{h.tds > 0 ? fmt(h.tds) : <span style={{ color: '#aaa' }}>—</span>}</td>
                      <td style={{ ...td, color: h.lop_deduction > 0 ? '#f59e0b' : '#aaa', fontWeight: h.lop_deduction > 0 ? 700 : 400 }}>
                        {h.lop_deduction > 0 ? fmt(h.lop_deduction) : '—'}
                      </td>
                      <td style={{ ...td, color: '#ef4444', fontWeight: 600 }}>{fmt(h.total_deductions)}</td>
                      <td style={{ ...td, color: '#16a34a', fontWeight: 800 }}>{fmt(h.net_pay)}</td>
                      <td style={td}><span style={{ fontSize: '10px', color: '#6366f1' }}>{expanded === h.month ? '▲' : '▼'}</span></td>
                    </tr>

                    {/* Expanded row — full breakdown */}
                    {expanded === h.month && (
                      <tr key={`exp-${h.month}`} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td colSpan={10} style={{ padding: '0', background: '#fffbeb' }}>
                          <div style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: '16px' }}>

                              {/* Deduction breakdown */}
                              <div>
                                <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>Deduction Breakdown</p>
                                {[
                                  { label: 'PF (Employee 12%)',  value: h.pf_employee,    color: '#7c3aed' },
                                  { label: 'ESI (Employee)',     value: h.esi_employee,   color: '#6366f1' },
                                  { label: 'Professional Tax',  value: h.pt,             color: '#0ea5e9' },
                                  { label: 'TDS',               value: h.tds,            color: '#dc2626' },
                                  { label: `LOP (${h.lop_days} days)`, value: h.lop_deduction, color: '#f59e0b' },
                                ].filter(d => d.value > 0).map(d => (
                                  <div key={d.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f3f4f6' }}>
                                    <span style={{ fontSize: '12px', color: '#555' }}>{d.label}</span>
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: d.color }}>{fmt2(d.value)}</span>
                                  </div>
                                ))}
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0 0', marginTop: '2px' }}>
                                  <span style={{ fontSize: '12px', fontWeight: 700 }}>Total Deductions</span>
                                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#ef4444' }}>{fmt2(h.total_deductions)}</span>
                                </div>
                              </div>

                              {/* Attendance & earnings */}
                              <div>
                                <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>Attendance Summary</p>
                                {[
                                  { label: 'Working Days',   value: `${h.working_days} days` },
                                  { label: 'Present Days',   value: `${h.present_days} days` },
                                  { label: 'LOP Days',       value: h.lop_days > 0 ? `${h.lop_days} days` : 'None', warn: h.lop_days > 0 },
                                  { label: 'OT Hours',       value: h.ot_hours > 0 ? `${h.ot_hours} hrs` : 'None' },
                                  { label: 'OT Pay',         value: h.ot_pay > 0 ? fmt2(h.ot_pay) : 'None' },
                                ].map(r => (
                                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f3f4f6' }}>
                                    <span style={{ fontSize: '12px', color: '#555' }}>{r.label}</span>
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: r.warn ? '#dc2626' : '#111' }}>{r.value}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Adjustments if any */}
                              {h.adjustments?.length > 0 && (
                                <div>
                                  <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>Adjustments</p>
                                  {h.adjustments.map((adj, ai) => (
                                    <div key={ai} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f3f4f6' }}>
                                      <span style={{ fontSize: '12px', color: '#555', textTransform: 'capitalize' }}>{adj.type} — {adj.reason}</span>
                                      <span style={{ fontSize: '12px', fontWeight: 600, color: adj.type === 'deduction' ? '#dc2626' : '#16a34a' }}>
                                        {adj.type === 'deduction' ? '−' : '+'}{fmt2(adj.amount)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
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
        <div style={{ textAlign: 'center', padding: '40px', color: '#aaa', background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '28px', margin: '0 0 8px' }}>🧾</p>
          No payslips available for {year}
        </div>
      )}
    </div>
  )
}


// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — DEDUCTION SUMMARY (all employees, by month)
// ─────────────────────────────────────────────────────────────────────────────

function AdminDeductionSection() {
  const navigate = useNavigate()
  const now = new Date()
  const [month,   setMonth]   = useState(now.getMonth() + 1)
  const [year,    setYear]    = useState(now.getFullYear())
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [selEmp,  setSelEmp]  = useState(null)
  const [empData, setEmpData] = useState(null)
  const [empLoading, setEmpLoading] = useState(false)

  useEffect(() => { load() }, [month, year])

  const load = () => {
    setLoading(true)
    import('../api/services/payroll').then(({ getDeductionSummaryApi }) => {
      getDeductionSummaryApi(month, year)
        .then(r => setData(r.data))
        .catch(() => {})
        .finally(() => setLoading(false))
    })
  }

  const loadEmpDetail = (empId) => {
    setSelEmp(empId)
    setEmpLoading(true)
    import('../api/services/payroll').then(({ getEmpDeductionsApi }) => {
      getEmpDeductionsApi(empId, year)
        .then(r => setEmpData(r.data))
        .catch(() => {})
        .finally(() => setEmpLoading(false))
    })
  }

  const MONTH_NAMES_ARR = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const summary = data?.summary || {}
  const entries = data?.entries || []

  return (
    <div style={{ marginTop: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Deduction Summary — All Employees
        </p>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={month} onChange={e => setMonth(parseInt(e.target.value))} style={selStyle}>
            {MONTH_NAMES_ARR.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(parseInt(e.target.value))} style={selStyle}>
            {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => navigate('/dashboard/payroll')} style={{ fontSize: '12px', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            Manage payroll →
          </button>
        </div>
      </div>

      {/* Org summary pills */}
      {summary.total_employees > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: '10px', marginBottom: '14px' }}>
          {[
            { label: 'Employees',   value: summary.total_employees,     color: '#374151', raw: true },
            { label: 'With LOP',    value: summary.employees_with_lop,  color: '#f59e0b', raw: true },
            { label: 'With OT',     value: summary.employees_with_ot,   color: '#7c3aed', raw: true },
            { label: 'Total Gross', value: summary.total_gross,         color: '#1d4ed8' },
            { label: 'Total Net',   value: summary.total_net,           color: '#16a34a' },
            { label: 'Total PF',    value: summary.total_pf,            color: '#7c3aed' },
            { label: 'Total TDS',   value: summary.total_tds,           color: '#dc2626' },
            { label: 'Total LOP ₹', value: summary.total_lop,           color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '10px 12px', borderLeft: `3px solid ${s.color}` }}>
              <p style={{ margin: 0, fontSize: '10px', color: '#888' }}>{s.label}</p>
              <p style={{ margin: '3px 0 0', fontSize: '14px', fontWeight: 800, color: s.color }}>
                {s.raw ? s.value : fmt(s.value)}
              </p>
            </div>
          ))}
        </div>
      )}

      {loading && <p style={{ color: '#888', fontSize: '13px' }}>Loading...</p>}

      {/* Employee table */}
      {entries.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: selEmp ? '14px' : '0' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Employee', 'Dept', 'Days', 'LOP', 'Gross', 'PF', 'TDS', 'LOP Deduct', 'Net Pay', ''].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: '11px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => (
                  <tr
                    key={e.emp_id}
                    style={{ borderTop: '1px solid #f1f5f9', background: selEmp === e.emp_id ? '#eff6ff' : i%2===0 ? '#fff' : '#fafafa', cursor: 'pointer' }}
                    onClick={() => loadEmpDetail(selEmp === e.emp_id ? null : e.emp_id)}
                  >
                    <td style={td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1a1a2e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>
                          {e.name?.[0]}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, color: '#111' }}>{e.name}</p>
                          <p style={{ margin: 0, color: '#aaa', fontSize: '10px' }}>{e.emp_code}</p>
                        </div>
                      </div>
                    </td>
                    <td style={td}>{e.department}</td>
                    <td style={td}>{e.present_days}/{e.working_days}</td>
                    <td style={td}>
                      {e.lop_days > 0
                        ? <span style={{ color: '#dc2626', fontWeight: 700 }}>{e.lop_days}d</span>
                        : <span style={{ color: '#aaa' }}>—</span>
                      }
                    </td>
                    <td style={td}>{fmt(e.gross)}</td>
                    <td style={{ ...td, color: '#7c3aed' }}>{fmt(e.pf_employee)}</td>
                    <td style={{ ...td, color: '#dc2626' }}>{e.tds > 0 ? fmt(e.tds) : <span style={{ color: '#aaa' }}>—</span>}</td>
                    <td style={{ ...td, color: e.lop_deduction > 0 ? '#f59e0b' : '#aaa', fontWeight: e.lop_deduction > 0 ? 700 : 400 }}>
                      {e.lop_deduction > 0 ? fmt(e.lop_deduction) : '—'}
                    </td>
                    <td style={{ ...td, color: '#16a34a', fontWeight: 800 }}>{fmt(e.net_pay)}</td>
                    <td style={td}>
                      <span style={{ fontSize: '10px', color: '#6366f1', fontWeight: 600 }}>
                        {selEmp === e.emp_id ? '▲ Hide' : '▼ History'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && entries.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#aaa', background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          No payroll data for {MONTH_NAMES_ARR[month]} {year}
        </div>
      )}

      {/* Employee detail panel */}
      {selEmp && empData && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #6366f1', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#111' }}>
                {empData.employee?.name} — Full Year Deduction History
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#888' }}>
                {empData.employee?.emp_code} · {empData.employee?.emp_type} · {year}
              </p>
            </div>
            <button onClick={() => { setSelEmp(null); setEmpData(null) }} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}>✕</button>
          </div>

          {/* YTD for this employee */}
          {empData.ytd && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px,1fr))', gap: '8px', marginBottom: '14px' }}>
              {[
                { label: 'YTD Gross',  value: empData.ytd.gross,          color: '#1d4ed8' },
                { label: 'YTD Net',    value: empData.ytd.net_pay,        color: '#16a34a' },
                { label: 'YTD PF',     value: empData.ytd.pf_employee,    color: '#7c3aed' },
                { label: 'YTD TDS',    value: empData.ytd.tds,            color: '#dc2626' },
                { label: 'YTD LOP ₹',  value: empData.ytd.lop_deduction,  color: '#f59e0b' },
                { label: 'LOP Days',   value: empData.ytd.lop_days + 'd', color: '#f59e0b', raw: true },
              ].map(s => (
                <div key={s.label} style={{ background: '#f8fafc', borderRadius: '7px', padding: '8px 10px', borderLeft: `3px solid ${s.color}` }}>
                  <p style={{ margin: 0, fontSize: '9px', color: '#888' }}>{s.label}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 800, color: s.color }}>
                    {s.raw ? s.value : fmt(s.value)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {empLoading && <p style={{ color: '#888', fontSize: '13px' }}>Loading...</p>}

          {/* Month-by-month for this employee */}
          {empData.history?.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Month','Days','LOP','Gross','PF','TDS','LOP Deduct','Net Pay'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: '11px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {empData.history.map((h, i) => (
                    <tr key={h.month} style={{ borderTop: '1px solid #f1f5f9', background: i%2===0?'#fff':'#fafafa' }}>
                      <td style={td}><strong>{MONTH_NAMES_ARR[h.month]} {h.year}</strong></td>
                      <td style={td}>{h.present_days}/{h.working_days}</td>
                      <td style={td}>
                        {h.lop_days > 0
                          ? <span style={{ color: '#dc2626', fontWeight: 700 }}>{h.lop_days}d</span>
                          : <span style={{ color: '#aaa' }}>—</span>
                        }
                      </td>
                      <td style={td}>{fmt(h.gross)}</td>
                      <td style={{ ...td, color: '#7c3aed' }}>{fmt(h.pf_employee)}</td>
                      <td style={{ ...td, color: '#dc2626' }}>{h.tds > 0 ? fmt(h.tds) : '—'}</td>
                      <td style={{ ...td, color: h.lop_deduction > 0 ? '#f59e0b' : '#aaa', fontWeight: h.lop_deduction > 0 ? 700 : 400 }}>
                        {h.lop_deduction > 0 ? fmt(h.lop_deduction) : '—'}
                      </td>
                      <td style={{ ...td, color: '#16a34a', fontWeight: 800 }}>{fmt(h.net_pay)}</td>
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


// ─────────────────────────────────────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px', cursor: onClick ? 'pointer' : 'default', borderLeft: `4px solid ${color}`, transition: 'box-shadow 0.15s' }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
    >
      <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>{icon} {label}</p>
      <p style={{ margin: '5px 0 2px', fontSize: '20px', fontWeight: 800, color }}>{value}</p>
      <p style={{ margin: 0, fontSize: '11px', color: '#aaa' }}>{sub}</p>
    </div>
  )
}

const td      = { padding: '10px 12px', color: '#333', verticalAlign: 'middle' }
const selStyle = { padding: '5px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '12px', outline: 'none' }