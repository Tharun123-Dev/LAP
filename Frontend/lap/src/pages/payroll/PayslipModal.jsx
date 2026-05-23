// src/pages/payroll/PayslipModal.jsx  — COMPLETE REPLACEMENT
// Fixes: proper LOP display, correct net pay breakdown, clear deduction labeling

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const fmt = (v) =>
  `₹${parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

const fmtDays = (v) => parseFloat(v || 0).toFixed(1)

export default function PayslipModal({ entry, onClose }) {
  const run = (entry.payroll_run && typeof entry.payroll_run === 'object')
    ? entry.payroll_run
    : { month: null, year: null }

  const monthName = run.month
    ? `${MONTH_NAMES[run.month]} ${run.year}`
    : 'Payslip'

  const hasLOP    = parseFloat(entry.lop_days   || 0) > 0
  const hasOT     = parseFloat(entry.ot_hours   || 0) > 0
  const hasAdj    = entry.adjustments?.length    > 0

  const earnings = [
    { label: 'Basic Salary',        value: entry.basic },
    { label: 'HRA',                 value: entry.hra },
    { label: 'Dearness Allowance',  value: entry.da },
    { label: 'Special Allowance',   value: entry.special_allowance },
    { label: 'Transport Allowance', value: entry.transport },
    { label: 'Medical Allowance',   value: entry.medical },
    { label: 'Other Allowance',     value: entry.other_allowance },
    { label: 'Overtime Pay',        value: entry.ot_pay },
  ].filter(e => parseFloat(e.value || 0) > 0)

  const deductions = [
    { label: 'PF (Employee 12%)',   value: entry.pf_employee },
    { label: 'ESI (Employee)',      value: entry.esi_employee },
    { label: 'Professional Tax',   value: entry.pt },
    { label: 'TDS',                value: entry.tds },
    { label: `LOP (${fmtDays(entry.lop_days)} day${parseFloat(entry.lop_days||0) !== 1 ? 's' : ''})`,
      value: entry.lop_deduction, highlight: true },
  ].filter(d => parseFloat(d.value || 0) > 0)

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '16px', overflowY: 'auto'
    }}>
      <div
        id="payslip-print"
        style={{
          background: '#fff', borderRadius: '14px',
          width: '100%', maxWidth: '700px',
          overflow: 'hidden', fontFamily: 'Inter, sans-serif', margin: 'auto'
        }}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg,#1a1a2e,#16213e)',
          padding: '24px 28px', color: '#fff'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>LAP Systems</h2>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                Leave · Attendance · Payroll
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Payslip for</p>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>{monthName}</p>
            </div>
          </div>
        </div>

        {/* ── Employee Info ────────────────────────────────────────────── */}
        <div style={{ padding: '18px 28px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px' }}>
            {[
              { label: 'Employee Name', value: entry.employee_name || '—' },
              { label: 'Employee Code', value: entry.emp_code || '—' },
              { label: 'Department',    value: entry.department || '—' },
              { label: 'Working Days',  value: `${entry.working_days} days` },
              { label: 'Days Present',  value: `${fmtDays(entry.present_days)} days` },
              { label: 'LOP Days',      value: `${fmtDays(entry.lop_days)} days`, highlight: hasLOP },
              { label: 'OT Hours',      value: `${fmtDays(entry.ot_hours)} hrs`,  highlight: hasOT },
            ].map(f => (
              <div key={f.label}>
                <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>{f.label}</p>
                <p style={{
                  margin: '2px 0 0', fontSize: '13px', fontWeight: 600,
                  color: f.highlight ? '#dc2626' : '#111'
                }}>
                  {f.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── LOP Warning ──────────────────────────────────────────────── */}
        {hasLOP && (
          <div style={{
            padding: '12px 28px', background: '#fff7ed',
            borderBottom: '1px solid #fed7aa'
          }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#9a3412' }}>
              ⚠ <strong>{fmtDays(entry.lop_days)} Loss of Pay day(s)</strong> this month —&nbsp;
              <strong>{fmt(entry.lop_deduction)}</strong> deducted from your gross pay.
            </p>
          </div>
        )}

        {/* ── Earnings + Deductions ────────────────────────────────────── */}
        <div style={{
          padding: '20px 28px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '24px'
        }}>
          {/* Earnings */}
          <div>
            <p style={sectionTitle}>Earnings</p>
            {earnings.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#aaa' }}>No earnings recorded</p>
            ) : earnings.map(e => (
              <div key={e.label} style={row}>
                <span style={rowLabel}>{e.label}</span>
                <span style={rowValue}>{fmt(e.value)}</span>
              </div>
            ))}
            <div style={totalRow}>
              <span style={{ fontSize: '13px', fontWeight: 700 }}>Gross Earnings</span>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#1d4ed8' }}>{fmt(entry.gross)}</span>
            </div>
          </div>

          {/* Deductions */}
          <div>
            <p style={sectionTitle}>Deductions</p>
            {deductions.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#aaa' }}>No deductions this month</p>
            ) : deductions.map(d => (
              <div key={d.label} style={row}>
                <span style={{ ...rowLabel, color: d.highlight ? '#dc2626' : '#555' }}>
                  {d.label}
                </span>
                <span style={{ ...rowValue, color: '#dc2626' }}>{fmt(d.value)}</span>
              </div>
            ))}
            <div style={totalRow}>
              <span style={{ fontSize: '13px', fontWeight: 700 }}>Total Deductions</span>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#dc2626' }}>
                {fmt(entry.total_deductions)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Net Pay Formula ──────────────────────────────────────────── */}
        <div style={{
          padding: '10px 28px 16px',
          background: '#f8fafc',
          borderTop: '1px solid #e5e7eb',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#888', textAlign: 'center' }}>
            Net Pay = Gross ({fmt(entry.gross)}) − Deductions ({fmt(entry.total_deductions)})
            {hasLOP && ` including LOP ${fmt(entry.lop_deduction)}`}
          </p>
        </div>

        {/* ── Adjustments ──────────────────────────────────────────────── */}
        {hasAdj && (
          <div style={{ padding: '16px 28px', borderBottom: '1px solid #e5e7eb' }}>
            <p style={sectionTitle}>Adjustments</p>
            {entry.adjustments.map((adj, idx) => (
              <div key={idx} style={row}>
                <span style={{ ...rowLabel, textTransform: 'capitalize' }}>
                  {adj.type} — {adj.reason}
                </span>
                <span style={{
                  ...rowValue,
                  color: adj.type === 'deduction' ? '#dc2626' : '#16a34a'
                }}>
                  {adj.type === 'deduction' ? '−' : '+'}{fmt(adj.amount)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── Net Pay Banner ───────────────────────────────────────────── */}
        <div style={{
          background: '#f0fdf4', borderTop: '2px solid #bbf7d0',
          padding: '20px 28px',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: '12px'
        }}>
          <div>
            <p style={{ margin: 0, fontSize: '13px', color: '#166534' }}>Net Pay (Take Home)</p>
            <p style={{
              margin: '2px 0 0', fontSize: '30px', fontWeight: 900,
              color: '#166534', letterSpacing: '-1px'
            }}>
              {fmt(entry.net_pay)}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => window.print()}
              style={printBtn}
            >
              🖨 Print
            </button>
            <button onClick={onClose} style={closeBtn}>Close</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const sectionTitle = {
  margin: '0 0 12px',
  fontSize: '11px', fontWeight: 700,
  color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em'
}
const row = {
  display: 'flex', justifyContent: 'space-between',
  padding: '7px 0', borderBottom: '1px solid #f1f5f9'
}
const rowLabel  = { fontSize: '13px', color: '#555' }
const rowValue  = { fontSize: '13px', fontWeight: 500, color: '#111' }
const totalRow  = {
  display: 'flex', justifyContent: 'space-between',
  padding: '10px 0 0', marginTop: '4px', borderTop: '2px solid #e5e7eb'
}
const printBtn  = {
  padding: '9px 18px', background: '#1a1a2e', color: '#fff',
  border: 'none', borderRadius: '8px', fontSize: '13px',
  cursor: 'pointer', fontWeight: 600
}
const closeBtn  = {
  padding: '9px 16px', background: '#f3f4f6',
  border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer'
}