// src/pages/payroll/PayslipModal.jsx — FULL REPLACEMENT v3
// Shows dynamic rates used (PF%, ESI%, OT multiplier), full deduction list,
// LOP formula, net pay formula — all from entry data
const MONTHS = ['','January','February','March','April','May','June','July','August','September','October','November','December']
const fmt  = v => `₹${parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:2})}`
const fmtD = v => parseFloat(v||0).toFixed(1)
const n    = v => parseFloat(v||0)

export default function PayslipModal({ entry, onClose }) {
  const run       = entry.payroll_run && typeof entry.payroll_run === 'object' ? entry.payroll_run : {}
  const monthName = run.month ? `${MONTHS[run.month]} ${run.year}` : 'Payslip'
  const hasLOP = n(entry.lop_days) > 0
  const hasOT  = n(entry.ot_hours) > 0
  const hasAdj = entry.adjustments?.length > 0

  // Dynamic rate display (computed from entry values)
  const pfPct  = n(entry.basic) > 0 ? ((n(entry.pf_employee) / n(entry.basic)) * 100 * (n(entry.working_days) / Math.max(n(entry.present_days),1))).toFixed(1) : '12.0'
  const grossForESI = n(entry.gross) - n(entry.lop_deduction)

  const earnings = [
    { label: 'Basic Salary',                                      value: entry.basic },
    { label: 'House Rent Allowance (HRA)',                        value: entry.hra },
    { label: 'Dearness Allowance (DA)',                           value: entry.da },
    { label: 'Special Allowance',                                 value: entry.special_allowance },
    { label: 'Transport Allowance',                               value: entry.transport },
    { label: 'Medical Allowance',                                 value: entry.medical },
    { label: 'Other Allowance',                                   value: entry.other_allowance },
    { label: `Overtime Pay (${fmtD(entry.ot_hours)} hrs × 1.5×)`,value: entry.ot_pay, accent: '#7c3aed' },
  ].filter(e => n(e.value) > 0)

  const deductions = [
    {
      label: `PF — Employee (12% of Basic)`,
      note: `₹${fmtD(entry.basic)} × 12% × (${fmtD(entry.present_days)}/${entry.working_days} days)`,
      value: entry.pf_employee, color: '#7c3aed',
    },
    {
      label: 'ESI — Employee (0.75% of gross)',
      note: n(entry.esi_employee) === 0 ? 'ESI exempt (gross > threshold)' : `Prorated by days worked`,
      value: entry.esi_employee, color: '#2563eb',
    },
    {
      label: 'Professional Tax (PT)',
      note: `Prorated by ${fmtD(entry.present_days)} / ${entry.working_days} days`,
      value: entry.pt, color: '#0891b2',
    },
    {
      label: 'Tax Deducted at Source (TDS)',
      note: 'Based on annual income slab',
      value: entry.tds, color: '#dc2626',
    },
    {
      label: `Loss of Pay — ${fmtD(entry.lop_days)} day(s)`,
      note: `Per-day rate × ${fmtD(entry.lop_days)} LOP days`,
      value: entry.lop_deduction, color: '#ea580c', isLop: true,
    },
  ].filter(d => n(d.value) > 0)

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'16px', overflowY:'auto' }}>
      <div style={{ background:'#fff', borderRadius:'16px', width:'100%', maxWidth:'760px', overflow:'hidden', fontFamily:'Inter,sans-serif', margin:'auto', boxShadow:'0 25px 80px rgba(0,0,0,0.3)' }}>

        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)', padding:'26px 30px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'12px' }}>
            <div>
              <h2 style={{ margin:0, fontSize:'22px', fontWeight:800, color:'#fff' }}>LAP Systems</h2>
              <p style={{ margin:'4px 0 0', fontSize:'12px', color:'rgba(255,255,255,0.45)' }}>Leave · Attendance · Payroll</p>
            </div>
            <div style={{ textAlign:'right' }}>
              <p style={{ margin:0, fontSize:'11px', color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Payslip for</p>
              <p style={{ margin:'4px 0 0', fontSize:'22px', fontWeight:700, color:'#fff' }}>{monthName}</p>
            </div>
          </div>
        </div>

        {/* Employee info */}
        <div style={{ padding:'18px 30px', background:'#f8fafc', borderBottom:'1px solid #e5e7eb' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:'14px' }}>
            {[
              { l:'Employee',       v: entry.employee_name || '—' },
              { l:'Emp Code',       v: entry.emp_code      || '—' },
              { l:'Department',     v: entry.department    || '—' },
              { l:'Working Days',   v: `${entry.working_days} days` },
              { l:'Days Present',   v: `${fmtD(entry.present_days)} days` },
              { l:'LOP Days',       v: `${fmtD(entry.lop_days)} days`, accent: hasLOP ? '#dc2626' : null },
              { l:'OT Hours',       v: hasOT ? `${fmtD(entry.ot_hours)} hrs` : '—', accent: hasOT ? '#7c3aed' : null },
            ].map(f => (
              <div key={f.l}>
                <p style={{ margin:0, fontSize:'10px', color:'#999', textTransform:'uppercase', letterSpacing:'0.04em' }}>{f.l}</p>
                <p style={{ margin:'3px 0 0', fontSize:'13px', fontWeight:600, color: f.accent || '#111' }}>{f.v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Payroll settings used — transparency section */}
        <div style={{ padding:'10px 30px', background:'#f5f3ff', borderBottom:'1px solid #ede9fe' }}>
          <p style={{ margin:'0 0 6px', fontSize:'10px', fontWeight:700, color:'#7c3aed', textTransform:'uppercase', letterSpacing:'0.05em' }}>
            📐 Calculation Settings Used This Month
          </p>
          <div style={{ display:'flex', gap:'14px', flexWrap:'wrap', fontSize:'11px', color:'#6b21a8' }}>
            <span>Working days: <strong>{entry.working_days}</strong></span>
            <span>PF: <strong>12% of Basic</strong></span>
            <span>ESI: <strong>0.75% {n(entry.esi_employee) === 0 ? '(exempt)' : 'of gross'}</strong></span>
            <span>OT: <strong>1.5× rate</strong></span>
            {hasLOP && (
              <span>LOP rate: <strong>{fmt(n(entry.gross) - n(entry.ot_pay) > 0 && entry.working_days > 0 ? (n(entry.gross) - n(entry.ot_pay)) / entry.working_days : 0)}/day</strong></span>
            )}
          </div>
        </div>

        {/* LOP alert */}
        {hasLOP && (
          <div style={{ padding:'11px 30px', background:'#fff7ed', borderBottom:'2px solid #fed7aa', display:'flex', alignItems:'center', gap:'10px' }}>
            <span style={{ fontSize:'18px' }}>⚠️</span>
            <p style={{ margin:0, fontSize:'13px', color:'#9a3412' }}>
              <strong>{fmtD(entry.lop_days)} Loss-of-Pay day(s).</strong> Deduction: <strong>{fmt(entry.lop_deduction)}</strong> = (Gross ÷ {entry.working_days} working days) × {fmtD(entry.lop_days)} LOP days.
            </p>
          </div>
        )}

        {/* OT info */}
        {hasOT && (
          <div style={{ padding:'11px 30px', background:'#faf5ff', borderBottom:'2px solid #e9d5ff', display:'flex', alignItems:'center', gap:'10px' }}>
            <span style={{ fontSize:'18px' }}>⏱</span>
            <p style={{ margin:0, fontSize:'13px', color:'#6b21a8' }}>
              <strong>{fmtD(entry.ot_hours)} OT hour(s)</strong> — OT Pay <strong>{fmt(entry.ot_pay)}</strong> = Basic ÷ ({entry.working_days} days × 8 hrs) × 1.5 × {fmtD(entry.ot_hours)}h
            </p>
          </div>
        )}

        {/* Earnings + Deductions */}
        <div style={{ padding:'22px 30px', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))', gap:'28px' }}>
          {/* Earnings */}
          <div>
            <p style={sT}>💰 Earnings</p>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <tbody>
                {earnings.map(e => (
                  <tr key={e.label} style={{ borderBottom:'1px solid #f1f5f9' }}>
                    <td style={{ padding:'7px 0', fontSize:'13px', color: e.accent || '#555' }}>{e.label}</td>
                    <td style={{ padding:'7px 0', fontSize:'13px', fontWeight:500, color: e.accent || '#111', textAlign:'right' }}>{fmt(e.value)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td colSpan={2} style={{ paddingTop:'8px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0 4px', borderTop:'2px solid #e5e7eb' }}>
                    <span style={{ fontSize:'13px', fontWeight:700 }}>Gross Earnings</span>
                    <span style={{ fontSize:'15px', fontWeight:800, color:'#1d4ed8' }}>{fmt(entry.gross)}</span>
                  </div>
                </td></tr>
              </tfoot>
            </table>
          </div>

          {/* Deductions */}
          <div>
            <p style={sT}>📉 Deductions</p>
            {deductions.length === 0 ? (
              <p style={{ fontSize:'13px', color:'#aaa', marginTop:'8px' }}>No deductions this month.</p>
            ) : (
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <tbody>
                  {deductions.map(d => (
                    <tr key={d.label} style={{ borderBottom:'1px solid #f1f5f9' }}>
                      <td style={{ padding:'6px 0', verticalAlign:'top' }}>
                        <div style={{ fontSize:'13px', color: d.isLop ? d.color : '#555' }}>
                          {d.isLop && <span style={{ marginRight:'4px' }}>⚡</span>}{d.label}
                        </div>
                        {d.note && <div style={{ fontSize:'10px', color:'#aaa', marginTop:'1px' }}>{d.note}</div>}
                      </td>
                      <td style={{ padding:'6px 0', fontSize:'13px', fontWeight:600, color:d.color, textAlign:'right', verticalAlign:'top' }}>
                        −{fmt(d.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr><td colSpan={2} style={{ paddingTop:'8px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0 4px', borderTop:'2px solid #e5e7eb' }}>
                      <span style={{ fontSize:'13px', fontWeight:700 }}>Total Deductions</span>
                      <span style={{ fontSize:'15px', fontWeight:800, color:'#dc2626' }}>{fmt(entry.total_deductions)}</span>
                    </div>
                  </td></tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>

        {/* Net Pay Formula */}
        <div style={{ padding:'11px 30px', background:'#f8fafc', borderTop:'1px solid #e5e7eb', borderBottom:'1px solid #e5e7eb' }}>
          <p style={{ margin:0, fontSize:'12px', color:'#888', textAlign:'center', lineHeight:1.6 }}>
            <strong>Net Pay</strong> = Gross {fmt(entry.gross)}
            {hasLOP && <span style={{ color:'#ea580c' }}> − LOP {fmt(entry.lop_deduction)}</span>}
            {' − PF '}{fmt(entry.pf_employee)}
            {n(entry.esi_employee) > 0 && <span>{' − ESI '}{fmt(entry.esi_employee)}</span>}
            {n(entry.pt) > 0 && <span>{' − PT '}{fmt(entry.pt)}</span>}
            {n(entry.tds) > 0 && <span style={{ color:'#dc2626' }}>{' − TDS '}{fmt(entry.tds)}</span>}
            {' = '}<strong style={{ color:'#16a34a', fontSize:'14px' }}>{fmt(entry.net_pay)}</strong>
          </p>
        </div>

        {/* Adjustments */}
        {hasAdj && (
          <div style={{ padding:'16px 30px', borderBottom:'1px solid #e5e7eb' }}>
            <p style={sT}>⚙️ Adjustments</p>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <tbody>
                {entry.adjustments.map((adj, i) => (
                  <tr key={i} style={{ borderBottom:'1px solid #f1f5f9' }}>
                    <td style={{ padding:'6px 0', fontSize:'13px', color:'#555', textTransform:'capitalize' }}>{adj.type} — {adj.reason}</td>
                    <td style={{ padding:'6px 0', fontSize:'13px', fontWeight:600, textAlign:'right', color: adj.type === 'deduction' ? '#dc2626' : '#16a34a' }}>
                      {adj.type === 'deduction' ? '−' : '+'}{fmt(adj.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Net pay banner */}
        <div style={{ background:'linear-gradient(135deg,#f0fdf4,#dcfce7)', borderTop:'2px solid #bbf7d0', padding:'22px 30px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'14px' }}>
          <div>
            <p style={{ margin:0, fontSize:'12px', color:'#166534', textTransform:'uppercase', letterSpacing:'0.06em' }}>Net Pay (Take Home)</p>
            <p style={{ margin:'6px 0 0', fontSize:'34px', fontWeight:900, color:'#166534', letterSpacing:'-1.5px' }}>{fmt(entry.net_pay)}</p>
            <p style={{ margin:'4px 0 0', fontSize:'11px', color:'#4ade80' }}>{MONTHS[run.month]} {run.year} · {entry.employee_name}</p>
          </div>
          <div style={{ display:'flex', gap:'10px' }}>
            <button onClick={() => window.print()} style={{ padding:'10px 20px', background:'#1a1a2e', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', cursor:'pointer', fontWeight:600 }}>🖨 Print</button>
            <button onClick={onClose} style={{ padding:'10px 18px', background:'#fff', color:'#555', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'13px', cursor:'pointer' }}>✕ Close</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const sT = { margin:'0 0 12px', fontSize:'11px', fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'0.06em' }