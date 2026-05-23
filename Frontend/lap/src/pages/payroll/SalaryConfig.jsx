// src/pages/payroll/SalaryConfig.jsx
import { useEffect, useState } from 'react'
import { getSalaryListApi, createSalaryApi } from '../../api/services/payroll'
import { listEmployeesApi } from '../../api/services/employees'
import toast from 'react-hot-toast'

const fmt = v => `₹${parseFloat(v||0).toLocaleString('en-IN')}`

const EMPTY = {
  employee: '', effective_date: new Date().toISOString().split('T')[0],
  ctc: '', basic: '', hra: '', da: '', special_allowance: '',
  transport: '', medical: '', other_allowance: '',
  pf_employee: '', esi_employee: '', pt: '',
  pf_employer: '', esi_employer: '',
}

export default function SalaryConfig() {
  const [structures, setStructures] = useState([])
  const [employees,  setEmployees]  = useState([])
  const [showForm,   setShowForm]   = useState(false)
  const [form,       setForm]       = useState(EMPTY)
  const [saving,     setSaving]     = useState(false)
  const [empFilter,  setEmpFilter]  = useState('')

  useEffect(() => {
    getSalaryListApi().then(r => setStructures(r.data)).catch(() => {})
    listEmployeesApi().then(r => setEmployees(r.data)).catch(() => {})
  }, [])

  const set  = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const setN = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSave = async () => {
    if (!form.employee || !form.effective_date || !form.basic) {
      toast.error('Employee, date, and basic are required')
      return
    }
    setSaving(true)
    try {
      await createSalaryApi(form)
      toast.success('Salary structure saved!')
      setShowForm(false)
      const r = await getSalaryListApi()
      setStructures(r.data)
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to save')
    } finally { setSaving(false) }
  }

  const filtered = empFilter
    ? structures.filter(s => s.employee === parseInt(empFilter))
    : structures

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Salary Structures</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select value={empFilter} onChange={e => setEmpFilter(e.target.value)} style={sel}>
            <option value="">All Employees</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.emp_code})</option>
            ))}
          </select>
          <button onClick={() => { setForm(EMPTY); setShowForm(true) }} style={btnPrimary}>
            + Assign Salary
          </button>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Employee', 'Effective Date', 'CTC', 'Basic', 'HRA', 'PF', 'Net Pay'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#aaa' }}>No salary structures found</td></tr>
              ) : filtered.map((s, i) => (
                <tr key={s.id} style={{ borderTop: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={td}>
                    <p style={{ margin: 0, fontWeight: 600, color: '#111' }}>{s.employee_name}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#aaa' }}>{s.emp_code}</p>
                  </td>
                  <td style={td}>{s.effective_date}</td>
                  <td style={td}>{fmt(s.ctc)}</td>
                  <td style={td}>{fmt(s.basic)}</td>
                  <td style={td}>{fmt(s.hra)}</td>
                  <td style={td}>{fmt(s.pf_employee)}</td>
                  <td style={{ ...td, fontWeight: 700, color: '#16a34a' }}>{fmt(s.net_pay)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '14px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Assign Salary Structure</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}>✕</button>
            </div>
            <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1 }}>
              <Grid2>
                <F label="Employee *">
                  <select value={form.employee} onChange={set('employee')} style={inp}>
                    <option value="">Select employee</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.emp_code})</option>
                    ))}
                  </select>
                </F>
                <F label="Effective Date *">
                  <input type="date" value={form.effective_date} onChange={set('effective_date')} style={inp} />
                </F>
              </Grid2>
              <F label="Annual CTC">
                <input type="number" value={form.ctc} onChange={setN('ctc')} style={inp} placeholder="720000" />
              </F>
              <Sect title="Monthly Earnings">
                <Grid2>
                  <F label="Basic *"><input type="number" value={form.basic} onChange={setN('basic')} style={inp} placeholder="24000" /></F>
                  <F label="HRA"><input type="number" value={form.hra} onChange={setN('hra')} style={inp} placeholder="12000" /></F>
                  <F label="DA"><input type="number" value={form.da} onChange={setN('da')} style={inp} placeholder="2400" /></F>
                  <F label="Special Allowance"><input type="number" value={form.special_allowance} onChange={setN('special_allowance')} style={inp} placeholder="10000" /></F>
                  <F label="Transport"><input type="number" value={form.transport} onChange={setN('transport')} style={inp} placeholder="1600" /></F>
                  <F label="Medical"><input type="number" value={form.medical} onChange={setN('medical')} style={inp} placeholder="1250" /></F>
                </Grid2>
              </Sect>
              <Sect title="Monthly Deductions">
                <Grid2>
                  <F label="PF Employee (12%)"><input type="number" value={form.pf_employee} onChange={setN('pf_employee')} style={inp} placeholder="2880" /></F>
                  <F label="PF Employer (12%)"><input type="number" value={form.pf_employer} onChange={setN('pf_employer')} style={inp} placeholder="2880" /></F>
                  <F label="ESI Employee"><input type="number" value={form.esi_employee} onChange={setN('esi_employee')} style={inp} placeholder="0" /></F>
                  <F label="Professional Tax"><input type="number" value={form.pt} onChange={setN('pt')} style={inp} placeholder="200" /></F>
                </Grid2>
              </Sect>
            </div>
            <div style={{ padding: '14px 22px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '9px 18px', background: '#f3f4f6', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '9px 20px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                {saving ? 'Saving...' : 'Save Structure'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const Sect = ({ title, children }) => (
  <div style={{ marginBottom: '16px' }}>
    <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</p>
    {children}
  </div>
)
const Grid2 = ({ children }) => <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>{children}</div>
const F     = ({ label, children }) => <div><label style={{ fontSize: '12px', color: '#555', fontWeight: 500, display: 'block', marginBottom: '4px' }}>{label}</label>{children}</div>
const sel   = { padding: '8px 10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', outline: 'none' }
const btnPrimary = { padding: '9px 18px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }
const td  = { padding: '10px 14px', color: '#333', verticalAlign: 'middle' }
const inp = { width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', display: 'block' }