// src/pages/payroll/MySalaryView.jsx  — FULL REPLACEMENT v2
import { useEffect, useState } from 'react'
import { getMySalaryApi } from '../../api/services/payroll'

const fmt = (v) => `₹${parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
const n   = (v) => parseFloat(v || 0)

export default function MySalaryView() {
  const [salary,  setSalary]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [empty,   setEmpty]   = useState(false)

  useEffect(() => {
    getMySalaryApi()
      .then(r => { if (r.data) setSalary(r.data); else setEmpty(true) })
      .catch(() => setEmpty(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={S.center}><p style={{ color: '#888' }}>Loading…</p></div>
  if (empty || !salary) return (
    <div style={S.center}>
      <div style={{ fontSize: '48px', marginBottom: '8px' }}>💼</div>
      <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#333' }}>No Salary Structure Assigned</p>
      <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#888', textAlign: 'center', maxWidth: '320px' }}>Contact HR to configure your salary.</p>
    </div>
  )

  const workingDays = 22
  const perDay  = n(salary.gross) / workingDays
  const otRate  = (perDay / 8) * 1.5

  const earnings = [
    { label: 'Basic Salary',              value: salary.basic,             note: 'Foundation component' },
    { label: 'HRA',                       value: salary.hra,               note: 'House Rent Allowance' },
    { label: 'Dearness Allowance (DA)',   value: salary.da,                note: 'Cost-of-living component' },
    { label: 'Special Allowance',         value: salary.special_allowance, note: null },
    { label: 'Transport Allowance',       value: salary.transport,         note: null },
    { label: 'Medical Allowance',         value: salary.medical,           note: 'Up to ₹15,000/yr tax-free' },
    { label: 'Other Allowance',           value: salary.other_allowance,   note: null },
  ].filter(e => n(e.value) > 0)

  const deductions = [
    { label: 'PF — Employee Share',       value: salary.pf_employee,  note: '12% of Basic → EPF account', color: '#7c3aed' },
    { label: 'ESI — Employee Share',      value: salary.esi_employee, note: '0.75% of gross (if ≤ ₹21,000/mo)', color: '#2563eb' },
    { label: 'Professional Tax (PT)',     value: salary.pt,           note: 'State statutory deduction', color: '#0891b2' },
  ].filter(d => n(d.value) > 0)

  const employerContribs = [
    { label: 'PF — Employer Share',  value: salary.pf_employer,  note: '12% → adds to your EPF' },
    { label: 'ESI — Employer Share', value: salary.esi_employer, note: '3.25% — medical insurance' },
  ].filter(e => n(e.value) > 0)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#111' }}>My Salary Structure</h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#888' }}>Effective from {salary.effective_date}</p>
        </div>
        <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#0f3460)', borderRadius: '12px', padding: '12px 20px', textAlign: 'right' }}>
          <span style={{ display: 'block', fontSize: '10px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Annual CTC</span>
          <span style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>{fmt(salary.ctc)}</span>
        </div>
      </div>

      {/* OT Rate */}
      <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>⏱</span>
          <div>
            <p style={{ margin: 0, fontSize: '11px', color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase' }}>Overtime Rate</p>
            <p style={{ margin: '2px 0 0', fontSize: '15px', fontWeight: 800, color: '#6b21a8' }}>
              ₹{otRate.toLocaleString('en-IN', { maximumFractionDigits: 2 })}/hr
            </p>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: '12px', color: '#7c3aed', opacity: 0.8 }}>
          = (Basic ÷ {workingDays} days ÷ 8 hrs) × 1.5 multiplier
        </p>
      </div>

      {/* Earnings & Deductions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <div style={S.card}>
          <p style={S.cardTitle}>💰 Earnings</p>
          {earnings.map(e => (
            <div key={e.label} style={S.row}>
              <div>
                <span style={{ fontSize: '13px', color: '#555' }}>{e.label}</span>
                {e.note && <p style={{ margin: '1px 0 0', fontSize: '10px', color: '#aaa' }}>{e.note}</p>}
              </div>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#111' }}>{fmt(e.value)}</span>
            </div>
          ))}
          <div style={{ borderTop: '2px solid #e5e7eb', marginTop: '8px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 700 }}>Gross Monthly</span>
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#1d4ed8' }}>{fmt(salary.gross)}</span>
          </div>
        </div>

        <div style={S.card}>
          <p style={S.cardTitle}>📉 Deductions (Monthly)</p>
          {deductions.map(d => (
            <div key={d.label} style={S.row}>
              <div>
                <span style={{ fontSize: '13px', color: '#555' }}>{d.label}</span>
                {d.note && <p style={{ margin: '1px 0 0', fontSize: '10px', color: '#aaa' }}>{d.note}</p>}
              </div>
              <span style={{ fontSize: '13px', fontWeight: 500, color: d.color }}>{fmt(d.value)}</span>
            </div>
          ))}
          <div style={{ borderTop: '2px solid #e5e7eb', marginTop: '8px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 700 }}>Total Deductions</span>
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#dc2626' }}>{fmt(salary.total_deductions)}</span>
          </div>
          <div style={{ marginTop: '12px', padding: '10px 12px', background: '#fffbeb', borderRadius: '8px', fontSize: '11px', color: '#92400e' }}>
            <strong>Note:</strong> TDS and LOP are computed monthly based on actual attendance and income.
          </div>
        </div>
      </div>

      {/* Employer contributions */}
      {employerContribs.length > 0 && (
        <div style={{ ...S.card, marginBottom: '16px' }}>
          <p style={S.cardTitle}>🏢 Employer Contributions (in CTC, not deducted from salary)</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {employerContribs.map(e => (
              <div key={e.label} style={{ background: '#f0fdf4', borderRadius: '8px', padding: '10px 14px', minWidth: '180px' }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>{e.label}</p>
                <p style={{ margin: '2px 0 0', fontSize: '15px', fontWeight: 700, color: '#16a34a' }}>{fmt(e.value)}</p>
                <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#aaa' }}>{e.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Net pay bar */}
      <div style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', borderRadius: '14px', padding: '20px 26px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Monthly Net Pay (base — no LOP/OT/TDS)</p>
          <p style={{ margin: '6px 0 0', fontSize: '28px', fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>{fmt(salary.net_pay)}</p>
        </div>
        <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: '12px', lineHeight: '1.7' }}>
          <div>Gross: {fmt(salary.gross)}</div>
          <div>Deductions: {fmt(salary.total_deductions)}</div>
        </div>
      </div>
    </div>
  )
}

const S = {
  center:    { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '8px' },
  card:      { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '18px 20px' },
  cardTitle: { margin: '0 0 14px', fontSize: '12px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' },
  row:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '7px 0', borderBottom: '1px solid #f1f5f9' },
}