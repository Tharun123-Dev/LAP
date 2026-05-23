// src/pages/payroll/PayrollPage.jsx
import { useState } from 'react'
import usePermission from '../../hooks/usePermission'
import MyPayslips      from './MyPayslips'
import MySalaryView    from './MySalaryView'
import PayrollRuns     from './PayrollRuns'
import SalaryConfig    from './SalaryConfig'

export default function PayrollPage() {
  const { can }       = usePermission()
  const [tab, setTab] = useState(can('view_payroll') ? 'runs' : 'payslips')

  const tabs = [
    { key: 'payslips', label: '🧾 My Payslips', show: can('view_payslip') },
    { key: 'salary',   label: '💰 My Salary',   show: can('view_payslip') },
    { key: 'runs',     label: '⚙️ Payroll Runs', show: can('view_payroll') },
    { key: 'config',   label: '🏗 Salary Config', show: can('configure_salary') },
  ].filter(t => t.show)

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '4px', background: '#f3f4f6', borderRadius: '10px', padding: '4px', width: 'fit-content', minWidth: '100%' }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '8px 14px', borderRadius: '7px', border: 'none',
                whiteSpace: 'nowrap', flex: 1,
                background: tab === t.key ? '#fff' : 'transparent',
                color: tab === t.key ? '#1a1a2e' : '#888',
                fontWeight: tab === t.key ? 600 : 400,
                fontSize: '13px', cursor: 'pointer',
                boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'payslips' && <MyPayslips />}
      {tab === 'salary'   && <MySalaryView />}
      {tab === 'runs'     && <PayrollRuns />}
      {tab === 'config'   && <SalaryConfig />}
    </div>
  )
}