// src/pages/payroll/PayslipModal.jsx

const MONTH_NAMES = ['','January','February','March','April','May','June',
                     'July','August','September','October','November','December']

const fmt = (v) => `₹${parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

export default function PayslipModal({ entry, onClose }) {
  const run = entry.payroll_run

  const earnings = [
    { label: 'Basic Salary',       value: entry.basic },
    { label: 'HRA',                value: entry.hra },
    { label: 'DA',                 value: entry.da },
    { label: 'Special Allowance',  value: entry.special_allowance },
    { label: 'Transport Allowance', value: entry.transport },
    { label: 'Medical Allowance',  value: entry.medical },
    { label: 'Other Allowance',    value: entry.other_allowance },
    { label: 'Overtime Pay',       value: entry.ot_pay },
  ].filter(e => parseFloat(e.value) > 0)

  const deductions = [
    { label: 'PF (Employee)',      value: entry.pf_employee },
    { label: 'ESI (Employee)',     value: entry.esi_employee },
    { label: 'Professional Tax',  value: entry.pt },
    { label: 'TDS',                value: entry.tds },
    { label: 'Loss of Pay',        value: entry.lop_deduction },
  ].filter(d => parseFloat(d.value) > 0)

  const handlePrint = () => window.print()

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px', overflowY: 'auto' }}>
      <div id="payslip-print" style={{ background: '#fff', borderRadius: '14px', width: '100%', maxWidth: '680px', overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)', padding: '24px 28px', color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px' }}>LAP Systems</h2>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Leave, Attendance & Payroll</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>Payslip for</p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{MONTH_NAMES[run.month]} {run.year}</p>
            </div>
          </div>
        </div>

        {/* Employee Info */}
        <div style={{ padding: '20px 28px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
            {[
              { label: 'Employee Name', value: entry.employee_name },
              { label: 'Employee Code', value: entry.emp_code },
              { label: 'Department',    value: entry.department || '—' },
              { label: 'Days Worked',   value: `${entry.present_days} / ${entry.working_days}` },
              { label: 'LOP Days',      value: entry.lop_days || 0 },
              { label: 'OT Hours',      value: `${parseFloat(entry.ot_hours || 0).toFixed(1)} hrs` },
            ].map(f => (
              <div key={f.label}>
                <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>{f.label}</p>
                <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 600, color: '#111' }}>{f.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Earnings + Deductions */}
        <div style={{ padding: '20px 28px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          {/* Earnings */}
          <div>
            <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Earnings</p>
            {earnings.map(e => (
              <div key={e.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '13px', color: '#555' }}>{e.label}</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#111' }}>{fmt(e.value)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', marginTop: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>Gross Earnings</span>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#1d4ed8' }}>{fmt(entry.gross)}</span>
            </div>
          </div>

          {/* Deductions */}
          <div>
            <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deductions</p>
            {deductions.map(d => (
              <div key={d.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '13px', color: '#555' }}>{d.label}</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#dc2626' }}>{fmt(d.value)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', marginTop: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>Total Deductions</span>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#dc2626' }}>{fmt(entry.total_deductions)}</span>
            </div>
          </div>
        </div>

        {/* Adjustments */}
        {entry.adjustments?.length > 0 && (
          <div style={{ padding: '0 28px 16px' }}>
            <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>Adjustments</p>
            {entry.adjustments.map(adj => (
              <div key={adj.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '13px', color: '#555' }}>{adj.type.charAt(0).toUpperCase() + adj.type.slice(1)} — {adj.reason}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: adj.type === 'deduction' ? '#dc2626' : '#16a34a' }}>
                  {adj.type === 'deduction' ? '-' : '+'}{fmt(adj.amount)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Net Pay banner */}
        <div style={{ background: '#f0fdf4', borderTop: '2px solid #bbf7d0', padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <p style={{ margin: 0, fontSize: '13px', color: '#166534' }}>Net Pay (Take Home)</p>
            <p style={{ margin: '2px 0 0', fontSize: '28px', fontWeight: 900, color: '#166534', letterSpacing: '-1px' }}>
              {fmt(entry.net_pay)}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handlePrint}
              style={{ padding: '9px 18px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}
            >
              🖨 Print
            </button>
            <button
              onClick={onClose}
              style={{ padding: '9px 16px', background: '#f3f4f6', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}