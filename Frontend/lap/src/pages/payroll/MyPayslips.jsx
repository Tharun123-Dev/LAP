// src/pages/payroll/MyPayslips.jsx  — FULL REPLACEMENT v2
import { useEffect, useState } from 'react'
import { getMyPayslipsApi } from '../../api/services/payroll'
import toast from 'react-hot-toast'
import PayslipModal from './PayslipModal'

const MONTH_NAMES = ['','January','February','March','April','May','June','July','August','September','October','November','December']
const MONTH_SHORT = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const fmt  = (v) => `₹${parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
const n    = (v) => parseFloat(v || 0)
const fmtD = (v) => parseFloat(v || 0).toFixed(1)
const periodLabel = (run) => {
  if (!run?.period_start || !run?.period_end || run.period_label === 'Full month') return ''
  return `${run.period_start} to ${run.period_end}`
}

export default function MyPayslips() {
  const [payslips, setPayslips] = useState([])
  const [loading,  setLoading]  = useState(false)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    setLoading(true)
    getMyPayslipsApi()
      .then(r => setPayslips(r.data))
      .catch(() => toast.error('Failed to load payslips'))
      .finally(() => setLoading(false))
  }, [])

  const getRunField = (p, field) =>
    p.payroll_run && typeof p.payroll_run === 'object' ? p.payroll_run[field] : null

  const ytd = payslips.reduce((acc, p) => ({
    gross:  acc.gross  + n(p.gross),
    net:    acc.net    + n(p.net_pay),
    pf:     acc.pf     + n(p.pf_employee),
    esi:    acc.esi    + n(p.esi_employee),
    tds:    acc.tds    + n(p.tds),
    lop:    acc.lop    + n(p.lop_deduction),
    ot_pay: acc.ot_pay + n(p.ot_pay),
  }), { gross: 0, net: 0, pf: 0, esi: 0, tds: 0, lop: 0, ot_pay: 0 })

  if (loading) return <p style={{ color: '#888', fontSize: '13px' }}>Loading payslips…</p>

  return (
    <div>
      {/* YTD Summary */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Year-to-Date Summary</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
          {[
            { label: 'YTD Gross',   value: ytd.gross,  color: '#1d4ed8', bg: '#eff6ff', icon: '💰' },
            { label: 'OT Paid',     value: ytd.ot_pay, color: '#7c3aed', bg: '#f5f3ff', icon: '⏱' },
            { label: 'YTD Net',     value: ytd.net,    color: '#16a34a', bg: '#f0fdf4', icon: '🏦' },
            { label: 'YTD PF',      value: ytd.pf,     color: '#0891b2', bg: '#ecfeff', icon: '🛡' },
            { label: 'YTD ESI',     value: ytd.esi,    color: '#0891b2', bg: '#ecfeff', icon: '🏥' },
            { label: 'YTD TDS',     value: ytd.tds,    color: '#dc2626', bg: '#fef2f2', icon: '📋' },
            { label: 'YTD LOP Ded', value: ytd.lop,    color: '#ea580c', bg: '#fff7ed', icon: '⚡' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: '12px', padding: '14px 14px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <p style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: s.color }}>
                  ₹{s.value.toLocaleString('en-IN')}
                </p>
                <span style={{ fontSize: '16px' }}>{s.icon}</span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Payslip list */}
      {payslips.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#aaa', background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '40px', margin: '0 0 12px' }}>🧾</p>
          <p style={{ margin: 0, fontWeight: 600, color: '#555', fontSize: '15px' }}>No payslips yet</p>
          <p style={{ margin: '6px 0 0', fontSize: '13px' }}>Payslips appear here once payroll is approved and locked by admin.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {payslips.map(p => {
            const runMonth   = getRunField(p, 'month')
            const runYear    = getRunField(p, 'year')
            const run        = p.payroll_run && typeof p.payroll_run === 'object' ? p.payroll_run : {}
            const monthLabel = runMonth ? `${MONTH_NAMES[runMonth]} ${runYear}` : 'Payslip'
            const splitLabel = periodLabel(run)
            const hasLOP     = n(p.lop_days) > 0
            const hasOT      = n(p.ot_hours) > 0

            return (
              <div
                key={p.id}
                onClick={() => setSelected(p)}
                style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px 20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
                onMouseEnter={e  => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = '#c7d2fe' }}
                onMouseLeave={e  => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e5e7eb' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '10px', background: 'linear-gradient(135deg,#1a1a2e,#0f3460)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🧾</div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: '#111' }}>{monthLabel}</p>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '5px', flexWrap: 'wrap' }}>
                      {splitLabel && <span style={{ fontSize: '11px', color: '#64748b' }}>{splitLabel}</span>}
                      <span style={{ fontSize: '11px', color: '#888' }}>{fmtD(p.present_days)} days worked</span>
                      {hasLOP && <span style={{ padding: '1px 7px', background: '#fff7ed', color: '#ea580c', borderRadius: '5px', fontSize: '11px', fontWeight: 600 }}>⚡ {fmtD(p.lop_days)} LOP</span>}
                      {hasOT  && <span style={{ padding: '1px 7px', background: '#faf5ff', color: '#7c3aed', borderRadius: '5px', fontSize: '11px', fontWeight: 600 }}>⏱ {parseFloat(p.ot_hours).toFixed(1)}h OT</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <Pill label="Gross"      value={fmt(p.gross)}            color="#1d4ed8" />
                  {hasOT  && <Pill label="OT Pay"   value={fmt(p.ot_pay)}          color="#7c3aed" />}
                  {hasLOP && <Pill label="LOP Ded"  value={fmt(p.lop_deduction)}   color="#ea580c" />}
                  <Pill label="Deductions" value={fmt(p.total_deductions)} color="#dc2626" />
                  <Pill label="Net Pay"    value={fmt(p.net_pay)}          color="#16a34a" large />
                  <span style={{ fontSize: '12px', color: '#6366f1', fontWeight: 500 }}>View →</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selected && <PayslipModal entry={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function Pill({ label, value, color, large }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <p style={{ margin: 0, fontSize: '10px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
      <p style={{ margin: '2px 0 0', fontSize: large ? '16px' : '13px', fontWeight: large ? 800 : 600, color }}>{value}</p>
    </div>
  )
}
