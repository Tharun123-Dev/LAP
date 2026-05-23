// src/pages/payroll/MySalaryView.jsx
import { useEffect, useState } from 'react'
import { getMySalaryApi } from '../../api/services/payroll'

const fmt = (v) => `₹${parseFloat(v || 0).toLocaleString('en-IN')}`

export default function MySalaryView() {
  const [salary,  setSalary]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [empty,   setEmpty]   = useState(false)

  useEffect(() => {
  getMySalaryApi()
    .then(r => {
      if (r.data) setSalary(r.data)
      else setEmpty(true)
    })
    .catch(() => setEmpty(true))
    .finally(() => setLoading(false))
}, [])

  if (loading) return <div style={styles.center}>Loading...</div>

  if (empty || !salary) return (
    <div style={styles.center}>
      <div style={styles.emptyIcon}>💼</div>
      <p style={styles.emptyTitle}>No Salary Structure Assigned</p>
      <p style={styles.emptyText}>Your salary details haven't been configured yet. Contact HR for assistance.</p>
    </div>
  )

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>My Salary Structure</h2>
          <p style={styles.sub}>Effective from {salary.effective_date}</p>
        </div>
        <div style={styles.ctcBadge}>
          <span style={styles.ctcLabel}>Annual CTC</span>
          <span style={styles.ctcValue}>{fmt(salary.ctc)}</span>
        </div>
      </div>

      <div style={styles.grid}>
        <Card title="Earnings">
          <Row label="Basic"              value={salary.basic} />
          <Row label="HRA"               value={salary.hra} />
          <Row label="DA"                value={salary.da} />
          <Row label="Special Allowance" value={salary.special_allowance} />
          <Row label="Transport"         value={salary.transport} />
          <Row label="Medical"           value={salary.medical} />
          {parseFloat(salary.other_allowance) > 0 &&
            <Row label="Other Allowance" value={salary.other_allowance} />}
          <Row label="Gross" value={salary.gross} bold accent />
        </Card>

        <Card title="Deductions">
          <Row label="PF (Employee)"     value={salary.pf_employee} />
          <Row label="ESI (Employee)"    value={salary.esi_employee} />
          <Row label="Professional Tax"  value={salary.pt} />
          <Row label="Total Deductions"  value={salary.total_deductions} bold red />
        </Card>
      </div>

      <div style={styles.netPayBar}>
        <span style={styles.netLabel}>Monthly Net Pay</span>
        <span style={styles.netValue}>{fmt(salary.net_pay)}</span>
      </div>
    </div>
  )
}

const Card = ({ title, children }) => (
  <div style={styles.card}>
    <p style={styles.cardTitle}>{title}</p>
    {children}
  </div>
)

const Row = ({ label, value, bold, accent, red }) => (
  <div style={{ ...styles.row, borderTop: bold ? '1px solid #e5e7eb' : 'none', marginTop: bold ? '8px' : 0, paddingTop: bold ? '8px' : 0 }}>
    <span style={{ ...styles.rowLabel, fontWeight: bold ? 600 : 400 }}>{label}</span>
    <span style={{
      ...styles.rowValue,
      fontWeight: bold ? 700 : 500,
      color: accent ? '#16a34a' : red ? '#dc2626' : '#111'
    }}>
      {fmt(value)}
    </span>
  </div>
)

const styles = {
  wrap:       { padding: '4px 0' },
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
  title:      { margin: 0, fontSize: '18px', fontWeight: 700, color: '#111' },
  sub:        { margin: '4px 0 0', fontSize: '13px', color: '#888' },
  ctcBadge:   { background: '#1a1a2e', borderRadius: '10px', padding: '10px 18px', textAlign: 'right' },
  ctcLabel:   { display: 'block', fontSize: '11px', color: '#aaa', marginBottom: '2px' },
  ctcValue:   { fontSize: '18px', fontWeight: 700, color: '#fff' },
  grid:       { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' },
  card:       { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '18px 20px' },
  cardTitle:  { margin: '0 0 14px', fontSize: '12px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' },
  row:        { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0' },
  rowLabel:   { fontSize: '13px', color: '#555' },
  rowValue:   { fontSize: '13px' },
  netPayBar:  { background: 'linear-gradient(135deg, #16a34a, #15803d)', borderRadius: '12px', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  netLabel:   { fontSize: '14px', fontWeight: 600, color: '#fff' },
  netValue:   { fontSize: '24px', fontWeight: 800, color: '#fff' },
  center:     { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '8px' },
  emptyIcon:  { fontSize: '48px', marginBottom: '8px' },
  emptyTitle: { margin: 0, fontSize: '16px', fontWeight: 700, color: '#333' },
  emptyText:  { margin: '4px 0 0', fontSize: '13px', color: '#888', textAlign: 'center', maxWidth: '320px' },
}