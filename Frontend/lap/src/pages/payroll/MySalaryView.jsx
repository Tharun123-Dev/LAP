// src/pages/payroll/MySalaryView.jsx
import { useEffect, useState } from 'react'
import { getMySalaryApi } from '../../api/services/payroll'
import toast from 'react-hot-toast'

const fmt = v => `₹${parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

export default function MySalaryView() {
  const [s, setS]         = useState(null)
  const [loading, setLd]  = useState(false)

  useEffect(() => {
    setLd(true)
    getMySalaryApi()
      .then(r => setS(r.data))
      .catch(e => {
        if (e.response?.status !== 404) toast.error('Failed to load')
      })
      .finally(() => setLd(false))
  }, [])

  if (loading) return <p style={{ color: '#888' }}>Loading...</p>
  if (!s) return (
    <div style={{ textAlign: 'center', padding: '60px', color: '#aaa', background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
      No salary structure assigned yet. Contact HR.
    </div>
  )

  const earnings = [
    ['Basic Salary', s.basic], ['HRA', s.hra], ['DA', s.da],
    ['Special Allowance', s.special_allowance], ['Transport', s.transport],
    ['Medical', s.medical], ['Other Allowance', s.other_allowance],
  ].filter(([, v]) => parseFloat(v) > 0)

  const deductions = [
    ['PF (Employee 12%)', s.pf_employee], ['ESI (Employee)', s.esi_employee],
    ['Professional Tax', s.pt],
  ].filter(([, v]) => parseFloat(v) > 0)

  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>

        {/* CTC banner */}
        <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)', padding: '22px 24px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Annual CTC</p>
            <p style={{ margin: 0, fontSize: '28px', fontWeight: 900 }}>{fmt(s.ctc)}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Monthly Take-Home</p>
            <p style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#86efac' }}>{fmt(s.net_pay)}</p>
          </div>
        </div>

        <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          {/* Earnings */}
          <div>
            <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>Monthly Earnings</p>
            {earnings.map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '13px', color: '#555' }}>{l}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>{fmt(v)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', borderTop: '2px solid #e5e7eb', marginTop: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700 }}>Gross</span>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#1d4ed8' }}>{fmt(s.gross)}</span>
            </div>
          </div>

          {/* Deductions */}
          <div>
            <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>Deductions</p>
            {deductions.map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '13px', color: '#555' }}>{l}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#dc2626' }}>{fmt(v)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', borderTop: '2px solid #e5e7eb', marginTop: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700 }}>Total Deductions</span>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#dc2626' }}>{fmt(s.total_deductions)}</span>
            </div>
          </div>
        </div>

        <div style={{ background: '#f0fdf4', borderTop: '1px solid #bbf7d0', padding: '14px 24px', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, color: '#166534' }}>Monthly Net Pay</span>
          <span style={{ fontWeight: 900, fontSize: '18px', color: '#166534' }}>{fmt(s.net_pay)}</span>
        </div>
      </div>

      <p style={{ marginTop: '12px', fontSize: '12px', color: '#aaa', textAlign: 'center' }}>
        Effective from {s.effective_date} · Contact HR for salary revision queries
      </p>
    </div>
  )
}