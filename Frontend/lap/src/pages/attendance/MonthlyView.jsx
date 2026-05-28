// src/pages/attendance/MonthlyView.jsx
// ── REPLACEMENT FILE ──
// Replace: Frontend/lap/src/pages/attendance/MonthlyView.jsx
// Changes:
//  1. Holiday days (status='holiday') rendered as blue "PH" badge in calendar.
//  2. Summary "Present" pill now includes holiday count (backend already sends this).
//  3. Holiday pill in summary row shows count of public holidays.
//  4. All other logic (weekend detection, regularize, leave, OT) unchanged.

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
  leave:     { bg: '#ede9fe', color: '#5b21b6', label: 'LV',  title: 'On Leave' },
  lop_leave: { bg: '#fff1f2', color: '#be123c', label: 'LOP', title: 'LOP Leave' },
  holiday:   { bg: '#dbeafe', color: '#1e40af', label: 'PH',  title: 'Public Holiday' },
  weekend:   { bg: '#f3f4f6', color: '#9ca3af', label: 'W',   title: 'Week Off' },
}

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export default function MonthlyView() {
  const now = new Date()
  const [month,            setMonth]       = useState(now.getMonth() + 1)
  const [year,             setYear]        = useState(now.getFullYear())
  const [data,             setData]        = useState(null)
  const [loading,          setLoading]     = useState(false)
  const [selRecord,        setSelRecord]   = useState(null)
  const [weekendDays,      setWeekendDays] = useState(['saturday', 'sunday'])
  const [workDaysPerWeek,  setWorkDays]    = useState(5)
  const [shiftStart,       setShiftStart]  = useState('09:00')

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
    }).catch(() => {})
  }, [])

  useEffect(() => { load() }, [month, year])

  const load = async () => {
    setLoading(true)
    try {
      const r = await getMyAttendanceApi(month, year)
      setData(r.data)
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
  data?.records?.forEach((r) => { recordMap[r.date]  = r })
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

  // ── Summary pills ─────────────────────────────────────────────────────────
  // summary.present from the backend already includes holiday days.
  // We add a dedicated "Holidays" pill so the user can see the breakdown.
  const summaryPills = data?.summary ? [
    { label: 'Present',    val: data.summary.present,                             color: '#16a34a' },
    { label: 'Holidays',   val: data.summary.holiday  || 0,                        color: '#1e40af' },
    { label: 'Absent/LOP', val: data.summary.absent,                              color: '#dc2626' },
    { label: 'On Leave',   val: data.summary.leave     || 0,                       color: '#7c3aed' },
    { label: 'LOP Leave',  val: data.summary.lop_leave || 0,                       color: '#be123c' },
    { label: 'Late',       val: data.summary.late,                                color: '#d97706' },
    { label: 'Half Day',   val: data.summary.half_day,                            color: '#b45309' },
    { label: 'Total Hrs',  val: (data.summary.total_hours?.toFixed(1) || '0.0') + 'h', color: '#1d4ed8' },
    { label: 'OT Hrs',     val: (data.summary.total_ot?.toFixed(1)   || '0.0') + 'h', color: '#7c3aed' },
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
            <span>Shift {shiftStart}</span>
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

              const dateStr   = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const record    = recordMap[dateStr]
              const holidayName = holidayMap[dateStr] || record?.holiday_name
              const cellDate  = new Date(dateStr)
              const isWkndDay = isWeekend(cellDate)
              const isToday   = dateStr === todayStr
              const isFuture  = dateStr > todayStr

              const missingCheckout = !!(record?.check_in && !record?.check_out && dateStr !== todayStr)

              let effectiveStatus = record?.status
              if (missingCheckout && effectiveStatus === 'present') effectiveStatus = 'half_day'
              if (missingCheckout && effectiveStatus === 'late')    effectiveStatus = 'half_day'

              // Determine which status style to show
              let st = null
              if (record)         st = STATUS_COLOR[effectiveStatus] || STATUS_COLOR.absent
              else if (holidayName) st = STATUS_COLOR.holiday
              else if (isWkndDay)  st = STATUS_COLOR.weekend

              const isLop     = record?.status === 'lop_leave' || record?.is_lop
              const leaveName = record?.leave_name
              let tooltipText = st?.title || ''
              if (holidayName)     tooltipText = `🗓 ${holidayName}`
              if (leaveName)       tooltipText = `${isLop ? 'LOP: ' : ''}${leaveName}`
              if (missingCheckout) tooltipText = `⚠ Missing checkout — auto half-day: ${dateStr}`

              const canRegularize = !!(
                record &&
                !isWkndDay &&
                !holidayName &&
                !isFuture &&
                effectiveStatus === 'absent' &&
                !record.leave_name
              )

              return (
                <div
                  key={day}
                  title={tooltipText}
                  onClick={() => canRegularize && setSelRecord(record)}
                  style={{
                    padding: '8px', minHeight: '76px',
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
                    fontSize: '12px', fontWeight: isToday ? 700 : 400, marginBottom: '4px',
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

                  {/* Status badge */}
                  {st && (
                    <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: st.bg, color: st.color }}>
                      {st.label}
                    </span>
                  )}

                  {leaveName && (
                    <p style={{ margin: '2px 0 0', fontSize: '8px', lineHeight: 1.2, color: isLop ? '#be123c' : '#7c3aed', fontWeight: 500 }}>
                      {leaveName}
                    </p>
                  )}

                  {record?.check_in && (
                    <p style={{ margin: '3px 0 0', fontSize: '9px', color: missingCheckout ? '#dc2626' : '#888', fontWeight: missingCheckout ? 600 : 400 }}>
                      {record.check_in}{record.check_out ? ` → ${record.check_out}` : isToday ? ' → ?' : ' → ⚠'}
                    </p>
                  )}

                  {missingCheckout && (
                    <p style={{ margin: '2px 0 0', fontSize: '8px', color: '#ea580c', fontWeight: 600 }}>no checkout</p>
                  )}
                  {canRegularize && (
                    <p style={{ margin: '2px 0 0', fontSize: '8px', color: '#dc2626' }}>tap to fix</p>
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
        <p style={{ fontSize: '11px', color: '#aaa', margin: 0 }}>· Tap absent day to regularize · PH = Public Holiday (counts as present)</p>
      </div>

      {selRecord && (
        <RegularizeModal
          record={selRecord}
          onClose={() => setSelRecord(null)}
          onSaved={() => { setSelRecord(null); load() }}
        />
      )}
    </div>
  )
}

const navBtn    = { background: '#f3f4f6', border: 'none', borderRadius: '8px', width: '36px', height: '36px', cursor: 'pointer', fontSize: '14px' }
const emptyCell = { padding: '10px', minHeight: '76px', borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', background: '#fafafa' }