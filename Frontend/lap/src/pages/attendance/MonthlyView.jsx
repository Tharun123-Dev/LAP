// src/pages/attendance/MonthlyView.jsx  — COMPLETE REPLACEMENT
// Fix: approved leave days now show as purple 'LV' badge in the calendar
// Backend now injects synthetic 'leave' status records for approved leave days

import { useEffect, useState } from 'react'
import { getMyAttendanceApi } from '../../api/services/attendance'
import RegularizeModal from './RegularizeModal'
import toast from 'react-hot-toast'

const STATUS_COLOR = {
  present:  { bg: '#dcfce7', color: '#166534', label: 'P',  title: 'Present' },
  late:     { bg: '#fef9c3', color: '#854d0e', label: 'L',  title: 'Late' },
  half_day: { bg: '#fef3c7', color: '#92400e', label: 'H',  title: 'Half Day' },
  absent:   { bg: '#fee2e2', color: '#991b1b', label: 'A',  title: 'Absent / LOP' },
  leave:    { bg: '#ede9fe', color: '#5b21b6', label: 'LV', title: 'On Leave' },
  holiday:  { bg: '#dbeafe', color: '#1e40af', label: 'PH', title: 'Holiday' },
  weekend:  { bg: '#f3f4f6', color: '#9ca3af', label: 'W',  title: 'Weekend' },
}

export default function MonthlyView() {
  const now = new Date()
  const [month,     setMonth]     = useState(now.getMonth() + 1)
  const [year,      setYear]      = useState(now.getFullYear())
  const [data,      setData]      = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [selRecord, setSelRecord] = useState(null)

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
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  // Build lookup maps
  const recordMap  = {}
  const holidayMap = {}
  data?.records?.forEach(r  => { recordMap[r.date]  = r })
  data?.holidays?.forEach(h => { holidayMap[h.date] = h.name })

  // Calendar grid
  const firstDay   = new Date(year, month - 1, 1).getDay()
  const daysInMon  = new Date(year, month, 0).getDate()
  const todayStr   = new Date().toISOString().split('T')[0]

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMon; d++) cells.push(d)

  const monthName = new Date(year, month - 1).toLocaleString('en-IN', {
    month: 'long', year: 'numeric'
  })

  return (
    <div>
      {/* Month navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={prevMonth} style={navBtn}>◀</button>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111' }}>{monthName}</h3>
        <button onClick={nextMonth} style={navBtn}>▶</button>
      </div>

      {/* Summary pills */}
      {data?.summary && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {[
            { label: 'Present',  val: data.summary.present,  color: '#16a34a' },
            { label: 'Absent',   val: data.summary.absent,   color: '#dc2626' },
            { label: 'On Leave', val: data.summary.leave,    color: '#7c3aed' },
            { label: 'Late',     val: data.summary.late,     color: '#d97706' },
            { label: 'Half Day', val: data.summary.half_day, color: '#b45309' },
            { label: 'Total Hrs',val: (data.summary.total_hours?.toFixed(1) || 0) + 'h', color: '#1d4ed8' },
            { label: 'OT Hrs',   val: (data.summary.total_ot?.toFixed(1) || 0) + 'h',   color: '#7c3aed' },
          ].map(s => (
            <div key={s.label} style={{
              background: '#fff', border: '1px solid #e5e7eb',
              borderRadius: '8px', padding: '10px 16px',
              display: 'flex', gap: '8px', alignItems: 'center'
            }}>
              <span style={{ fontSize: '18px', fontWeight: 700, color: s.color }}>{s.val}</span>
              <span style={{ fontSize: '12px', color: '#888' }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Calendar grid */}
      {loading ? (
        <p style={{ color: '#888' }}>Loading...</p>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #e5e7eb' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} style={{
                padding: '10px', textAlign: 'center',
                fontSize: '12px', fontWeight: 600, color: '#888', background: '#f8fafc'
              }}>{d}</div>
            ))}
          </div>

          {/* Cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {cells.map((day, i) => {
              if (!day) return (
                <div key={`e-${i}`} style={emptyCell} />
              )

              const dateStr   = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`
              const record    = recordMap[dateStr]
              const holiday   = holidayMap[dateStr]
              const dayOfWeek = new Date(dateStr).getDay()
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
              const isToday   = dateStr === todayStr

              // Determine display status
              let st = null
              if (record)         st = STATUS_COLOR[record.status]
              else if (holiday)   st = STATUS_COLOR.holiday
              else if (isWeekend) st = STATUS_COLOR.weekend

              // Tooltip: show leave name if available
              const tooltipText = record?.leave_name
                ? `On ${record.leave_name}`
                : st?.title || ''

              // Only allow regularize on absent days (not leave/holiday/weekend)
              const canRegularize = record && !isWeekend && !holiday && record.status === 'absent'

              return (
                <div
                  key={day}
                  title={tooltipText}
                  onClick={() => canRegularize && setSelRecord(record)}
                  style={{
                    padding: '8px', minHeight: '70px',
                    borderRight: '1px solid #f1f5f9',
                    borderBottom: '1px solid #f1f5f9',
                    cursor: canRegularize ? 'pointer' : 'default',
                    background: isToday ? '#eff6ff' : '#fff',
                    position: 'relative',
                  }}
                >
                  {/* Day number */}
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: isToday ? '#1d4ed8' : 'transparent',
                    color: isToday ? '#fff' : isWeekend ? '#9ca3af' : '#333',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: isToday ? 700 : 400,
                    marginBottom: '4px',
                  }}>
                    {day}
                  </div>

                  {/* Holiday name */}
                  {holiday && (
                    <p style={{ margin: 0, fontSize: '9px', color: '#1e40af', lineHeight: 1.2 }}>
                      {holiday}
                    </p>
                  )}

                  {/* Status badge */}
                  {st && (
                    <span style={{
                      display: 'inline-block', padding: '1px 6px',
                      borderRadius: '4px', fontSize: '10px', fontWeight: 700,
                      background: st.bg, color: st.color,
                    }}>
                      {st.label}
                    </span>
                  )}

                  {/* Leave name under badge */}
                  {record?.leave_name && (
                    <p style={{ margin: '2px 0 0', fontSize: '8px', color: '#7c3aed', lineHeight: 1.2 }}>
                      {record.leave_name}
                    </p>
                  )}

                  {/* Check-in/out times */}
                  {record?.check_in && (
                    <p style={{ margin: '3px 0 0', fontSize: '9px', color: '#888' }}>
                      {record.check_in}{record.check_out ? ` → ${record.check_out}` : ' → ?'}
                    </p>
                  )}

                  {/* Regularize hint */}
                  {canRegularize && (
                    <p style={{ margin: '2px 0 0', fontSize: '8px', color: '#dc2626' }}>
                      tap to regularize
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
        {Object.entries(STATUS_COLOR).map(([key, val]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{
              width: '14px', height: '14px', borderRadius: '3px',
              background: val.bg, border: `1px solid ${val.color}`,
              display: 'inline-block'
            }} />
            <span style={{ fontSize: '11px', color: '#888', textTransform: 'capitalize' }}>
              {val.title}
            </span>
          </div>
        ))}
        <p style={{ fontSize: '11px', color: '#aaa', margin: 0, alignSelf: 'center' }}>
          Tap an absent day to regularize
        </p>
      </div>

      {/* Regularize modal */}
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

const navBtn   = { background: '#f3f4f6', border: 'none', borderRadius: '8px', width: '36px', height: '36px', cursor: 'pointer', fontSize: '14px' }
const emptyCell = { padding: '10px', minHeight: '70px', borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }