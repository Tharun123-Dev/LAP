// src/pages/attendance/TodayWidget.jsx
import { useEffect, useState, useCallback } from 'react'
import {
  getTodayApi, checkInApi, checkOutApi,
  getOfficeLocationApi, getCurrentPosition, haversineMetres,
} from '../../api/services/attendance'
import RegularizeModal from './RegularizeModal'
import toast from 'react-hot-toast'

// ── Status badge styles ───────────────────────────────────────────────────────
const STATUS_STYLE = {
  present:     { bg: '#dcfce7', color: '#166534' },
  late:        { bg: '#fef9c3', color: '#854d0e' },
  half_day:    { bg: '#fef3c7', color: '#92400e' },
  absent:      { bg: '#fee2e2', color: '#991b1b' },
  not_started: { bg: '#f3f4f6', color: '#888' },
}

// ── Distance badge helper ─────────────────────────────────────────────────────
function DistanceBadge({ metres, radius }) {
  if (metres === null || metres === undefined) return null
  const inside = metres <= radius
  return (
    <span style={{
      display:      'inline-flex',
      alignItems:   'center',
      gap:          '4px',
      padding:      '3px 10px',
      borderRadius: '20px',
      fontSize:     '12px',
      fontWeight:   600,
      background:   inside ? '#dcfce7' : '#fee2e2',
      color:        inside ? '#166534' : '#991b1b',
    }}>
      {inside ? '📍' : '⚠️'} {Math.round(metres)} m from office
      {!inside && ` (limit: ${radius} m)`}
    </span>
  )
}

// ── Location status panel shown before action ─────────────────────────────────
function LocationPanel({ gps, office, locError, locLoading, onRetry }) {
  if (locLoading) return (
    <div style={panelStyle('#f0f9ff', '#0369a1')}>
      <span>📡 Getting your location…</span>
    </div>
  )

  if (locError) return (
    <div style={panelStyle('#fff7ed', '#c2410c')}>
      <span>⚠️ {locError}</span>
      <button onClick={onRetry} style={retryBtn}>Retry</button>
    </div>
  )

  if (!office) return (
    <div style={panelStyle('#f0fdf4', '#166534')}>
      <span>✅ No office location configured — check-in open.</span>
    </div>
  )

  if (!gps) return null

  const dist   = haversineMetres(gps.latitude, gps.longitude, office.latitude, office.longitude)
  const inside = dist <= office.radius_meters

  return (
    <div style={panelStyle(inside ? '#f0fdf4' : '#fff7ed', inside ? '#166534' : '#c2410c')}>
      <span>
        {inside ? '✅' : '🚫'}{' '}
        {inside
          ? `You are ${Math.round(dist)} m from office — within the ${office.radius_meters} m zone.`
          : `You are ${Math.round(dist)} m from office. Check-in requires being within ${office.radius_meters} m.`
        }
      </span>
      {!inside && (
        <button onClick={onRetry} style={retryBtn}>Refresh Location</button>
      )}
    </div>
  )
}

const panelStyle = (bg, color) => ({
  display:      'flex',
  alignItems:   'center',
  justifyContent: 'space-between',
  flexWrap:     'wrap',
  gap:          '8px',
  background:   bg,
  color,
  borderRadius: '10px',
  padding:      '10px 16px',
  fontSize:     '13px',
  fontWeight:   500,
  marginBottom: '14px',
})

const retryBtn = {
  background:   'transparent',
  border:       '1px solid currentColor',
  borderRadius: '6px',
  padding:      '4px 10px',
  cursor:       'pointer',
  fontSize:     '12px',
  fontWeight:   600,
  color:        'inherit',
}


