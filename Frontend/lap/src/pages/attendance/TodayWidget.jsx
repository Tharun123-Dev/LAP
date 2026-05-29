import { useEffect, useState, useCallback, useRef } from 'react'
import {
  getTodayApi,
  checkInApi,
  checkOutApi,
  getOfficeLocationApi,
  getCurrentPosition,
  haversineMetres,
} from '../../api/services/attendance'
import RegularizeModal from './RegularizeModal'
import toast from 'react-hot-toast'

function useBreakpoint() {
  const [bp, setBp] = useState(() => {
    if (typeof window === 'undefined') return 'desktop'
    const w = window.innerWidth
    if (w <= 640) return 'mobile'
    if (w <= 1024) return 'tablet'
    return 'desktop'
  })

  useEffect(() => {
    const handler = () => {
      const w = window.innerWidth
      if (w <= 640) setBp('mobile')
      else if (w <= 1024) setBp('tablet')
      else setBp('desktop')
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return bp
}

// ── Format any datetime/time string to "HH:MM" ─────────────────────────────
function formatTime(val) {
  if (!val) return null
  // If it's already "HH:MM" or "HH:MM:SS" shaped, just slice
  if (typeof val === 'string') {
    // ISO datetime e.g. "2024-06-01T09:05:00Z" or "2024-06-01 09:05:00"
    const match = val.match(/T?(\d{2}):(\d{2})/)
    if (match) return `${match[1]}:${match[2]}`
    // Fallback: parse as Date
    const d = new Date(val)
    if (!isNaN(d)) return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })
  }
  if (val instanceof Date && !isNaN(val)) {
    return val.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })
  }
  return String(val).slice(0, 5)
}

const STATUS_STYLE = {
  present:     { bg: '#dcfce7', color: '#166534' },
  late:        { bg: '#fef9c3', color: '#854d0e' },
  half_day:    { bg: '#fef3c7', color: '#92400e' },
  absent:      { bg: '#fee2e2', color: '#991b1b' },
  holiday:     { bg: '#dbeafe', color: '#1e40af' },
  not_started: { bg: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' },
}

function DistanceBadge({ metres, radius }) {
  if (metres === null || metres === undefined) return null
  const inside = metres <= radius
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
      background: inside ? '#dcfce7' : '#fee2e2',
      color: inside ? '#166534' : '#991b1b',
    }}>
      {inside ? '📍' : '⚠️'} {Math.round(metres)} m from office
      {!inside && ` (limit: ${radius} m)`}
    </span>
  )
}

function LocationPanel({ gps, office, locError, locLoading, onRetry }) {
  if (locLoading)
    return (
      <div style={panelStyle('#f0f9ff', '#0369a1')}>
        <span>📡 Getting your location…</span>
      </div>
    )

  if (locError)
    return (
      <div style={panelStyle('#fff7ed', '#c2410c')}>
        <span style={{ flex: 1, minWidth: 0 }}>⚠️ {locError}</span>
        <button onClick={onRetry} style={retryBtn}>Retry</button>
      </div>
    )

  if (!office)
    return (
      <div style={panelStyle('#f0fdf4', '#166534')}>
        <span>✅ No office location configured — check-in open.</span>
      </div>
    )

  if (!gps) return null

  const dist = haversineMetres(gps.latitude, gps.longitude, office.latitude, office.longitude)
  const inside = dist <= office.radius_meters

  return (
    <div style={panelStyle(inside ? '#f0fdf4' : '#fff7ed', inside ? '#166634' : '#c2410c')}>
      <span style={{ flex: 1, minWidth: 0 }}>
        {inside ? '✅' : '🚫'}{' '}
        {inside
          ? `You are ${Math.round(dist)} m from office — within the ${office.radius_meters} m zone.`
          : `You are ${Math.round(dist)} m from office. Check-in requires being within ${office.radius_meters} m.`}
      </span>
      {!inside && (
        <button onClick={onRetry} style={retryBtn}>Refresh Location</button>
      )}
    </div>
  )
}

const panelStyle = (bg, color) => ({
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  flexWrap: 'wrap', gap: '8px', background: bg, color,
  borderRadius: '10px', padding: '10px 16px', fontSize: '13px',
  fontWeight: 500, marginBottom: '14px',
})

const retryBtn = {
  background: 'transparent', border: '1px solid currentColor',
  borderRadius: '6px', padding: '4px 10px', cursor: 'pointer',
  fontSize: '12px', fontWeight: 600, color: 'inherit',
  whiteSpace: 'nowrap', flexShrink: 0,
}

// ── Real Leaflet Map ─────────────────────────────────────────────────────────
function RealMap({ gps, office, compact, showCheckLocation = false, checkLocation = null, checkType = null }) {
  const containerRef = useRef(null)
  const mapRef       = useRef(null)   // L.Map instance
  const markersRef   = useRef({})     // keyed markers

  const H = compact ? 220 : 280

  // Load Leaflet CSS + JS once
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    const init = () => {
      if (!containerRef.current || mapRef.current) return
      const L = window.L

      const lat = office ? parseFloat(office.latitude)  : gps?.latitude  ?? 0
      const lng = office ? parseFloat(office.longitude) : gps?.longitude ?? 0

      const map = L.map(containerRef.current, {
        center: [lat, lng],
        zoom: 17,
        zoomControl: true,
        attributionControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      mapRef.current = map
      updateMarkers(map)
    }

    if (window.L) {
      init()
    } else if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script')
      script.id = 'leaflet-js'
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = init
      document.head.appendChild(script)
    } else {
      // Script tag exists but may still be loading
      const poll = setInterval(() => { if (window.L) { clearInterval(poll); init() } }, 100)
    }

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update markers whenever relevant props change
  useEffect(() => {
    if (mapRef.current) updateMarkers(mapRef.current)
  }, [gps, office, checkLocation, showCheckLocation, checkType]) // eslint-disable-line react-hooks/exhaustive-deps

  function updateMarkers(map) {
    const L = window.L
    if (!L || !map) return

    const mkIcon = (color, emoji, size = 32) => L.divIcon({
      className: '',
      html: `<div style="
        width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;
        background:${color};transform:rotate(-45deg);
        border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);
        display:flex;align-items:center;justify-content:center;
      "><span style="transform:rotate(45deg);font-size:${size * 0.45}px;line-height:1">${emoji}</span></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
      popupAnchor: [0, -size],
    })

    // ── Office marker ──
    if (office) {
      const lat = parseFloat(office.latitude)
      const lng = parseFloat(office.longitude)
      if (!markersRef.current.office) {
        markersRef.current.office = L.marker([lat, lng], { icon: mkIcon('#dc2626', '🏢') })
          .addTo(map)
          .bindPopup(`<b>🏢 ${office.name}</b><br>Allowed radius: ${office.radius_meters} m`)
      }

      // Zone circle
      if (!markersRef.current.zone) {
        markersRef.current.zone = L.circle([lat, lng], {
          radius: office.radius_meters,
          color: '#6366f1', weight: 2, dashArray: '6 4',
          fillColor: '#6366f1', fillOpacity: 0.06,
        }).addTo(map)
      }
    }

    // ── Live GPS user marker ──
    if (gps) {
      const dist   = office ? haversineMetres(gps.latitude, gps.longitude, office.latitude, office.longitude) : null
      const inside = dist !== null ? dist <= office.radius_meters : true
      const color  = inside ? '#16a34a' : '#dc2626'

      if (markersRef.current.user) {
        markersRef.current.user.setLatLng([gps.latitude, gps.longitude])
        markersRef.current.user.setIcon(mkIcon(color, '📍'))
      } else {
        markersRef.current.user = L.marker([gps.latitude, gps.longitude], { icon: mkIcon(color, '📍') })
          .addTo(map)
          .bindPopup(dist !== null
            ? `<b>📍 You</b><br>${Math.round(dist)} m from office<br>Accuracy: ±${Math.round(gps.accuracy ?? 0)} m`
            : '<b>📍 Your location</b>')
      }

      // Fit map to show both office and user
      if (office) {
        const bounds = L.latLngBounds(
          [parseFloat(office.latitude), parseFloat(office.longitude)],
          [gps.latitude, gps.longitude]
        ).pad(0.3)
        map.fitBounds(bounds, { maxZoom: 18 })
      } else {
        map.setView([gps.latitude, gps.longitude], 17)
      }
    }

    // ── Saved check-in / check-out location marker ──
    if (showCheckLocation && checkLocation) {
      const ciColor = checkType === 'checkin' ? '#16a34a' : '#dc2626'
      const ciEmoji = checkType === 'checkin' ? '✅' : '🔴'
      const ciLabel = checkType === 'checkin' ? 'Check-in location' : 'Check-out location'

      if (markersRef.current.checkLoc) {
        markersRef.current.checkLoc.setLatLng([checkLocation.latitude, checkLocation.longitude])
        markersRef.current.checkLoc.setIcon(mkIcon(ciColor, ciEmoji, 28))
      } else {
        markersRef.current.checkLoc = L.marker(
          [checkLocation.latitude, checkLocation.longitude],
          { icon: mkIcon(ciColor, ciEmoji, 28) }
        ).addTo(map).bindPopup(`<b>${ciLabel}</b>`)
      }
    } else if (markersRef.current.checkLoc) {
      map.removeLayer(markersRef.current.checkLoc)
      delete markersRef.current.checkLoc
    }
  }

  const dist   = gps && office ? haversineMetres(gps.latitude, gps.longitude, office.latitude, office.longitude) : null
  const inside = dist !== null ? dist <= office.radius_meters : null

  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: '14px' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '6px', padding: '8px 14px',
        background: '#1a1a2e', color: '#fff', fontSize: '12px', fontWeight: 600,
      }}>
        <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          🗺️ Live Map{office ? ` — ${office.name}` : ''}
        </span>
        {dist !== null && (
          <span style={{
            padding: '2px 10px', borderRadius: '12px', fontSize: '11px',
            background: inside ? '#16a34a' : '#dc2626', whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {Math.round(dist)} m · {inside ? '✅ Inside zone' : '🚫 Outside zone'}
          </span>
        )}
      </div>

      {/* Map container */}
      <div ref={containerRef} style={{ height: `${H}px`, width: '100%', background: '#e8edf2' }} />

      {/* Legend */}
      <div style={{
        display: 'flex', gap: '12px', padding: '8px 14px', fontSize: '11px',
        color: '#555', borderTop: '1px solid #e5e7eb', background: '#fff', flexWrap: 'wrap',
      }}>
        {office && <span>🏢 Office</span>}
        {office && <span style={{ color: '#6366f1' }}>◌ Zone ({office.radius_meters} m)</span>}
        {gps    && <span style={{ color: inside ? '#166534' : '#dc2626' }}>📍 You</span>}
        {gps    && <span style={{ color: '#94a3b8' }}>±{Math.round(gps.accuracy ?? 0)} m accuracy</span>}
        {showCheckLocation && checkLocation && (
          <span style={{ color: checkType === 'checkin' ? '#166534' : '#dc2626' }}>
            {checkType === 'checkin' ? '✅ Check-in' : '🔴 Check-out'} location
          </span>
        )}
      </div>
    </div>
  )
}

export default function TodayWidget() {
  const bp       = useBreakpoint()
  const isMobile = bp === 'mobile'
  const isTablet = bp === 'tablet'

  const [today,        setToday]        = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [isWfh,        setIsWfh]        = useState(false)
  const [showRegModal, setShowRegModal] = useState(false)

  const [gps,        setGps]        = useState(null)
  const [office,     setOffice]     = useState(null)
  const [locLoading, setLocLoading] = useState(false)
  const [locError,   setLocError]   = useState(null)

  useEffect(() => { load(); loadOffice() }, [])
  useEffect(() => { if (office && !isWfh) fetchGps() }, [office])

  const load = async () => {
    try {
      const r = await getTodayApi()
      setToday(r.data)
      setIsWfh(r.data?.work_mode === 'work_from_home')
    } catch {
      toast.error('Failed to load today status')
    }
  }

  const loadOffice = async () => {
    try {
      const r = await getOfficeLocationApi()
      setOffice(r.data)
    } catch {
      setOffice(null)
    }
  }

  const fetchGps = useCallback(async () => {
    setLocLoading(true)
    setLocError(null)
    try {
      setGps(await getCurrentPosition())
    } catch (e) {
      setLocError(e.message)
      setGps(null)
    } finally {
      setLocLoading(false)
    }
  }, [])

  const handleWfhToggle = () => {
    const next = !isWfh
    setIsWfh(next)
    if (!next && office) fetchGps()
    else { setGps(null); setLocError(null) }
  }

  const handleCheckIn = async () => {
    const checkInIsWfh = workMode === 'work_from_home'
    let submitGps = gps
    if (!checkInIsWfh && office) {
      if (locError || !gps) { toast.error('Please allow location access first.'); return }
      const dist = haversineMetres(gps.latitude, gps.longitude, office.latitude, office.longitude)
      if (dist > office.radius_meters) {
        toast.error(`You are ${Math.round(dist)} m away — must be within ${office.radius_meters} m to check in.`)
        return
      }
    }
    if (checkInIsWfh && !submitGps) {
      try {
        submitGps = await getCurrentPosition()
        setGps(submitGps)
      } catch {
        submitGps = null
      }
    }
    setLoading(true)
    try {
      await checkInApi(checkInIsWfh, submitGps?.latitude ?? null, submitGps?.longitude ?? null)
      toast.success('Checked in!')
      load()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Check-in failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckOut = async () => {
    let submitGps = gps
    if (!today?.is_wfh && office) {
      if (locError || !gps) { toast.error('Please allow location access first.'); return }
      const dist = haversineMetres(gps.latitude, gps.longitude, office.latitude, office.longitude)
      if (dist > office.radius_meters) {
        toast.error(`You are ${Math.round(dist)} m away — must be within ${office.radius_meters} m to check out.`)
        return
      }
    }
    if (today?.is_wfh && !submitGps) {
      try {
        submitGps = await getCurrentPosition()
        setGps(submitGps)
      } catch {
        submitGps = null
      }
    }
    setLoading(true)
    try {
      const r = await checkOutApi(submitGps?.latitude ?? null, submitGps?.longitude ?? null)
      toast.success(`Checked out! ${r.data.hours_worked}h worked`)
      load()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Check-out failed')
    } finally {
      setLoading(false)
    }
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const todayDateStr = new Date().toLocaleDateString('en-CA')
  const now          = new Date()
  const timeStr      = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  const dateStr      = now.toLocaleDateString(undefined, {
    weekday: isMobile ? 'short' : 'long',
    day:     'numeric',
    month:   isMobile ? 'short' : 'long',
    year:    'numeric',
  })

  const statusKey   = today?.record?.status || today?.status || 'not_started'
  const style       = STATUS_STYLE[statusKey] || STATUS_STYLE.not_started
  const statusLabel = statusKey === 'not_started'
    ? 'Not started'
    : (statusKey || '').replace(/_/g, ' ')

  const checkedIn  = !!(today?.record?.check_in  || today?.check_in)
  const checkedOut = !!(today?.record?.check_out || today?.check_out)

  // ── Use formatTime() so values show as "09:05" ───────────────────────────
  const checkIn    = formatTime(today?.record?.check_in  || today?.check_in  || null)
  const checkOut   = formatTime(today?.record?.check_out || today?.check_out || null)

  const hoursWorked= today?.record?.hours_worked || today?.hours_worked || 0
  const otHours    = parseFloat(today?.record?.ot_hours ?? today?.ot_hours ?? 0)
  const isWfhDone  = today?.record?.is_wfh ?? today?.is_wfh ?? false
  const workMode = today?.record?.work_mode || today?.work_mode || (isWfhDone ? 'work_from_home' : 'office')
  const workModeLabel = workMode === 'work_from_home' ? 'Work From Home' : 'Work From Office'
  const workModeRule = workMode === 'work_from_home'
    ? 'Any location allowed for check-in and check-out'
    : office ? `Office radius: ${office.radius_meters} m` : 'Office location not configured'
  const ciDist     = today?.record?.checkin_distance_m  ?? today?.checkin_distance_m  ?? null
  const coDist     = today?.record?.checkout_distance_m ?? today?.checkout_distance_m ?? null

  const previewDist   = gps && office ? haversineMetres(gps.latitude, gps.longitude, office.latitude, office.longitude) : null
  const withinRadius  = previewDist !== null ? previewDist <= office.radius_meters : true

  const showMap = !isWfh && office && (!checkedIn || (checkedIn && !checkedOut && !isWfhDone))

  const showCheckInLocation  = !!(checkedIn  && today?.record?.checkin_latitude  && today?.record?.checkin_longitude)
  const showCheckOutLocation = !!(checkedOut && today?.record?.checkout_latitude && today?.record?.checkout_longitude)

  const checkLocation = showCheckOutLocation
    ? { latitude: today.record.checkout_latitude,  longitude: today.record.checkout_longitude }
    : showCheckInLocation
      ? { latitude: today.record.checkin_latitude, longitude: today.record.checkin_longitude }
      : null
  const checkType = showCheckOutLocation ? 'checkout' : 'checkin'

  const useColumnLayout = !isMobile && !isTablet && (showMap || checkLocation)

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', width: '100%', boxSizing: 'border-box' }}>
      <div style={{
        display:             useColumnLayout ? 'grid' : 'flex',
        gridTemplateColumns: useColumnLayout ? '1fr 440px' : undefined,
        flexDirection:       useColumnLayout ? undefined : 'column',
        gap:                 isMobile ? '16px' : '24px',
        alignItems:          'start',
        width:               '100%',
        boxSizing:           'border-box',
      }}>

        {/* ═══ LEFT / MAIN PANEL ═══ */}
        <div style={{ minWidth: 0, width: '100%', boxSizing: 'border-box' }}>

          {/* Public Holiday banner */}
          {today?.holiday && (
            <div style={{ background: '#dbeafe', border: '1px solid #93c5fd', borderRadius: '10px', padding: '10px 16px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px', flexShrink: 0 }}>🗓</span>
              <div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#1e40af' }}>
                  Public Holiday — {today.holiday.name}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#3b82f6' }}>
                  Today is a paid holiday. It counts as a present day in payroll.
                </p>
              </div>
            </div>
          )}

          {/* Date + time banner */}
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
            borderRadius: isMobile ? '12px' : '14px',
            padding:      isMobile ? '18px 20px' : '24px 28px',
            color:        '#fff',
            marginBottom: isMobile ? '14px' : '18px',
            boxSizing:    'border-box',
          }}>
            <p style={{ margin: 0, fontSize: isMobile ? '11px' : '12px', color: 'rgba(255,255,255,0.5)' }}>
              {dateStr}
            </p>
            <h1 style={{ margin: '6px 0 0', fontSize: isMobile ? '30px' : '38px', fontWeight: 700, letterSpacing: '-1px', lineHeight: 1 }}>
              {timeStr}
            </h1>
            {today && (
              <span style={{
                display: 'inline-block', marginTop: '12px',
                padding: '4px 14px', borderRadius: '20px',
                fontSize: '12px', fontWeight: 600,
                background: style.bg, color: style.color,
                textTransform: 'capitalize',
              }}>
                {statusLabel}
              </span>
            )}
          </div>

          {/* Assigned work mode */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: '8px',
            background: workMode === 'work_from_home' ? '#e0f2fe' : '#f8fafc',
            border: `1px solid ${workMode === 'work_from_home' ? '#7dd3fc' : '#e2e8f0'}`,
            color: workMode === 'work_from_home' ? '#0369a1' : '#334155',
            borderRadius: '10px', padding: '10px 14px',
            marginBottom: isMobile ? '14px' : '18px',
            fontSize: isMobile ? '12px' : '13px',
            fontWeight: 600,
          }}>
            <span>Work Mode: {workModeLabel}</span>
            <span style={{ fontSize: '11px', fontWeight: 500 }}>{workModeRule}</span>
          </div>

          {/* Check-in / Check-out cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? '10px' : '12px', marginBottom: isMobile ? '14px' : '18px' }}>
            <InfoCard
              icon="🕘" label="Check In"
              value={checkIn || '—'}
              sub={isWfhDone ? 'Work From Home' : ciDist != null ? `📍 ${Math.round(ciDist)} m` : 'Office'}
              highlight={!!checkIn}
              compact={isMobile}
            />
            <InfoCard
              icon="🕔" label="Check Out"
              value={checkOut || '—'}
              sub={checkOut
                ? `${hoursWorked}h${coDist != null ? ` · 📍 ${Math.round(coDist)} m` : ''}`
                : 'Not yet'}
              highlight={!!checkOut}
              compact={isMobile}
            />
          </div>

          {/* WFH toggle — only before check-in */}
          {!checkedIn && false && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', cursor: 'pointer', fontSize: isMobile ? '13px' : '14px', color: '#555', userSelect: 'none' }}>
              <div onClick={handleWfhToggle} style={{ width: '42px', height: '24px', borderRadius: '12px', background: isWfh ? '#1a1a2e' : '#ddd', position: 'relative', transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: '3px', left: isWfh ? '21px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </div>
              Working From Home today
            </label>
          )}

          {/* Location status panel */}
          {!isWfh && !checkedIn && (
            <LocationPanel gps={gps} office={office} locError={locError} locLoading={locLoading} onRetry={fetchGps} />
          )}
          {checkedIn && !checkedOut && !isWfhDone && (
            <LocationPanel gps={gps} office={office} locError={locError} locLoading={locLoading} onRetry={fetchGps} />
          )}

          {/* Map on mobile/tablet — before check-in */}
          {showMap && (isMobile || isTablet) && (
            <div style={{ marginBottom: '14px' }}>
              <RealMap gps={gps} office={office} compact={isMobile} />
              {!locLoading
                ? <button onClick={fetchGps} style={refreshBtnStyle}>🔄 Refresh My Location</button>
                : <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '12px', color: '#94a3b8' }}>📡 Getting location…</div>
              }
            </div>
          )}

          {/* Map on mobile/tablet — after check-in/out (shows saved location) */}
          {checkLocation && (isMobile || isTablet) && (
            <div style={{ marginBottom: '14px' }}>
              <RealMap gps={gps} office={office} compact={isMobile} showCheckLocation checkLocation={checkLocation} checkType={checkType} />
            </div>
          )}

          {/* ── Action button ── */}
          {!checkedIn ? (
            <button
              onClick={handleCheckIn}
              disabled={loading || (!isWfh && office && (locLoading || !!locError || !withinRadius))}
              style={actionBtn('#16a34a', loading || (!isWfh && office && (locLoading || !!locError || !withinRadius)))}
            >
              {loading ? 'Checking in…' : '✅ Check In'}
            </button>
          ) : !checkedOut ? (
            <button
              onClick={handleCheckOut}
              disabled={loading || (!isWfhDone && office && (locLoading || !!locError || !withinRadius))}
              style={actionBtn('#dc2626', loading || (!isWfhDone && office && (locLoading || !!locError || !withinRadius)))}
            >
              {loading ? 'Checking out…' : '🔴 Check Out'}
            </button>
          ) : (
            <div style={{ textAlign: 'center', padding: isMobile ? '14px' : '18px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
              <p style={{ margin: 0, color: '#166534', fontWeight: 600, fontSize: isMobile ? '13px' : '15px' }}>
                ✅ Day complete — {hoursWorked}h worked
              </p>
              {otHours > 0 && (
                <p style={{ margin: '6px 0 0', color: '#0369a1', fontSize: '13px' }}>
                  🕐 {otHours.toFixed(2)}h overtime
                </p>
              )}
              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                {ciDist != null && <DistanceBadge metres={ciDist} radius={office?.radius_meters || 300} />}
                {coDist != null && <DistanceBadge metres={coDist} radius={office?.radius_meters || 300} />}
              </div>
            </div>
          )}

          {/* Regularization link */}
          <div style={{ marginTop: '12px', textAlign: 'center' }}>
            <button
              onClick={() => setShowRegModal(true)}
              style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: isMobile ? '12px' : '13px', cursor: 'pointer', textDecoration: 'underline', padding: '4px' }}
            >
              Forgot to check in/out? Request regularization for today
            </button>
          </div>
        </div>

        {/* ═══ RIGHT PANEL — Map (desktop only) ═══ */}
        {useColumnLayout && (
          <div style={{ position: 'sticky', top: '16px', width: '100%', boxSizing: 'border-box' }}>
            {showMap && !checkLocation ? (
              <>
                <RealMap gps={gps} office={office} compact={false} />
                {!locLoading
                  ? <button onClick={fetchGps} style={refreshBtnStyle}>🔄 Refresh My Location</button>
                  : <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '12px', color: '#94a3b8' }}>📡 Getting location…</div>
                }
              </>
            ) : checkLocation ? (
              <RealMap gps={gps} office={office} compact={false} showCheckLocation checkLocation={checkLocation} checkType={checkType} />
            ) : null}
          </div>
        )}
      </div>

      {/* Regularize modal */}
      {showRegModal && (
        <RegularizeModal
          record={today?.record || (checkedIn ? { id: null, date: todayDateStr, check_in: checkIn, check_out: checkOut, status: statusKey } : null)}
          date={todayDateStr}
          onClose={() => setShowRegModal(false)}
          onSaved={() => { setShowRegModal(false); load() }}
        />
      )}
    </div>
  )
}

const refreshBtnStyle = {
  display: 'block', width: '100%', marginTop: '8px', padding: '8px',
  background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px',
  fontSize: '12px', fontWeight: 600, color: '#475569', cursor: 'pointer', boxSizing: 'border-box',
}

function actionBtn(bg, disabled) {
  return {
    width: '100%', padding: '14px',
    background: disabled ? '#9ca3af' : bg,
    color: '#fff', border: 'none', borderRadius: '10px',
    fontSize: '15px', fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background 0.2s', boxSizing: 'border-box',
  }
}

function InfoCard({ icon, label, value, sub, highlight, compact }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${highlight ? '#bbf7d0' : '#e5e7eb'}`, borderRadius: '12px', padding: compact ? '12px 14px' : '18px 20px', boxSizing: 'border-box', minWidth: 0 }}>
      <p style={{ margin: 0, fontSize: compact ? '11px' : '13px', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {icon} {label}
      </p>
      <p style={{ margin: compact ? '6px 0 3px' : '8px 0 4px', fontSize: compact ? '22px' : '28px', fontWeight: 700, color: highlight ? '#166534' : '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.5px' }}>
        {value}
      </p>
      <p style={{ margin: 0, fontSize: '11px', color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {sub}
      </p>
    </div>
  )
}
