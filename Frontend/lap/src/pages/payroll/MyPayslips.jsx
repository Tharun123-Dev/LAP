// src/pages/payroll/MyPayslips.jsx
import { useEffect, useState } from 'react'
import { getMyPayslipsApi } from '../../api/services/payroll'
import toast from 'react-hot-toast'
import PayslipModal from './PayslipModal'

const MONTH_NAMES = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

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

  if (loading) return <p style={{ color: '#888' }}>Loading...</p>

  // YTD summary
  const ytd = payslips.reduce((acc, p) => ({
    gross: acc.gross + parseFloat(p.gross || 0),
    net:   acc.net   + parseFloat(p.net_pay || 0),
    pf:    acc.pf    + parseFloat(p.pf_employee || 0),
    tds:   acc.tds   + parseFloat(p.tds || 0),
  }), { gross: 0, net: 0, pf: 0, tds: 0 })

  return (
    <div>
      {/* YTD Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'YTD Gross',  value: `₹${ytd.gross.toLocaleString('en-IN')}`,  color: '#1d4ed8' },
          { label: 'YTD Net',    value: `₹${ytd.net.toLocaleString('en-IN')}`,    color: '#16a34a' },
          { label: 'YTD PF',     value: `₹${ytd.pf.toLocaleString('en-IN')}`,     color: '#7c3aed' },
          { label: 'YTD TDS',    value: `₹${ytd.tds.toLocaleString('en-IN')}`,    color: '#dc2626' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '14px 16px' }}>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: s.color }}>{s.value}</p>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#888' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Payslip list */}
      {payslips.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#aaa', background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '32px', margin: '0 0 10px' }}>🧾</p>
          No payslips available yet
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {payslips.map(p => (
            <div
              key={p.id}
              onClick={() => setSelected(p)}
              style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px 20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  🧾
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: '#111' }}>
                    {MONTH_NAMES[p.payroll_run.month]} {p.payroll_run.year}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#888' }}>
                    {p.present_days} days worked · {p.lop_days} LOP
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '11px', color: '#aaa' }}>Gross</p>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#333' }}>₹{parseFloat(p.gross).toLocaleString('en-IN')}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '11px', color: '#aaa' }}>Deductions</p>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#dc2626' }}>₹{parseFloat(p.total_deductions).toLocaleString('en-IN')}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '11px', color: '#aaa' }}>Net Pay</p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#16a34a' }}>₹{parseFloat(p.net_pay).toLocaleString('en-IN')}</p>
                </div>
              </div>

              <span style={{ fontSize: '12px', color: '#6366f1', fontWeight: 500 }}>View →</span>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <PayslipModal
          entry={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}