// ── Main Widget ───────────────────────────────────────────────────────────────
export default function TodayWidget() {
  const [today,        setToday]        = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [isWfh,        setIsWfh]        = useState(false)
  const [showRegModal, setShowRegModal] = useState(false)

  // Location state
  const [gps,       setGps]       = useState(null)   // { latitude, longitude, accuracy }
  const [office,    setOffice]    = useState(null)   // OfficeLocation from backend
  const [locLoading,setLocLoading]= useState(false)
  const [locError,  setLocError]  = useState(null)

  // ── Load today status + office location on mount ──────────────────────────
  useEffect(() => {
    load()
    loadOffice()
  }, [])

  // Auto-fetch GPS whenever office is loaded (and not WFH)
  useEffect(() => {
    if (office && !isWfh) fetchGps()
  }, [office])

  const load = async () => {
    try { const r = await getTodayApi(); setToday(r.data) }
    catch { toast.error('Failed to load today status') }
  }

  const loadOffice = async () => {
    try {
      const r = await getOfficeLocationApi()
      setOffice(r.data)
    } catch {
      // 404 means no office configured — that's fine, allow all
      setOffice(null)
    }
  }

  const fetchGps = useCallback(async () => {
    setLocLoading(true)
    setLocError(null)
    try {
      const pos = await getCurrentPosition()
      setGps(pos)
    } catch (e) {
      setLocError(e.message)
      setGps(null)
    } finally {
      setLocLoading(false)
    }
  }, [])

  // When WFH toggle changes, clear/fetch GPS accordingly
  const handleWfhToggle = () => {
    const next = !isWfh
    setIsWfh(next)
    if (!next && office) fetchGps()
    else { setGps(null); setLocError(null) }
  }

  // ── Check-in ──────────────────────────────────────────────────────────────
  const handleCheckIn = async () => {
    if (!isWfh && office) {
      // Must have GPS + be within radius
      if (locError || !gps) {
        toast.error('Please allow location access first.')
        return
      }
      const dist = haversineMetres(gps.latitude, gps.longitude, office.latitude, office.longitude)
      if (dist > office.radius_meters) {
        toast.error(`You are ${Math.round(dist)} m away — must be within ${office.radius_meters} m to check in.`)
        return
      }
    }

    setLoading(true)
    try {
      await checkInApi(isWfh, gps?.latitude ?? null, gps?.longitude ?? null)
      toast.success('Checked in!')
      load()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Check-in failed')
    } finally { setLoading(false) }
  }

  // ── Check-out ─────────────────────────────────────────────────────────────
  const handleCheckOut = async () => {
    if (!today?.is_wfh && office) {
      if (locError || !gps) {
        toast.error('Please allow location access first.')
        return
      }
      const dist = haversineMetres(gps.latitude, gps.longitude, office.latitude, office.longitude)
      if (dist > office.radius_meters) {
        toast.error(`You are ${Math.round(dist)} m away — must be within ${office.radius_meters} m to check out.`)
        return
      }
    }

    setLoading(true)
    try {
      const r = await checkOutApi(gps?.latitude ?? null, gps?.longitude ?? null)
      toast.success(`Checked out! ${r.data.hours_worked}h worked`)
      load()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Check-out failed')
    } finally { setLoading(false) }
  }

  // ── Derived UI values ─────────────────────────────────────────────────────
  const todayDateStr = new Date().toISOString().split('T')[0]
  const now          = new Date()
  const timeStr      = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const dateStr      = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const style        = STATUS_STYLE[today?.status] || STATUS_STYLE.not_started

  // Client-side preview distance (for live feedback before action)
  const previewDist = gps && office
    ? haversineMetres(gps.latitude, gps.longitude, office.latitude, office.longitude)
    : null
  const withinRadius = previewDist !== null ? previewDist <= office.radius_meters : true

  // Should we show location panel?
  const showLocPanel = !isWfh && !today?.checked_in

  return (
    <div style={{ maxWidth: '600px' }}>

      {/* ── Date + time banner ─────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)', borderRadius: '14px', padding: '28px 32px', color: '#fff', marginBottom: '20px' }}>
        <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{dateStr}</p>
        <h1 style={{ margin: '8px 0 0', fontSize: '42px', fontWeight: 700, letterSpacing: '-1px' }}>{timeStr}</h1>
        {today && (
          <span style={{ display: 'inline-block', marginTop: '14px', padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: style.bg, color: style.color, textTransform: 'capitalize' }}>
            {today.status === 'not_started' ? 'Not started' : today.status.replace('_', ' ')}
          </span>
        )}
      </div>

      {/* ── Check-in/out info cards ────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <InfoCard
          icon="🕘" label="Check In"  value={today?.check_in  || '—'}
          sub={today?.is_wfh ? 'Work From Home' : (today?.checkin_distance_m != null ? `📍 ${Math.round(today.checkin_distance_m)} m from office` : 'Office')}
          highlight={!!today?.check_in}
        />
        <InfoCard
          icon="🕔" label="Check Out" value={today?.check_out || '—'}
          sub={today?.check_out
            ? `${today.hours_worked}h worked${today.checkout_distance_m != null ? ` · 📍 ${Math.round(today.checkout_distance_m)} m` : ''}`
            : 'Not yet'}
          highlight={!!today?.check_out}
        />
      </div>

      {/* ── WFH toggle (before check-in) ──────────────────────────────────── */}
      {!today?.checked_in && (
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', cursor: 'pointer', fontSize: '14px', color: '#555' }}>
          <div
            onClick={handleWfhToggle}
            style={{ width: '42px', height: '24px', borderRadius: '12px', background: isWfh ? '#1a1a2e' : '#ddd', position: 'relative', transition: 'background 0.2s', cursor: 'pointer' }}
          >
            <div style={{ position: 'absolute', top: '3px', left: isWfh ? '21px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
          </div>
          Working From Home today
        </label>
      )}

      {/* ── Live location panel (office mode only, before check-in) ──────── */}
      {showLocPanel && (
        <LocationPanel
          gps={gps}
          office={office}
          locError={locError}
          locLoading={locLoading}
          onRetry={fetchGps}
        />
      )}

      {/* ── Location panel during checkout (office mode) ──────────────────── */}
      {today?.checked_in && !today?.checked_out && !today?.is_wfh && office && (
        <LocationPanel
          gps={gps}
          office={office}
          locError={locError}
          locLoading={locLoading}
          onRetry={fetchGps}
        />
      )}

      {/* ── Main action button ─────────────────────────────────────────────── */}
      {!today?.checked_in ? (
        <button
          onClick={handleCheckIn}
          disabled={loading || (!isWfh && office && (locLoading || !!locError || !withinRadius))}
          style={actionBtn('#16a34a', loading || (!isWfh && office && (locLoading || !!locError || !withinRadius)))}
        >
          {loading ? 'Checking in…' : '✅ Check In'}
        </button>
      ) : !today?.checked_out ? (
        <button
          onClick={handleCheckOut}
          disabled={loading || (!today.is_wfh && office && (locLoading || !!locError || !withinRadius))}
          style={actionBtn('#dc2626', loading || (!today.is_wfh && office && (locLoading || !!locError || !withinRadius)))}
        >
          {loading ? 'Checking out…' : '🔴 Check Out'}
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
          <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {today.checkin_distance_m  != null && <DistanceBadge metres={today.checkin_distance_m}  radius={office?.radius_meters || 300} />}
            {today.checkout_distance_m != null && <DistanceBadge metres={today.checkout_distance_m} radius={office?.radius_meters || 300} />}
          </div>
        </div>
      )}

      {/* ── Regularization link ───────────────────────────────────────────── */}
      <div style={{ marginTop: '14px', textAlign: 'center' }}>
        <button
          onClick={() => setShowRegModal(true)}
          style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Forgot to check in/out? Request regularization for today
        </button>
      </div>

      {/* ── Regularize modal ──────────────────────────────────────────────── */}
      {showRegModal && (
        <RegularizeModal
          record={today?.checked_in ? {
            id:        null,
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

// ── Helpers ───────────────────────────────────────────────────────────────────
function actionBtn(bg, disabled) {
  return {
    width:        '100%',
    padding:      '14px',
    background:   disabled ? '#9ca3af' : bg,
    color:        '#fff',
    border:       'none',
    borderRadius: '10px',
    fontSize:     '15px',
    fontWeight:   700,
    cursor:       disabled ? 'not-allowed' : 'pointer',
    transition:   'background 0.2s',
  }
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