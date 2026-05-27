// src/pages/attendance/TodayWidget.jsx
// ─────────────────────────────────────────────────────────────────────────────
// CHANGES IN THIS FILE:
//  1. All time/date display uses the browser's local timezone (dynamic).
//  2. Live map added below the location panel — shows:
//       • Blue dot  = your current GPS position
//       • Red marker = office location
//       • Dashed circle = allowed radius
//     The map updates automatically whenever GPS position changes.
//  3. No other logic is changed.
// ─────────────────────────────────────────────────────────────────────────────
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

// ── Location status panel ─────────────────────────────────────────────────────
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
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'space-between',
  flexWrap:       'wrap',
  gap:            '8px',
  background:     bg,
  color,
  borderRadius:   '10px',
  padding:        '10px 16px',
  fontSize:       '13px',
  fontWeight:     500,
  marginBottom:   '14px',
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

// ── SVG Mini-Map ──────────────────────────────────────────────────────────────
/**
 * Renders a small SVG map showing:
 *   • Red marker  → office position
 *   • Dashed ring → allowed radius
 *   • Blue dot    → your current GPS position
 *
 * The map is a simple equirectangular projection centred on the office.
 * It is purely visual — no tile loading, no network calls.
 */
function MiniMap({ gps, office }) {
  if (!office) return null

  const W = 420, H = 260
  const cx = W / 2, cy = H / 2          // office always at centre

  // Scale: how many pixels per metre (adaptive to radius)
  const padding = 48                     // px margin around the allowed circle
  const radiusPx = Math.min(cx, cy) - padding
  const scale = radiusPx / office.radius_meters  // px/m

  // Convert a lat/lon offset from office to SVG pixel offset
  const toSvg = (lat, lon) => {
    const R = 6_371_000
    const dLat = (lat - parseFloat(office.latitude))  * (Math.PI / 180) * R
    const dLon = (lon - parseFloat(office.longitude)) * (Math.PI / 180) * R
                 * Math.cos(parseFloat(office.latitude) * Math.PI / 180)
    return {
      x: cx + dLon * scale,
      y: cy - dLat * scale,   // SVG y-axis is flipped
    }
  }

  const userPos = gps ? toSvg(gps.latitude, gps.longitude) : null
  const dist    = gps
    ? haversineMetres(gps.latitude, gps.longitude, office.latitude, office.longitude)
    : null
  const inside  = dist !== null ? dist <= office.radius_meters : null

  return (
    <div style={{
      borderRadius: '12px',
      overflow:     'hidden',
      border:       '1px solid #e5e7eb',
      marginBottom: '14px',
      background:   '#f0f4f8',
    }}>
      {/* Map header */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '8px 14px',
        background:     '#1a1a2e',
        color:          '#fff',
        fontSize:       '12px',
        fontWeight:     600,
      }}>
        <span>🗺️ Location Map — {office.name}</span>
        {dist !== null && (
          <span style={{
            padding:      '2px 10px',
            borderRadius: '12px',
            background:   inside ? '#16a34a' : '#dc2626',
            fontSize:     '11px',
          }}>
            {Math.round(dist)} m away · {inside ? 'Inside zone ✅' : 'Outside zone 🚫'}
          </span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: 'block' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background */}
        <rect width={W} height={H} fill="#e8edf2" />

        {/* Grid lines (subtle) */}
        {[0.25, 0.5, 0.75].map(f => (
          <g key={f}>
            <line x1={W * f} y1={0} x2={W * f} y2={H} stroke="#d1d5db" strokeWidth="0.5" />
            <line x1={0} y1={H * f} x2={W} y2={H * f} stroke="#d1d5db" strokeWidth="0.5" />
          </g>
        ))}

        {/* Allowed radius ring */}
        <circle
          cx={cx} cy={cy}
          r={radiusPx}
          fill="rgba(99,102,241,0.06)"
          stroke="#6366f1"
          strokeWidth="1.5"
          strokeDasharray="6 4"
        />

        {/* Radius label */}
        <text
          x={cx + radiusPx - 4} y={cy - 6}
          fontSize="10" fill="#6366f1" textAnchor="end" fontWeight="600"
        >
          {office.radius_meters} m radius
        </text>

        {/* North indicator */}
        <text x={cx} y={14} fontSize="10" fill="#94a3b8" textAnchor="middle">N ▲</text>

        {/* Office marker (red pin) */}
        <g transform={`translate(${cx}, ${cy})`}>
          <circle r={10} fill="#dc2626" opacity="0.15" />
          <circle r={5}  fill="#dc2626" />
          <circle r={2}  fill="#fff" />
          <text y={-14} fontSize="10" fill="#dc2626" textAnchor="middle" fontWeight="700">
            🏢 Office
          </text>
        </g>

        {/* User position (blue dot) */}
        {userPos && (
          <g transform={`translate(${userPos.x.toFixed(1)}, ${userPos.y.toFixed(1)})`}>
            {/* Pulse ring */}
            <circle r={14} fill={inside ? 'rgba(22,163,74,0.15)' : 'rgba(220,38,38,0.15)'} />
            <circle r={7}  fill={inside ? '#16a34a' : '#dc2626'} />
            <circle r={3}  fill="#fff" />
            <text y={-16} fontSize="10" fill={inside ? '#166534' : '#991b1b'} textAnchor="middle" fontWeight="700">
              📍 You
            </text>
          </g>
        )}

        {/* Line between office and user */}
        {userPos && (
          <line
            x1={cx} y1={cy}
            x2={userPos.x.toFixed(1)} y2={userPos.y.toFixed(1)}
            stroke={inside ? '#16a34a' : '#dc2626'}
            strokeWidth="1.2"
            strokeDasharray="4 3"
            opacity="0.5"
          />
        )}

        {/* No GPS message */}
        {!userPos && (
          <text x={cx} y={cy + 28} fontSize="11" fill="#94a3b8" textAnchor="middle">
            Waiting for your GPS position…
          </text>
        )}

        {/* Compass rose (bottom-right) */}
        <g transform={`translate(${W - 28}, ${H - 28})`}>
          <circle r={16} fill="white" opacity="0.7" />
          <text fontSize="9" fill="#64748b" textAnchor="middle" y={-5} fontWeight="600">N</text>
          <text fontSize="9" fill="#64748b" textAnchor="middle" y={13} fontWeight="600">S</text>
          <text fontSize="9" fill="#64748b" x={-12} y={4}  fontWeight="600">W</text>
          <text fontSize="9" fill="#64748b" x={5}   y={4}  fontWeight="600">E</text>
        </g>
      </svg>

      {/* Legend */}
      <div style={{
        display:    'flex',
        gap:        '16px',
        padding:    '8px 14px',
        fontSize:   '11px',
        color:      '#555',
        borderTop:  '1px solid #e5e7eb',
        background: '#fff',
        flexWrap:   'wrap',
      }}>
        <span>🔴 Office</span>
        <span style={{ color: '#6366f1' }}>◌ Allowed zone ({office.radius_meters} m)</span>
        {gps && <span style={{ color: inside ? '#166534' : '#dc2626' }}>● Your location</span>}
        {gps && <span style={{ color: '#94a3b8' }}>Accuracy: ±{Math.round(gps.accuracy ?? 0)} m</span>}
      </div>
    </div>
  )
}


