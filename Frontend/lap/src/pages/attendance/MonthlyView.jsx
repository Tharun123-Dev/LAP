// src/pages/attendance/MonthlyView.jsx
// ── FIXED FILE ──
// Fixes:
//  1. OT badge shown in calendar cell when ot_hours > 0
//  2. Late minutes shown in cell (how many minutes late)
//  3. Policy data (shift_start, grace, late_cutoff) fetched from API response
//  4. Late count shown in summary with policy note
//  5. All existing logic preserved

import { useEffect, useState } from 'react'
import { getMyAttendanceApi } from '../../api/services/attendance'
import systemSettingsService from '../../api/services/systemsettings'
import RegularizeModal from './RegularizeModal'
import toast from 'react-hot-toast'

const STATUS_COLOR = {
  present:   { bg: '#dcfce7', color: '#166534', label: 'P',   title: 'Present' },
  late:      { bg: '#fef9c3', color: '#854d0e', label: 'L',   title: 'Late' },
  half_day:  { bg: '#fef3c7', color: '#92400e', label: 'H',   title: 'Half Day' },
  absent:    { bg: '#fee2e2', color: '#991b1b', label: 'A',   title: 'Absent / LOP' },
  pending:   { bg: '#fef9c3', color: '#854d0e', label: 'PEN', title: 'Pending Correction' },
  leave:     { bg: '#ede9fe', color: '#5b21b6', label: 'LV',  title: 'On Leave' },
  lop_leave: { bg: '#fff1f2', color: '#be123c', label: 'LOP', title: 'LOP Leave' },
  holiday:   { bg: '#dbeafe', color: '#1e40af', label: 'PH',  title: 'Public Holiday' },
  weekend:   { bg: '#f3f4f6', color: '#9ca3af', label: 'W',   title: 'Week Off' },
}

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

/** Compute minutes late given check_in string (HH:MM) and shift_start string (HH:MM) + grace */
function calcLateMinutes(checkIn, shiftStart, graceMinutes = 0, isOvernight = false) {
  if (!checkIn || !shiftStart) return 0
  const [sh, sm] = shiftStart.split(':').map(Number)
  const [ch, cm] = checkIn.split(':').map(Number)
  const shiftMins  = sh * 60 + sm + (graceMinutes || 0)
  let checkInMin = ch * 60 + cm
  if (isOvernight && checkInMin < sh * 60 + sm) checkInMin += 24 * 60
  return Math.max(0, checkInMin - shiftMins)
}

function formatDurationFromHours(hours) {
  const totalMinutes = Math.round((parseFloat(hours) || 0) * 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h && m) return `${h}h ${m}m`
  if (h) return `${h}h`
  return `${m}m`
}

export default function MonthlyView() {
  const now = new Date()
  const [month,           setMonth]       = useState(now.getMonth() + 1)
  const [year,            setYear]        = useState(now.getFullYear())
  const [data,            setData]        = useState(null)
  const [loading,         setLoading]     = useState(false)
  const [selRecord,       setSelRecord]   = useState(null)
  const [weekendDays,     setWeekendDays] = useState(['saturday', 'sunday'])
  const [workDaysPerWeek, setWorkDays]    = useState(5)
  const [shiftStart,      setShiftStart]  = useState('09:00')
  const [graceMinutes,    setGraceMinutes]= useState(15)

  // Load weekend / shift settings once
  useEffect(() => {
    systemSettingsService.getAll().then((res) => {
      const all  = Object.values(res.data).flat()
      const find = (key) => all.find((s) => s.key === key)

      const wknd = find('weekend_days')
      if (wknd) { try { setWeekendDays(JSON.parse(wknd.value)) } catch {} }

      const wpw = find('work_days_per_week')
      if (wpw) setWorkDays(parseInt(wpw.value))

      const wst = find('work_start_time')
      if (wst) setShiftStart(wst.value)

      const gpm = find('grace_period_minutes')
      if (gpm) setGraceMinutes(parseInt(gpm.value) || 15)
    }).catch(() => {})
  }, [])

  useEffect(() => { load() }, [month, year])

  const load = async () => {
    setLoading(true)
    try {
      const r = await getMyAttendanceApi(month, year)
      setData(r.data)
      // Also update shift/grace from the policy field in API response
      if (r.data?.policy) {
        const p = r.data.policy
        if (p.shift_start)   setShiftStart(p.shift_start)
        if (p.grace_minutes != null) setGraceMinutes(parseInt(p.grace_minutes) || 15)
      }
    } catch {
      toast.error('Failed to load attendance')
    } finally {
      setLoading(false)
    }
  }

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  const isWeekend = (dateObj) => weekendDays.includes(DAY_NAMES[dateObj.getDay()])

  // Build lookups from API response
  const recordMap  = {}
  const holidayMap = {}
  data?.records?.forEach((r) => {
    if (!recordMap[r.date]) recordMap[r.date] = []
    recordMap[r.date].push(r)
  })
  data?.holidays?.forEach((h) => { holidayMap[h.date] = h.name })

  const firstDay  = new Date(year, month - 1, 1).getDay()
  const daysInMon = new Date(year, month, 0).getDate()
  const todayStr  = new Date().toISOString().split('T')[0]

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMon; d++) cells.push(d)

  const monthName = new Date(year, month - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })

  const workingDaysThisMonth = Array.from({ length: daysInMon }, (_, i) => i + 1)
    .filter((d) => !isWeekend(new Date(year, month - 1, d))).length

  // Determine late cutoff label from policy or compute locally
  const lateCutoffLabel = data?.policy?.late_cutoff || (() => {
    const [h, m] = shiftStart.split(':').map(Number)
    const total  = h * 60 + m + graceMinutes
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
  })()

  // ── Summary pills ─────────────────────────────────────────────────────────
  const summaryPills = data?.summary ? [
    { label: 'Present',    val: data.summary.present,                                  color: '#16a34a' },
    { label: 'Holidays',   val: data.summary.holiday  || 0,                            color: '#1e40af' },
    { label: 'Absent/LOP', val: data.summary.absent,                                   color: '#dc2626' },
    { label: 'Pending',    val: data.summary.pending || 0,                              color: '#d97706' },
    { label: 'On Leave',   val: data.summary.leave     || 0,                           color: '#7c3aed' },
    { label: 'LOP Leave',  val: data.summary.lop_leave || 0,                           color: '#be123c' },
    { label: 'Late',       val: data.summary.late,                                     color: '#d97706' },
    { label: 'Half Day',   val: data.summary.half_day,                                 color: '#b45309' },
    { label: 'Total Hrs',  val: (data.summary.total_hours?.toFixed(1) || '0.0') + 'h', color: '#1d4ed8' },
    { label: 'OT Hrs',     val: formatDurationFromHours(data.summary.total_ot || 0), color: '#7c3aed' },
  ] : []

  return (
    <div>
      {/* Month navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button onClick={prevMonth} style={navBtn}>◀</button>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111' }}>{monthName}</h3>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <span>{workDaysPerWeek === 6 ? '6-day week · Sun only off' : '5-day week · Sat & Sun off'}</span>
            <span>·</span>
            <span>{workingDaysThisMonth} working days</span>
            <span>·</span>
            <span>Shift {shiftStart} · Grace {graceMinutes}m · Late after {lateCutoffLabel}</span>
          </div>
        </div>
        <button onClick={nextMonth} style={navBtn}>▶</button>
      </div>

      {/* Summary pills */}
      {summaryPills.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {summaryPills.map((s) => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '9px 14px', display: 'flex', gap: '7px', alignItems: 'center' }}>
              <span style={{ fontSize: '17px', fontWeight: 700, color: s.color }}>{s.val}</span>
              <span style={{ fontSize: '11px', color: '#888' }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Calendar */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>Loading…</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #e5e7eb' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => {
              const isWkndHdr = weekendDays.includes(DAY_NAMES[i])
              return (
                <div key={d} style={{
                  padding: '10px', textAlign: 'center', fontSize: '12px', fontWeight: 600,
                  background: isWkndHdr ? '#f3f4f6' : '#f8fafc',
                  color: isWkndHdr ? '#9ca3af' : '#555',
                }}>
                  {d}
                  {isWkndHdr && <div style={{ fontSize: '8px', color: '#bbb' }}>off</div>}
                </div>
              )
            })}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {cells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} style={emptyCell} />

              const dateStr    = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const recordsForDate = recordMap[dateStr] || []
              const record = (
                recordsForDate.find(r => r.status === 'late') ||
                recordsForDate.find(r => r.status === 'half_day') ||
                recordsForDate.find(r => r.status === 'pending') ||
                recordsForDate.find(r => r.shift_type === 'night') ||
                recordsForDate[0]
              )
              const holidayName = holidayMap[dateStr] || record?.holiday_name
              const cellDate   = new Date(dateStr)
              const isWkndDay  = isWeekend(cellDate)
              const isToday    = dateStr === todayStr
              const isFuture   = dateStr > todayStr

              const missingCheckout = recordsForDate.some(r => r?.check_in && !r?.check_out && dateStr !== todayStr)
              const requestedShifts = new Set(
                recordsForDate
                  .filter(r => r?.shift_type && r?.regularization_status && r.regularization_status !== 'rejected')
                  .map(r => r.shift_type)
              )
              const availableRequestShifts = ['day', 'night'].filter(shift => !requestedShifts.has(shift))

              let effectiveStatus = record?.status
              if (missingCheckout && effectiveStatus === 'present') effectiveStatus = 'half_day'
              if (missingCheckout && effectiveStatus === 'late')    effectiveStatus = 'half_day'

              // Determine which status style to show
              let st = null
              if (record)          st = STATUS_COLOR[effectiveStatus] || STATUS_COLOR.absent
              else if (holidayName) st = STATUS_COLOR.holiday
              else if (isWkndDay)   st = STATUS_COLOR.weekend

              const isLop     = record?.status === 'lop_leave' || record?.is_lop
              const leaveName = record?.leave_name

              // ── OT detection ──────────────────────────────────────────────
              const otHours   = parseFloat(record?.ot_hours || 0)
              const hasOT     = otHours > 0
              const otLabel   = formatDurationFromHours(otHours)

              // ── Late minutes ──────────────────────────────────────────────
              const recordShiftStart = record?.shift_start_snapshot || shiftStart
              const recordGrace = record?.grace_minutes_snapshot ?? graceMinutes
              const lateMinutes = (effectiveStatus === 'late' && record?.check_in)
                ? calcLateMinutes(record.check_in, recordShiftStart, parseInt(recordGrace) || 0, record?.is_overnight_shift)
                : 0

              let tooltipText = st?.title || ''
              if (holidayName)     tooltipText = `🗓 ${holidayName}`
              if (leaveName)       tooltipText = `${isLop ? 'LOP: ' : ''}${leaveName}`
              if (missingCheckout) tooltipText = `⚠ Missing checkout — auto half-day: ${dateStr}`
              if (lateMinutes > 0) tooltipText += ` (${lateMinutes}m late)`
              if (hasOT)           tooltipText += ` · OT: ${otLabel}`

              const canRegularize = !!(
                !isWkndDay &&
                !holidayName &&
                !isFuture &&
                !record?.leave_name &&
                availableRequestShifts.length > 0 &&
                (
                  !record ||
                  effectiveStatus === 'pending' ||
                  effectiveStatus === 'absent' ||
                  requestedShifts.size > 0
                )
              )

              const openRegularize = () => {
                if (!canRegularize) return
                const shift = availableRequestShifts[0]
                const targetRecord = recordsForDate.find(r => r.shift_type === shift && !r.regularization_status)
                setSelRecord(targetRecord || {
                  id: null,
                  date: dateStr,
                  check_in: '',
                  check_out: '',
                  status: 'pending',
                  shift_type: shift,
                })
              }

              return (
                <div
                  key={day}
                  title={tooltipText}
                  onClick={openRegularize}
                  style={{
                    padding: '6px 8px', minHeight: '76px',
                    borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9',
                    cursor: canRegularize ? 'pointer' : 'default',
                    background: isWkndDay ? '#fafafa' : isToday ? '#eff6ff' : missingCheckout ? '#fff7ed' : '#fff',
                  }}
                >
                  {/* Date number */}
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: isToday ? '#1d4ed8' : 'transparent',
                    color: isToday ? '#fff' : isWkndDay ? '#bbb' : isFuture ? '#ccc' : '#333',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: isToday ? 700 : 400, marginBottom: '3px',
                  }}>
                    {day}
                  </div>

                  {/* Holiday name label */}
                  {holidayName && (
                    <p style={{ margin: '0 0 2px', fontSize: '9px', color: '#1e40af', lineHeight: 1.2, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {holidayName}
                    </p>
                  )}

                  {isWkndDay && !record && !holidayName && (
                    <span style={{ fontSize: '9px', color: '#bbb' }}>week off</span>
                  )}

                  {/* Status badge row — status + OT badge side by side */}
                  <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '2px' }}>
                    {st && (
                      <span style={{ display: 'inline-block', padding: '1px 5px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                    )}

                    {/* ── OT BADGE (NEW) ── show when ot_hours > 0 */}
                    {hasOT && !isFuture && (
                      <span style={{ display: 'inline-block', padding: '1px 5px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd8fe' }}>
                        OT {otLabel}
                      </span>
                    )}
                  </div>

                  {/* ── LATE MINUTES (NEW) ── show how many minutes late */}
                  {lateMinutes > 0 && (
                    <p style={{ margin: '0 0 2px', fontSize: '9px', color: '#b45309', fontWeight: 600, lineHeight: 1.2 }}>
                      +{lateMinutes}m late
                    </p>
                  )}

                  {leaveName && (
                    <p style={{ margin: '2px 0 0', fontSize: '8px', lineHeight: 1.2, color: isLop ? '#be123c' : '#7c3aed', fontWeight: 500 }}>
                      {leaveName}
                    </p>
                  )}

                  {recordsForDate.map((row) => (
                    row?.check_in && (
                      <p key={`${row.id || row.shift_type}-${row.check_in}`} style={{ margin: '2px 0 0', fontSize: '9px', color: (!row.check_out && dateStr !== todayStr) ? '#dc2626' : '#888', fontWeight: (!row.check_out && dateStr !== todayStr) ? 600 : 400 }}>
                        {row.shift_type === 'night' ? 'night ' : ''}
                        {row.check_in}{row.check_out ? ` → ${row.check_out}` : isToday ? ' → ?' : ' → ⚠'}
                      </p>
                    )
                  ))}

                  {missingCheckout && (
                    <p style={{ margin: '2px 0 0', fontSize: '8px', color: '#ea580c', fontWeight: 600 }}>no checkout</p>
                  )}
                  {canRegularize && (
                    <p style={{ margin: '2px 0 0', fontSize: '8px', color: '#dc2626' }}>
                      tap request {availableRequestShifts.join('/')}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
        {Object.entries(STATUS_COLOR).map(([key, val]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '13px', height: '13px', borderRadius: '3px', background: val.bg, border: `1px solid ${val.color}`, display: 'inline-block' }} />
            <span style={{ fontSize: '11px', color: '#888' }}>{val.title}</span>
          </div>
        ))}
        {/* OT legend entry */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '13px', height: '13px', borderRadius: '3px', background: '#f5f3ff', border: '1px solid #7c3aed', display: 'inline-block' }} />
          <span style={{ fontSize: '11px', color: '#888' }}>OT (Overtime)</span>
        </div>
        <p style={{ fontSize: '11px', color: '#aaa', margin: 0 }}>· Tap absent day to regularize · PH = Public Holiday · OT badge = overtime worked</p>
      </div>

      {selRecord && (
        <RegularizeModal
          record={selRecord}
          date={selRecord?.date}
          onClose={() => setSelRecord(null)}
          onSaved={() => { setSelRecord(null); load() }}
        />
      )}
    </div>
  )
}

const navBtn    = { background: '#f3f4f6', border: 'none', borderRadius: '8px', width: '36px', height: '36px', cursor: 'pointer', fontSize: '14px' }
const emptyCell = { padding: '10px', minHeight: '76px', borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', background: '#fafafa' }
