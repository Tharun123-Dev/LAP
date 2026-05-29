// src/pages/payroll/PayslipModal.jsx — FULL REPLACEMENT
// company_name, company_logo_url, currency all dynamic from SystemSettings
// Nothing else changed — all payroll logic preserved exactly
import { useEffect, useState } from 'react'
import { getPayrollSettingsDefaultsApi } from '../../api/services/payroll'
import systemSettingsService from '../../api/services/systemsettings'

const MONTHS = ['','January','February','March','April','May','June','July','August','September','October','November','December']

// ─── Currency helpers ─────────────────────────────────────────────────────────
// Maps known currency codes to their symbols
const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ',
  SGD: 'S$',
  JPY: '¥',
  CAD: 'CA$',
  AUD: 'A$',
}

// Formats a number with the correct currency symbol and locale
// e.g. fmtCurrency(50000, 'INR') → '₹50,000.00'
//      fmtCurrency(50000, 'USD') → '$50,000.00'
function makeFmt(currency) {
  const symbol = CURRENCY_SYMBOLS[currency] || currency + ' '
  return (v) => `${symbol}${parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

const fmtD = v => parseFloat(v || 0).toFixed(1)
const n    = v => parseFloat(v || 0)

export default function PayslipModal({ entry, onClose }) {
  const [settings,  setSettings]  = useState(null)   // payroll settings (PF%, ESI%, etc.)
  const [general,   setGeneral]   = useState(null)   // general settings (company name, logo, currency)

  useEffect(() => {
    // Fetch both payroll settings and general/branding settings in parallel
    Promise.all([
      getPayrollSettingsDefaultsApi().catch(() => ({ data: {} })),
      systemSettingsService.getGeneral().catch(() => ({})),
    ]).then(([payrollRes, generalData]) => {
      setSettings(payrollRes.data)
      setGeneral(generalData)
    })
  }, [])

  // ── Derived branding values ───────────────────────────────────────────────
  const companyName = general?.company_name    || 'LAP Systems'
  const logoUrl     = general?.company_logo_url || ''
  const currency    = general?.currency         || 'INR'
  const fmt         = makeFmt(currency)   // ← all prices use this now

  const run       = entry.payroll_run && typeof entry.payroll_run === 'object' ? entry.payroll_run : {}
  const monthName = run.month ? `${MONTHS[run.month]} ${run.year}` : 'Payslip'
  const splitLabel = run.period_start && run.period_end && run.period_label !== 'Full month'
    ? `${run.period_start} to ${run.period_end}`
    : ''
  const hasLOP    = n(entry.lop_days) > 0
  const hasOT     = n(entry.ot_hours) > 0
  const hasExtra  = n(entry.extra_work_days) > 0
  const hasAdj    = entry.adjustments?.length > 0

  // Live rates from payroll settings
  const pfPct     = settings?.pf_employee_percent  ?? 12
  const esiPct    = settings?.esi_employee_percent ?? 0.75
  const esiThr    = settings?.esi_threshold        ?? 21000
  const otMult    = settings?.overtime_multiplier  ?? 1.5
  const daPct     = settings?.da_percent           ?? 10

  const esiExempt = n(entry.esi_employee) === 0 && n(entry.gross) > 0 && n(entry.gross) > esiThr

  const lopPerDay = (n(entry.working_days) > 0 && n(entry.gross) > 0)
    ? (n(entry.gross) - n(entry.ot_pay)) / n(entry.working_days)
    : 0

  const earnings = [
    { label: 'Basic Salary',                                                        value: entry.basic },
    { label: 'House Rent Allowance (HRA)',                                          value: entry.hra },
    { label: `Dearness Allowance (DA) — ${daPct}% of Basic`,                        value: entry.da },
    { label: 'Special Allowance',                                                   value: entry.special_allowance },
    { label: 'Transport Allowance',                                                 value: entry.transport },
    { label: 'Medical Allowance',                                                   value: entry.medical },
    { label: 'Other Allowance',                                                     value: entry.other_allowance },
    { label: `Overtime Pay (${fmtD(entry.ot_hours)} hrs × ${otMult}× multiplier)`, value: entry.ot_pay, accent: '#7c3aed' },
    { label: `Extra Work Pay (${fmtD(entry.extra_work_days)} weekend/holiday day)`, value: entry.extra_work_pay, accent: '#0f766e' },
  ].filter(e => n(e.value) > 0)

  const deductions = [
    {
      label: `PF — Employee (${pfPct}% of Basic)`,
      note:  `${fmt(entry.basic)} × ${pfPct}% × (${fmtD(entry.present_days)} / ${entry.working_days} days) = ${fmt(entry.pf_employee)}`,
      value: entry.pf_employee, color: '#7c3aed',
    },
    {
      label: esiExempt
        ? `ESI — Exempt (gross ${fmt(entry.gross)} > threshold ${n(esiThr).toLocaleString('en-IN')})`
        : `ESI — Employee (${esiPct}% of Gross, prorated)`,
      note: esiExempt
        ? 'Salary above ESI eligibility threshold — no ESI deducted.'
        : `Effective gross × ${esiPct}% × (${fmtD(entry.present_days)} / ${entry.working_days} days)`,
      value: entry.esi_employee, color: '#2563eb',
      hide: esiExempt && n(entry.esi_employee) === 0,
    },
    {
      label: 'Professional Tax (PT) — slab-based',
      note:  `Applied on effective gross ${fmt(n(entry.gross) - n(entry.lop_deduction))} · prorated by days worked`,
      value: entry.pt, color: '#0891b2',
    },
    {
      label: 'Tax Deducted at Source (TDS)',
      note:  'Annual income slab computation (New Tax Regime) ÷ 12',
      value: entry.tds, color: '#dc2626',
    },
    {
      label: `Loss of Pay — ${fmtD(entry.lop_days)} day(s)`,
      note:  `(Gross − OT) ÷ ${entry.working_days} working days × ${fmtD(entry.lop_days)} LOP days = ${fmt(lopPerDay)}/day × ${fmtD(entry.lop_days)}`,
      value: entry.lop_deduction, color: '#ea580c', isLop: true,
    },
  ].filter(d => n(d.value) > 0 && !d.hide)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px', overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '800px', overflow: 'hidden', fontFamily: 'Inter,sans-serif', margin: 'auto', boxShadow: '0 25px 80px rgba(0,0,0,0.3)' }}>

        {/* ── Header — dynamic company name + logo ── */}
        <div style={{ background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)', padding: '26px 30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {/* Logo: shown only if company_logo_url is set */}
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt={companyName}
                  onError={e => { e.target.style.display = 'none' }}   // hide if URL broken
                  style={{ height: '44px', maxWidth: '120px', objectFit: 'contain', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', padding: '4px' }}
                />
              )}
              <div>
                {/* Company name from SystemSettings → company_name */}
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#fff' }}>{companyName}</h2>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>Leave · Attendance · Payroll</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Payslip for</p>
              <p style={{ margin: '4px 0 0', fontSize: '22px', fontWeight: 700, color: '#fff' }}>{monthName}</p>
              {splitLabel && <p style={{ margin: '3px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.65)' }}>{splitLabel}</p>}
              {/* Currency badge — so reader knows which currency is used */}
              {currency !== 'INR' && (
                <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '10px', background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '2px 8px', borderRadius: '20px' }}>
                  {currency}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Employee info ── */}
        <div style={{ padding: '18px 30px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: '14px' }}>
            {[
              { l: 'Employee',     v: entry.employee_name || '—' },
              { l: 'Emp Code',     v: entry.emp_code      || '—' },
              { l: 'Department',   v: entry.department    || '—' },
              { l: 'Working Days', v: `${entry.working_days} days` },
              { l: 'Holidays',     v: entry.holiday_count > 0 ? `${entry.holiday_count} day(s)` : '—', accent: entry.holiday_count > 0 ? '#1e40af' : null },
              { l: 'Days Present', v: `${fmtD(entry.present_days)} days` },
              { l: 'LOP Days',     v: `${fmtD(entry.lop_days)} days`, accent: hasLOP ? '#dc2626' : null },
              { l: 'OT Hours',     v: hasOT ? `${fmtD(entry.ot_hours)} hrs` : '—', accent: hasOT ? '#7c3aed' : null },
              { l: 'Extra Work',   v: hasExtra ? `${fmtD(entry.extra_work_days)} day(s)` : '—', accent: hasExtra ? '#0f766e' : null },
              { l: 'Comp-Off Used', v: n(entry.comp_off_days) > 0 ? `${fmtD(entry.comp_off_days)} day(s)` : '—', accent: n(entry.comp_off_days) > 0 ? '#6366f1' : null },
            ].map(f => (
              <div key={f.l}>
                <p style={{ margin: 0, fontSize: '10px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f.l}</p>
                <p style={{ margin: '3px 0 0', fontSize: '13px', fontWeight: 600, color: f.accent || '#111' }}>{f.v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Live rates applied this payroll ── */}
        <div style={{ padding: '10px 30px', background: '#f5f3ff', borderBottom: '1px solid #ede9fe' }}>
          <p style={{ margin: '0 0 6px', fontSize: '10px', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            📐 Rates Applied This Month (from System Settings)
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '11px', color: '#6b21a8' }}>
            <span>Basic: <strong>{pfPct}% PF</strong></span>
            <span>DA: <strong>{daPct}% of Basic</strong></span>
            <span>PF (Emp): <strong>{pfPct}% of Basic</strong></span>
            {!esiExempt && <span>ESI (Emp): <strong>{esiPct}% of Gross</strong></span>}
            {esiExempt  && <span>ESI: <strong>Exempt (gross &gt; {n(esiThr).toLocaleString('en-IN')})</strong></span>}
            {hasOT      && <span>OT: <strong>{otMult}× multiplier</strong></span>}
            {hasLOP     && <span>LOP rate: <strong>{fmt(lopPerDay)}/day</strong></span>}
            {/* Show currency in use */}
            <span>Currency: <strong>{currency} ({CURRENCY_SYMBOLS[currency] || currency})</strong></span>
          </div>
        </div>

        {/* ── LOP alert ── */}
        {hasLOP && (
          <div style={{ padding: '11px 30px', background: '#fff7ed', borderBottom: '2px solid #fed7aa', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <p style={{ margin: 0, fontSize: '13px', color: '#9a3412' }}>
              <strong>{fmtD(entry.lop_days)} Loss-of-Pay day(s)</strong> deducted.
              Rate: <strong>{fmt(lopPerDay)}/day</strong> (Gross ÷ {entry.working_days} working days).
              Total LOP deduction: <strong>{fmt(entry.lop_deduction)}</strong>
            </p>
          </div>
        )}

        {/* ── Holiday info ── */}
        {entry.holiday_count > 0 && (
          <div style={{ padding: '11px 30px', background: '#eff6ff', borderBottom: '2px solid #bfdbfe', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>🗓</span>
            <div>
              <p style={{ margin: 0, fontSize: '13px', color: '#1e40af', fontWeight: 600 }}>
                {entry.holiday_count} Public Holiday{entry.holiday_count > 1 ? 's' : ''} this month — counted as present (no LOP)
              </p>
              {entry.holiday_names?.length > 0 && (
                <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#3b82f6' }}>
                  {entry.holiday_names.join(' · ')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── OT info ── */}
        {hasExtra && (
          <div style={{ padding: '11px 30px', background: '#f0fdfa', borderBottom: '2px solid #99f6e4', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>+</span>
            <div>
              <p style={{ margin: 0, fontSize: '13px', color: '#0f766e', fontWeight: 600 }}>
                Extra work pay: {fmt(entry.extra_work_pay)} for {fmtD(entry.extra_work_days)} weekend/holiday day(s)
              </p>
              {entry.extra_work_dates?.length > 0 && (
                <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#0f766e' }}>
                  {entry.extra_work_dates.filter(d => d.payable).map(d => `${d.date} (${d.type})`).join(' · ')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── OT info ── */}
        {hasOT && (
          <div style={{ padding: '11px 30px', background: '#faf5ff', borderBottom: '2px solid #e9d5ff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>⏱</span>
            <p style={{ margin: 0, fontSize: '13px', color: '#6b21a8' }}>
              <strong>{fmtD(entry.ot_hours)} OT hour(s)</strong> — OT Pay <strong>{fmt(entry.ot_pay)}</strong>
              = Basic ÷ ({entry.working_days} days × 8 hrs) × {otMult} × {fmtD(entry.ot_hours)}h
            </p>
          </div>
        )}

        {/* ── Earnings + Deductions ── */}
        <div style={{ padding: '22px 30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '28px' }}>
          <div>
            <p style={sT}>💰 Earnings</p>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {earnings.map(e => (
                  <tr key={e.label} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '7px 0', fontSize: '13px', color: e.accent || '#555' }}>{e.label}</td>
                    <td style={{ padding: '7px 0', fontSize: '13px', fontWeight: 500, color: e.accent || '#111', textAlign: 'right' }}>{fmt(e.value)}</td>
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
            <p style={sT}>📉 Deductions</p>
            {deductions.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#aaa', marginTop: '8px' }}>No deductions this month.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {deductions.map(d => (
                    <tr key={d.label} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px 0', verticalAlign: 'top' }}>
                        <div style={{ fontSize: '13px', color: d.isLop ? d.color : '#555' }}>
                          {d.isLop && <span style={{ marginRight: '4px' }}>⚡</span>}{d.label}
                        </div>
                        {d.note && <div style={{ fontSize: '10px', color: '#aaa', marginTop: '2px', lineHeight: 1.4 }}>{d.note}</div>}
                      </td>
                      <td style={{ padding: '6px 0', fontSize: '13px', fontWeight: 600, color: d.color, textAlign: 'right', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                        −{fmt(d.value)}
                      </td>
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

        {/* ── Net Pay Formula ── */}
        <div style={{ padding: '11px 30px', background: '#f8fafc', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#888', textAlign: 'center', lineHeight: 1.8 }}>
            {entry.holiday_count > 0 && (
              <span style={{ display: 'block', color: '#1e40af', fontSize: '11px', marginBottom: '4px' }}>
                🗓 {entry.holiday_count} holiday{entry.holiday_count > 1 ? 's' : ''} counted as present
                {entry.holiday_names?.length > 0 ? ` (${entry.holiday_names.join(', ')})` : ''}
              </span>
            )}
            <strong>Net Pay</strong> = Gross {fmt(entry.gross)}
            {hasLOP && <span style={{ color: '#ea580c' }}> − LOP {fmt(entry.lop_deduction)}</span>}
            {n(entry.pf_employee)  > 0 && <span> − PF {fmt(entry.pf_employee)}</span>}
            {n(entry.esi_employee) > 0 && <span> − ESI {fmt(entry.esi_employee)}</span>}
            {n(entry.pt)           > 0 && <span> − PT {fmt(entry.pt)}</span>}
            {n(entry.tds)          > 0 && <span style={{ color: '#dc2626' }}> − TDS {fmt(entry.tds)}</span>}
            {' = '}<strong style={{ color: '#16a34a', fontSize: '14px' }}>{fmt(entry.net_pay)}</strong>
          </p>
        </div>

        {/* ── Manual Adjustments ── */}
        {hasAdj && (
          <div style={{ padding: '16px 30px', borderBottom: '1px solid #e5e7eb' }}>
            <p style={sT}>⚙️ Manual Adjustments</p>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {entry.adjustments.map((adj, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 0', fontSize: '13px', color: '#555', textTransform: 'capitalize' }}>{adj.type} — {adj.reason}</td>
                    <td style={{ padding: '6px 0', fontSize: '13px', fontWeight: 600, textAlign: 'right', color: adj.type === 'deduction' ? '#dc2626' : '#16a34a' }}>
                      {adj.type === 'deduction' ? '−' : '+'}{fmt(adj.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Net Pay Banner ── */}
        <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', borderTop: '2px solid #bbf7d0', padding: '22px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <p style={{ margin: 0, fontSize: '12px', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Net Pay (Take Home)</p>
            <p style={{ margin: '6px 0 0', fontSize: '34px', fontWeight: 900, color: '#166534', letterSpacing: '-1.5px' }}>{fmt(entry.net_pay)}</p>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#4ade80' }}>{MONTHS[run.month]} {run.year} · {entry.employee_name} · {companyName}</p>
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

const sT = { margin: '0 0 12px', fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }
