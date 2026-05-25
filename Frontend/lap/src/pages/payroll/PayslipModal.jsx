// src/pages/payroll/PayslipModal.jsx  — FULL REPLACEMENT v2
const MONTH_NAMES = ['','January','February','March','April','May','June','July','August','September','October','November','December']
const fmt     = (v) => `₹${parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
const fmtDays = (v) => parseFloat(v || 0).toFixed(1)
const n       = (v) => parseFloat(v || 0)

export default function PayslipModal({ entry, onClose }) {
  const run = entry.payroll_run && typeof entry.payroll_run === 'object'
    ? entry.payroll_run : { month: null, year: null }

  const monthName = run.month ? `${MONTH_NAMES[run.month]} ${run.year}` : 'Payslip'
  const hasLOP = n(entry.lop_days)        > 0
  const hasOT  = n(entry.ot_hours)        > 0
  const hasAdj = entry.adjustments?.length > 0

  const earnings = [
    { label: 'Basic Salary',                       value: entry.basic },
    { label: 'House Rent Allowance (HRA)',          value: entry.hra },
    { label: 'Dearness Allowance (DA)',             value: entry.da },
    { label: 'Special Allowance',                   value: entry.special_allowance },
    { label: 'Transport Allowance',                 value: entry.transport },
    { label: 'Medical Allowance',                   value: entry.medical },
    { label: 'Other Allowance',                     value: entry.other_allowance },
    { label: `Overtime Pay (${fmtDays(entry.ot_hours)} hrs × 1.5×)`,
      value: entry.ot_pay, highlight: '#7c3aed' },
  ].filter(e => n(e.value) > 0)

  const deductions = [
    { label: 'PF — Employee Contribution (12%)',    value: entry.pf_employee,  color: '#7c3aed' },
    { label: 'ESI — Employee Contribution',         value: entry.esi_employee, color: '#2563eb' },
    { label: 'Professional Tax (PT)',               value: entry.pt,           color: '#0891b2' },
    { label: 'Tax Deducted at Source (TDS)',        value: entry.tds,          color: '#dc2626' },
    { label: `Loss of Pay — ${fmtDays(entry.lop_days)} day${n(entry.lop_days) !== 1 ? 's' : ''}`,
      value: entry.lop_deduction, color: '#ea580c', highlight: true },
  ].filter(d => n(d.value) > 0)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px', overflowY: 'auto' }}>
      <div id="payslip-print" style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '740px', overflow: 'hidden', fontFamily: 'Inter, sans-serif', margin: 'auto', boxShadow: '0 25px 80px rgba(0,0,0,0.3)' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)', padding: '26px 30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#fff' }}>LAP Systems</h2>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>Leave · Attendance · Payroll</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Payslip for</p>
              <p style={{ margin: '4px 0 0', fontSize: '22px', fontWeight: 700, color: '#fff' }}>{monthName}</p>
            </div>
          </div>
        </div>

        {/* Employee Info */}
        <div style={{ padding: '20px 30px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
            {[
              { label: 'Employee Name',      value: entry.employee_name || '—' },
              { label: 'Employee Code',      value: entry.emp_code      || '—' },
              { label: 'Department',         value: entry.department    || '—' },
              { label: 'Total Working Days', value: `${entry.working_days} days` },
              { label: 'Days Present',       value: `${fmtDays(entry.present_days)} days` },
              { label: 'LOP Days',           value: `${fmtDays(entry.lop_days)} days`, accent: hasLOP ? '#dc2626' : null },
              { label: 'OT Hours',           value: hasOT ? `${fmtDays(entry.ot_hours)} hrs` : '0 hrs', accent: hasOT ? '#7c3aed' : null },
            ].map(f => (
              <div key={f.label}>
                <p style={{ margin: 0, fontSize: '11px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f.label}</p>
                <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 600, color: f.accent || '#111' }}>{f.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* LOP Alert */}
        {hasLOP && (
          <div style={{ padding: '12px 30px', background: '#fff7ed', borderBottom: '2px solid #fed7aa', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <p style={{ margin: 0, fontSize: '13px', color: '#9a3412' }}>
              <strong>{fmtDays(entry.lop_days)} Loss-of-Pay day(s)</strong> this month. Deduction of <strong>{fmt(entry.lop_deduction)}</strong> applied (per-day rate × {fmtDays(entry.lop_days)} days).
            </p>
          </div>
        )}

        {/* OT Info */}
        {hasOT && (
          <div style={{ padding: '12px 30px', background: '#faf5ff', borderBottom: '2px solid #e9d5ff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>⏱</span>
            <p style={{ margin: 0, fontSize: '13px', color: '#6b21a8' }}>
              <strong>{fmtDays(entry.ot_hours)} overtime hour(s)</strong> — OT Pay of <strong>{fmt(entry.ot_pay)}</strong> added (Basic ÷ (working days × 8) × 1.5 × OT hours).
            </p>
          </div>
        )}

        {/* Earnings + Deductions */}
        <div style={{ padding: '22px 30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '28px' }}>
          <div>
            <p style={secTitle}>💰 Earnings</p>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {earnings.map(e => (
                  <tr key={e.label} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '7px 0', fontSize: '13px', color: e.highlight || '#555' }}>{e.label}</td>
                    <td style={{ padding: '7px 0', fontSize: '13px', fontWeight: 500, color: e.highlight || '#111', textAlign: 'right' }}>{fmt(e.value)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td colSpan={2} style={{ paddingTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 4px', borderTop: '2px solid #e5e7eb' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>Gross Earnings</span>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#1d4ed8' }}>{fmt(entry.gross)}</span>
                  </div>
                </td></tr>
              </tfoot>
            </table>
          </div>

          <div>
            <p style={secTitle}>📉 Deductions</p>
            {deductions.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#aaa', marginTop: '8px' }}>No deductions this month.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {deductions.map(d => (
                    <tr key={d.label} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 0', fontSize: '13px', color: d.highlight ? d.color : '#555' }}>
                        {d.highlight && <span style={{ marginRight: '4px' }}>⚡</span>}{d.label}
                      </td>
                      <td style={{ padding: '7px 0', fontSize: '13px', fontWeight: 600, color: d.color, textAlign: 'right' }}>−{fmt(d.value)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr><td colSpan={2} style={{ paddingTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 4px', borderTop: '2px solid #e5e7eb' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700 }}>Total Deductions</span>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#dc2626' }}>{fmt(entry.total_deductions)}</span>
                    </div>
                  </td></tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>

        {/* Net Pay Formula */}
        <div style={{ padding: '12px 30px', background: '#f8fafc', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#888', textAlign: 'center' }}>
            <strong>Net Pay</strong> = Gross {fmt(entry.gross)}
            {hasLOP && ` − LOP ${fmt(entry.lop_deduction)}`}
            {` − Statutory ${fmt(n(entry.pf_employee) + n(entry.esi_employee) + n(entry.pt) + n(entry.tds))}`}
            {' = '}<strong style={{ color: '#16a34a' }}>{fmt(entry.net_pay)}</strong>
          </p>
        </div>

        {/* Adjustments */}
        {hasAdj && (
          <div style={{ padding: '18px 30px', borderBottom: '1px solid #e5e7eb' }}>
            <p style={secTitle}>⚙️ Adjustments</p>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {entry.adjustments.map((adj, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '7px 0', fontSize: '13px', color: '#555', textTransform: 'capitalize' }}>{adj.type} — {adj.reason}</td>
                    <td style={{ padding: '7px 0', fontSize: '13px', fontWeight: 600, textAlign: 'right', color: adj.type === 'deduction' ? '#dc2626' : '#16a34a' }}>
                      {adj.type === 'deduction' ? '−' : '+'}{fmt(adj.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Net Pay Banner */}
        <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', borderTop: '2px solid #bbf7d0', padding: '22px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <p style={{ margin: 0, fontSize: '12px', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Net Pay (Take Home)</p>
            <p style={{ margin: '6px 0 0', fontSize: '34px', fontWeight: 900, color: '#166534', letterSpacing: '-1.5px' }}>{fmt(entry.net_pay)}</p>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#4ade80' }}>{MONTH_NAMES[run.month]} {run.year} · {entry.employee_name}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => window.print()} style={{ padding: '10px 20px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>🖨 Print</button>
            <button onClick={onClose} style={{ padding: '10px 18px', background: '#fff', color: '#555', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>✕ Close</button>
          </div>
        </div>

      </div>
    </div>
  )
}

const secTitle = { margin: '0 0 12px', fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }