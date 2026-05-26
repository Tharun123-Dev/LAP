// src/pages/leave/BalanceDashboard.jsx — FULL REPLACEMENT
// FIX: Auto-inits balances on load (so new leave types appear immediately).
//      Shows correct remaining/used/pending after leave type edits.
//      Added manual refresh button and current-year-only sync on mount.
import { useEffect, useState, useCallback } from 'react'
import { getMyBalanceApi } from '../../api/services/leave'
import systemSettingsService from '../../api/services/systemsettings'
import toast from 'react-hot-toast'

const fmt = (v) => parseFloat(v || 0).toFixed(1)

export default function BalanceDashboard() {
  const thisYear = new Date().getFullYear()
  const [year,          setYear]         = useState(thisYear)
  const [balances,      setBalances]     = useState([])
  const [loading,       setLoading]      = useState(false)
  const [refreshKey,    setRefreshKey]   = useState(0)
  const [lowThreshold,  setLowThreshold] = useState(2)
  const [encashEnabled, setEncashEnabled]= useState(false)


  useEffect(() => {
    systemSettingsService.getAll().then(res => {
      const all = Object.values(res.data).flat()
      const find = key => all.find(s => s.key === key)
      const lt = find('leave_balance_low_threshold')
      if (lt) setLowThreshold(parseInt(lt.value) || 2)
      const enc = find('leave_encashment_enabled')
      if (enc) setEncashEnabled(enc.value === 'true')
      
    }).catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // getMyBalanceApi triggers MyLeaveBalanceView which calls
      // init_balances_for_employee() — so new leave types are auto-added
      const r = await getMyBalanceApi(year)
      setBalances(r.data || [])
    } catch {
      toast.error('Failed to load leave balances')
    } finally {
      setLoading(false)
    }
  }, [year])

  useEffect(() => { load() }, [load, refreshKey])

  const refresh = () => {
    setRefreshKey(k => k + 1)
    toast('Refreshing balances…', { icon: '🔄', duration: 1500 })
  }

  // Sort: no-carry leaves first, then carry-forward leaves
  const sorted = [...balances].sort((a, b) => {
    const aCF = parseFloat(a.carried_forward || a.carried || 0)
    const bCF = parseFloat(b.carried_forward || b.carried || 0)
    if (aCF === 0 && bCF > 0) return -1
    if (aCF > 0 && bCF === 0) return  1
    return (a.leave_type_name || '').localeCompare(b.leave_type_name || '')
  })

  const cfLeaves       = sorted.filter(b => parseFloat(b.remaining || 0) > 0 && b.carry_forward)
  const totalRemaining = balances.reduce((s, b) => s + parseFloat(b.remaining || 0), 0)
  const totalUsed      = balances.reduce((s, b) => s + parseFloat(b.used || 0), 0)
  const totalPending   = balances.reduce((s, b) => s + parseFloat(b.pending || 0), 0)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111' }}>Leave Balance — {year}</h3>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#888' }}>
            {totalRemaining.toFixed(1)} days remaining · {totalUsed.toFixed(1)} used
            {totalPending > 0 && <span style={{ color: '#d97706' }}> · {totalPending.toFixed(1)} pending approval</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={refresh}
            disabled={loading}
            title="Refresh balances (also picks up any new leave types)"
            style={{ padding: '7px 13px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}
          >
            {loading ? '⏳' : '🔄'} Refresh
          </button>
          <button onClick={() => setYear(y => y - 1)} style={navBtn}>◀ {year - 1}</button>
          <span style={{ fontSize: '13px', fontWeight: 700, color: year === thisYear ? '#1d4ed8' : '#888', padding: '6px 12px', background: year === thisYear ? '#eff6ff' : '#f3f4f6', borderRadius: '8px' }}>
            {year === thisYear ? '📅 This Year' : year}
          </span>
          {year < thisYear + 1 && (
            <button onClick={() => setYear(y => y + 1)} style={navBtn}>{year + 1} ▶</button>
          )}
        </div>
      </div>

      {/* Info banners */}
      {year === thisYear && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '10px 16px', marginBottom: '16px', fontSize: '12px', color: '#1e40af' }}>
          📌 <strong>This Year ({year}):</strong> Balances are initialised automatically when you open this page — new leave types added by HR will appear here after a page refresh. Current-year leaves are consumed before carry-forward days.
        </div>
      )}
      {year === thisYear + 1 && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 16px', marginBottom: '16px', fontSize: '12px', color: '#166534' }}>
          🔄 <strong>Next Year ({year}) Preview:</strong> Estimated balances including expected carry-forward from {thisYear}. Final amounts are set after year-end processing.
        </div>
      )}

      {loading ? (
        <p style={{ color: '#888', fontSize: '13px', textAlign: 'center', padding: '40px' }}>Loading balances…</p>
      ) : sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#aaa', background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <p style={{ margin: '0 0 8px', fontSize: '15px' }}>No leave balances found for {year}.</p>
          <p style={{ margin: 0, fontSize: '12px' }}>Click <strong>Refresh</strong> to initialise balances for this year, or contact HR if leave types haven't been configured yet.</p>
        </div>
      ) : (
        <>
          {/* Balance cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            {sorted.map(b => {
              const remaining   = parseFloat(b.remaining || 0)
              const used        = parseFloat(b.used || 0)
              const pending     = parseFloat(b.pending || 0)
              const total       = parseFloat(b.total || 0)
              const carried     = parseFloat(b.carried_forward || b.carried || 0)
              const base        = parseFloat(b.base_allocation || b.leave_type?.days_allowed || total - carried)
              const thisYearRem = parseFloat(b.this_year_remaining ?? Math.min(remaining, base))
              const cfRem       = parseFloat(b.cf_remaining ?? Math.max(remaining - thisYearRem, 0))
              const isLow       = remaining <= lowThreshold && remaining > 0
              const isEmpty     = remaining === 0 && total > 0
              const pct         = total > 0 ? ((used + pending) / total) * 100 : 0

              return (
                <div key={b.id || b.leave_type_id} style={{
                  background: '#fff', borderRadius: '12px',
                  border: `1px solid ${isEmpty ? '#fee2e2' : isLow ? '#fed7aa' : carried > 0 ? '#bfdbfe' : '#e5e7eb'}`,
                  padding: '16px 18px', position: 'relative',
                }}>
                  {/* Type header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#111' }}>
                        {b.leave_type_name || b.leave_type?.name}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#aaa', fontFamily: 'monospace' }}>
                        {b.leave_type_code}
                      </p>
                      <div style={{ display: 'flex', gap: '5px', marginTop: '4px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: b.is_paid ? '#dcfce7' : '#fee2e2', color: b.is_paid ? '#166534' : '#991b1b', fontWeight: 600 }}>
                          {b.is_paid ? 'Paid' : 'Unpaid'}
                        </span>
                        {carried > 0 && (
                          <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: '#dbeafe', color: '#1e40af', fontWeight: 600 }}>
                            🔄 +{fmt(carried)} CF
                          </span>
                        )}
                        {isLow && !isEmpty && (
                          <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: '#fff7ed', color: '#ea580c', fontWeight: 600 }}>
                            ⚠ Low
                          </span>
                        )}
                        {isEmpty && (
                          <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: '#fee2e2', color: '#dc2626', fontWeight: 600 }}>
                            ✕ Exhausted
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: '26px', fontWeight: 900, color: isEmpty ? '#dc2626' : isLow ? '#ea580c' : '#111', lineHeight: 1 }}>
                        {fmt(remaining)}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#aaa' }}>remaining</p>
                    </div>
                  </div>

                  {/* Progress bar (used + pending) */}
                  <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', marginBottom: '12px', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ height: '100%', width: `${Math.min((used / (total || 1)) * 100, 100)}%`, background: '#16a34a', borderRadius: '3px', transition: 'width 0.4s' }} />
                    <div style={{ height: '100%', width: `${Math.min((pending / (total || 1)) * 100, 100)}%`, background: '#fbbf24', transition: 'width 0.4s' }} />
                  </div>

                  {/* Stats grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px', fontSize: '11px' }}>
                    {[
                      { label: 'Total',    value: fmt(total),   color: '#555' },
                      { label: 'Used',     value: fmt(used),    color: '#dc2626' },
                      { label: 'Pending',  value: fmt(pending), color: '#d97706' },
                      { label: 'Remaining',value: fmt(remaining),color: remaining === 0 ? '#dc2626' : '#16a34a' },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: 'center', padding: '5px 3px', background: '#f8fafc', borderRadius: '6px' }}>
                        <p style={{ margin: 0, fontWeight: 700, color: s.color, fontSize: '12px' }}>{s.value}</p>
                        <p style={{ margin: '1px 0 0', color: '#aaa', fontSize: '9px' }}>{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Carry-forward breakdown */}
                  {carried > 0 && (
                    <div style={{ marginTop: '10px', padding: '8px 10px', background: '#eff6ff', borderRadius: '8px', fontSize: '11px' }}>
                      <p style={{ margin: 0, color: '#1e40af', fontWeight: 600 }}>
                        🔄 Carry-Forward from {year - 1}: +{fmt(carried)} days
                      </p>
                      <div style={{ marginTop: '4px', display: 'flex', gap: '10px', color: '#555' }}>
                        <span>This year: {fmt(thisYearRem)} rem</span>
                        {cfRem > 0 && <span>CF unused: {fmt(cfRem)}</span>}
                      </div>
                      <p style={{ margin: '4px 0 0', color: '#888', fontSize: '10px' }}>
                        * This year's {b.leave_type_code} allocation consumed before CF days.
                      </p>
                    </div>
                  )}

                  {/* Encashment hint for EL */}
                  {encashEnabled && b.leave_type_code === 'EL' && remaining > 0 && (
                    <p style={{ margin: '8px 0 0', fontSize: '10px', color: '#7c3aed' }}>
                      💡 EL encashment available at year-end. Max carry-forward: {b.max_carry_forward || 0} days
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Next Year CF Preview */}
          {year === thisYear && cfLeaves.length > 0 && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px 18px' }}>
              <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 700, color: '#166534' }}>
                🔄 Estimated Carry-Forward to {thisYear + 1}
              </p>
              <p style={{ margin: '0 0 12px', fontSize: '11px', color: '#888' }}>
                Based on current remaining balance. Capped per policy. Final amounts set at year-end.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {cfLeaves.map(b => {
                  const remaining = parseFloat(b.remaining || 0)
                  const maxCF = parseFloat(
  b.max_carry_forward || 0
)
                  const estimated = Math.min(remaining, maxCF)
                  return (
                    <div key={b.id} style={{ background: '#fff', borderRadius: '8px', padding: '10px 14px', minWidth: '140px' }}>
                      <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>{b.leave_type_name}</p>
                      <p style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 800, color: '#16a34a' }}>{fmt(estimated)}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#aaa' }}>
                        {remaining > maxCF ? `capped from ${fmt(remaining)}` : 'of current balance'}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

const navBtn = { padding: '6px 12px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }
