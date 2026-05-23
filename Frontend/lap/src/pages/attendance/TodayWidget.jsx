// src/pages/attendance/TodayWidget.jsx
import { useEffect, useState } from 'react'
import { getTodayApi, checkInApi, checkOutApi } from '../../api/services/attendance'
import RegularizeModal from './RegularizeModal'
import toast from 'react-hot-toast'

const STATUS_STYLE = {
  present:     { bg: '#dcfce7', color: '#166534' },
  late:        { bg: '#fef9c3', color: '#854d0e' },
  half_day:    { bg: '#fef3c7', color: '#92400e' },
  absent:      { bg: '#fee2e2', color: '#991b1b' },
  not_started: { bg: '#f3f4f6', color: '#888' },
}

export default function TodayWidget() {
  const [today,       setToday]       = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [isWfh,       setIsWfh]       = useState(false)
  const [showRegModal, setShowRegModal] = useState(false)   // ← NEW

  useEffect(() => { load() }, [])

  const load = async () => {
    try { const r = await getTodayApi(); setToday(r.data) }
    catch { toast.error('Failed to load today status') }
  }

  const handleCheckIn = async () => {
    setLoading(true)
    try {
      await checkInApi(isWfh)
      toast.success('Checked in!')
      load()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Check-in failed')
    } finally { setLoading(false) }
  }

  const handleCheckOut = async () => {
    setLoading(true)
    try {
      const r = await checkOutApi()
      toast.success(`Checked out! ${r.data.hours_worked}h worked`)
      load()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Check-out failed')
    } finally { setLoading(false) }
  }

  const todayDateStr = new Date().toISOString().split('T')[0]
  const now          = new Date()
  const timeStr      = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const dateStr      = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const style        = STATUS_STYLE[today?.status] || STATUS_STYLE.not_started

  return (
    <div style={{ maxWidth: '600px' }}>
      {/* Date + time banner */}
      <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)', borderRadius: '14px', padding: '28px 32px', color: '#fff', marginBottom: '20px' }}>
        <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{dateStr}</p>
        <h1 style={{ margin: '8px 0 0', fontSize: '42px', fontWeight: 700, letterSpacing: '-1px' }}>{timeStr}</h1>
        {today && (
          <span style={{ display: 'inline-block', marginTop: '14px', padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: style.bg, color: style.color, textTransform: 'capitalize' }}>
            {today.status === 'not_started' ? 'Not started' : today.status.replace('_', ' ')}
          </span>
        )}
      </div>

      {/* Check-in/out info cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <InfoCard icon="🕘" label="Check In"  value={today?.check_in  || '—'} sub={today?.is_wfh ? 'Work From Home' : 'Office'} highlight={!!today?.check_in} />
        <InfoCard icon="🕔" label="Check Out" value={today?.check_out || '—'} sub={today?.check_out ? `${today.hours_worked}h worked` : 'Not yet'} highlight={!!today?.check_out} />
      </div>

      {/* WFH Toggle — only before check-in */}
      {!today?.checked_in && (
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', cursor: 'pointer', fontSize: '14px', color: '#555' }}>
          <div
            onClick={() => setIsWfh(p => !p)}
            style={{ width: '42px', height: '24px', borderRadius: '12px', background: isWfh ? '#1a1a2e' : '#ddd', position: 'relative', transition: 'background 0.2s', cursor: 'pointer' }}
          >
            <div style={{ position: 'absolute', top: '3px', left: isWfh ? '21px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
          </div>
          Working From Home today
        </label>
      )}

      {/* Main action button */}
      {!today?.checked_in ? (
        <button onClick={handleCheckIn} disabled={loading} style={{ width: '100%', padding: '14px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>
          {loading ? 'Checking in...' : '✅ Check In'}
        </button>
      ) : !today?.checked_out ? (
        <button onClick={handleCheckOut} disabled={loading} style={{ width: '100%', padding: '14px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>
          {loading ? 'Checking out...' : '🔴 Check Out'}
        </button>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
          <p style={{ margin: 0, color: '#166534', fontWeight: 600, fontSize: '15px' }}>
            ✅ Day complete — {today.hours_worked}h worked
          </p>
          {parseFloat(today.hours_worked || 0) > 8 && (
            <p style={{ margin: '6px 0 0', color: '#0369a1', fontSize: '13px' }}>
              🕐 {(parseFloat(today.hours_worked) - 8).toFixed(2)}h overtime
            </p>
          )}
        </div>
      )}

      {/* ── NEW: Request regularization for today ── */}
      <div style={{ marginTop: '14px', textAlign: 'center' }}>
        <button
          onClick={() => setShowRegModal(true)}
          style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Forgot to check in/out? Request regularization for today
        </button>
      </div>

      {/* Regularize modal — passes date string, no record needed */}
      {showRegModal && (
        <RegularizeModal
          record={today?.checked_in ? {
            id:        null,           // backend will look up by date
            date:      todayDateStr,
            check_in:  today.check_in,
            check_out: today.check_out,
            status:    today.status,
          } : null}
          date={todayDateStr}
          onClose={() => setShowRegModal(false)}
          onSaved={() => { setShowRegModal(false); load() }}
        />
      )}
    </div>
  )
}

function InfoCard({ icon, label, value, sub, highlight }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${highlight ? '#bbf7d0' : '#e5e7eb'}`, borderRadius: '12px', padding: '18px 20px' }}>
      <p style={{ margin: 0, fontSize: '13px', color: '#888' }}>{icon} {label}</p>
      <p style={{ margin: '8px 0 4px', fontSize: '24px', fontWeight: 700, color: highlight ? '#166534' : '#aaa' }}>{value}</p>
      <p style={{ margin: 0, fontSize: '12px', color: '#aaa' }}>{sub}</p>
    </div>
  )
}