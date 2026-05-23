// src/pages/leave/BalanceDashboard.jsx
import { useEffect, useState } from 'react'
import { getMyBalanceApi } from '../../api/services/leave'
import toast from 'react-hot-toast'

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#0ea5e9','#f97316']

export default function BalanceDashboard() {
  const [balances, setBalances] = useState([])
  const [loading,  setLoading]  = useState(false)
  const year = new Date().getFullYear()

  useEffect(() => {
    setLoading(true)
    getMyBalanceApi(year)
      .then(r => setBalances(r.data))
      .catch(() => toast.error('Failed to load balance'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton />

  const totalAvail = balances.reduce((s, b) => s + parseFloat(b.remaining || 0), 0)
  const totalUsed  = balances.reduce((s, b) => s + parseFloat(b.used || 0), 0)

  return (
    <div>
      {/* Summary bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Available Days', value: totalAvail.toFixed(1), color: '#16a34a', icon: '🌿' },
          { label: 'Used This Year', value: totalUsed.toFixed(1),  color: '#dc2626', icon: '📌' },
          { label: 'Leave Types',    value: balances.length,        color: '#7c3aed', icon: '📋' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '28px' }}>{s.icon}</span>
            <div>
              <p style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: s.color }}>{s.value}</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Balance cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
        {balances.map((b, i) => {
          const color   = COLORS[i % COLORS.length]
          const total   = parseFloat(b.total)
          const used    = parseFloat(b.used)
          const pending = parseFloat(b.pending)
          const rem     = parseFloat(b.remaining)
          const pct     = total > 0 ? Math.min((used / total) * 100, 100) : 0

          return (
            <div key={b.id} style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e5e7eb', padding: '20px', overflow: 'hidden', position: 'relative' }}>
              {/* Color top bar */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: color }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#111' }}>{b.leave_type_name}</h4>
                  <span style={{ fontSize: '11px', color: '#aaa' }}>{b.leave_type_code} · {b.is_paid ? 'Paid' : 'Unpaid'}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '24px', fontWeight: 800, color }}>{rem}</p>
                  <p style={{ margin: 0, fontSize: '10px', color: '#aaa' }}>of {total} days</p>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '3px', marginBottom: '12px' }}>
                <div style={{ height: '6px', borderRadius: '3px', background: color, width: `${pct}%`, transition: 'width 0.5s' }} />
              </div>

              {/* Stats row */}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {[
                  { label: 'Used',      val: used,    color: '#dc2626' },
                  { label: 'Pending',   val: pending, color: '#d97706' },
                  { label: 'Available', val: rem,     color: '#16a34a' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: s.color }}>{s.val}</p>
                    <p style={{ margin: 0, fontSize: '10px', color: '#aaa' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {balances.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '48px', color: '#aaa' }}>
          No leave balances found for {year}
        </div>
      )}
    </div>
  )
}

function Skeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
      {[1,2,3,4].map(i => (
        <div key={i} style={{ background: '#f3f4f6', borderRadius: '14px', height: '140px', animation: 'pulse 1.5s infinite' }} />
      ))}
    </div>
  )
}