// ── Main Widget ───────────────────────────────────────────────────────────────
export default function TodayWidget() {
  const [today,        setToday]        = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [isWfh,        setIsWfh]        = useState(false)
  const [showRegModal, setShowRegModal] = useState(false)

  // Location state
  const [gps,        setGps]        = useState(null)
  const [office,     setOffice]     = useState(null)
  const [locLoading, setLocLoading] = useState(false)
  const [locError,   setLocError]   = useState(null)

  useEffect(() => { load(); loadOffice() }, [])
  useEffect(() => { if (office && !isWfh) fetchGps() }, [office])

  const load = async () => {
    try { const r = await getTodayApi(); setToday(r.data) }
    catch { toast.error('Failed to load today status') }
  }

  const loadOffice = async () => {
    try { const r = await getOfficeLocationApi(); setOffice(r.data) }
    catch { setOffice(null) }
  }

  const fetchGps = useCallback(async () => {
    setLocLoading(true); setLocError(null)
    try { setGps(await getCurrentPosition()) }
    catch (e) { setLocError(e.message); setGps(null) }
    finally { setLocLoading(false) }
  }, [])

  const handleWfhToggle = () => {
    const next = !isWfh; setIsWfh(next)
    if (!next && office) fetchGps()
    else { setGps(null); setLocError(null) }
  }

  const handleCheckIn = async () => {
    if (!isWfh && office) {
      if (locError || !gps) { toast.error('Please allow location access first.'); return }
      const dist = haversineMetres(gps.latitude, gps.longitude, office.latitude, office.longitude)
      if (dist > office.radius_meters) {
        toast.error(`You are ${Math.round(dist)} m away — must be within ${office.radius_meters} m to check in.`)
        return
      }
    }
    setLoading(true)
    try { await checkInApi(isWfh, gps?.latitude ?? null, gps?.longitude ?? null); toast.success('Checked in!'); load() }
    catch (e) { toast.error(e.response?.data?.error || 'Check-in failed') }
    finally { setLoading(false) }
  }

  const handleCheckOut = async () => {
    if (!today?.is_wfh && office) {
      if (locError || !gps) { toast.error('Please allow location access first.'); return }
      const dist = haversineMetres(gps.latitude, gps.longitude, office.latitude, office.longitude)
      if (dist > office.radius_meters) {
        toast.error(`You are ${Math.round(dist)} m away — must be within ${office.radius_meters} m to check out.`)
        return
      }
    }
    setLoading(true)
    try { const r = await checkOutApi(gps?.latitude ?? null, gps?.longitude ?? null); toast.success(`Checked out! ${r.data.hours_worked}h worked`); load() }
    catch (e) { toast.error(e.response?.data?.error || 'Check-out failed') }
    finally { setLoading(false) }
  }

  // Derived values
  const todayDateStr = new Date().toLocaleDateString('en-CA')
  const now          = new Date()
  const timeStr      = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  const dateStr      = now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const style        = STATUS_STYLE[today?.status] || STATUS_STYLE.not_started

  const previewDist  = gps && office ? haversineMetres(gps.latitude, gps.longitude, office.latitude, office.longitude) : null
  const withinRadius = previewDist !== null ? previewDist <= office.radius_meters : true

  // Show map when: not WFH + office configured + (before check-in OR during checkout)
  const showMap = !isWfh && office && (
    !today?.checked_in ||
    (today?.checked_in && !today?.checked_out && !today?.is_wfh)
  )

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── Two-column layout: LEFT = controls, RIGHT = map ──────────────── */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: showMap ? '1fr 420px' : '600px',
        gap:                 '24px',
        alignItems:          'start',
      }}>

        {/* ════════════════ LEFT PANEL ════════════════ */}
        <div style={{ minWidth: 0 }}>

          {/* Date + time banner */}
          <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)', borderRadius: '14px', padding: '24px 28px', color: '#fff', marginBottom: '18px' }}>
            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{dateStr}</p>
            <h1 style={{ margin: '6px 0 0', fontSize: '38px', fontWeight: 700, letterSpacing: '-1px' }}>{timeStr}</h1>
            {today && (
              <span style={{ display: 'inline-block', marginTop: '12px', padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: style.bg, color: style.color, textTransform: 'capitalize' }}>
                {today.status === 'not_started' ? 'Not started' : today.status.replace('_', ' ')}
              </span>
            )}
          </div>

          {/* Check-in / Check-out info cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
            <InfoCard
              icon="🕘" label="Check In" value={today?.check_in || '—'}
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

          {/* WFH toggle */}
          {!today?.checked_in && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', cursor: 'pointer', fontSize: '14px', color: '#555' }}>
              <div onClick={handleWfhToggle} style={{ width: '42px', height: '24px', borderRadius: '12px', background: isWfh ? '#1a1a2e' : '#ddd', position: 'relative', transition: 'background 0.2s', cursor: 'pointer' }}>
                <div style={{ position: 'absolute', top: '3px', left: isWfh ? '21px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
              </div>
              Working From Home today
            </label>
          )}

          {/* Location status panel */}
          {!isWfh && (
            <LocationPanel gps={gps} office={office} locError={locError} locLoading={locLoading} onRetry={fetchGps} />
          )}
          {today?.checked_in && !today?.checked_out && !today?.is_wfh && office && (
            <LocationPanel gps={gps} office={office} locError={locError} locLoading={locLoading} onRetry={fetchGps} />
          )}

          {/* Action button */}
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
            <div style={{ textAlign: 'center', padding: '18px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
              <p style={{ margin: 0, color: '#166534', fontWeight: 600, fontSize: '15px' }}>✅ Day complete — {today.hours_worked}h worked</p>
              {parseFloat(today.hours_worked || 0) > 8 && (
                <p style={{ margin: '6px 0 0', color: '#0369a1', fontSize: '13px' }}>🕐 {(parseFloat(today.hours_worked) - 8).toFixed(2)}h overtime</p>
              )}
              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                {today.checkin_distance_m  != null && <DistanceBadge metres={today.checkin_distance_m}  radius={office?.radius_meters || 300} />}
                {today.checkout_distance_m != null && <DistanceBadge metres={today.checkout_distance_m} radius={office?.radius_meters || 300} />}
              </div>
            </div>
          )}

          {/* Regularization link */}
          <div style={{ marginTop: '12px', textAlign: 'center' }}>
            <button onClick={() => setShowRegModal(true)} style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}>
              Forgot to check in/out? Request regularization for today
            </button>
          </div>
        </div>

        {/* ════════════════ RIGHT PANEL — MAP ════════════════ */}
        {showMap && (
          <div style={{ position: 'sticky', top: '16px' }}>
            <MiniMap gps={gps} office={office} />
            {/* Refresh button below map */}
            {!locLoading && (
              <button
                onClick={fetchGps}
                style={{
                  display:      'block',
                  width:        '100%',
                  marginTop:    '8px',
                  padding:      '8px',
                  background:   '#f8fafc',
                  border:       '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize:     '12px',
                  fontWeight:   600,
                  color:        '#475569',
                  cursor:       'pointer',
                }}
              >
                🔄 Refresh My Location
              </button>
            )}
            {locLoading && (
              <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '12px', color: '#94a3b8' }}>
                📡 Getting location…
              </div>
            )}
          </div>
        )}
      </div>

      {/* Regularize modal */}
      {showRegModal && (
        <RegularizeModal
          record={today?.checked_in ? { id: null, date: todayDateStr, check_in: today.check_in, check_out: today.check_out, status: today.status } : null}
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