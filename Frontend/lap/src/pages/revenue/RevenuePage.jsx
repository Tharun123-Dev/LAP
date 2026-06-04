import { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, Users, WalletCards } from 'lucide-react'
import { fetchRevenueOverview } from '../../leads/services/leadsApi'

export default function RevenuePage() {
  const [metrics, setMetrics] = useState({
    confirmedRevenue: 0,
    pipelineRevenue: 0,
    confirmedCount: 0,
    pipelineCount: 0,
    conversionRate: 0,
    confirmedLeads: [],
    pipelineLeads: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRevenueOverview()
      .then((res) => {
        setMetrics({
          confirmedRevenue: res.data?.confirmed_revenue || 0,
          pipelineRevenue: res.data?.pipeline_revenue || 0,
          confirmedCount: res.data?.confirmed_count || 0,
          pipelineCount: res.data?.pipeline_count || 0,
          conversionRate: res.data?.conversion_rate || 0,
          confirmedLeads: res.data?.confirmed_leads || [],
          pipelineLeads: res.data?.pipeline_leads || [],
        })
      })
      .catch(() => setMetrics({
        confirmedRevenue: 0,
        pipelineRevenue: 0,
        confirmedCount: 0,
        pipelineCount: 0,
        conversionRate: 0,
        confirmedLeads: [],
        pipelineLeads: [],
      }))
      .finally(() => setLoading(false))
  }, [])

  const formatMoney = (value) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`

  const cards = [
    { label: 'Confirmed Revenue', value: metrics.confirmedRevenue, icon: DollarSign, tone: 'text-emerald-600 bg-emerald-50' },
    { label: 'Pipeline Revenue', value: metrics.pipelineRevenue, icon: WalletCards, tone: 'text-indigo-600 bg-indigo-50' },
    { label: 'Confirmed Leads', value: metrics.confirmedCount, icon: Users, tone: 'text-cyan-600 bg-cyan-50', plain: true },
    { label: 'Conversion Rate', value: `${metrics.conversionRate}%`, icon: TrendingUp, tone: 'text-amber-600 bg-amber-50', plain: true },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-950">Revenue Overview</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Revenue updates from leads after counselor/admin confirmation.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">{card.label}</p>
                  <p className="mt-2 text-2xl font-black text-slate-950">
                    {loading ? '...' : card.plain ? card.value : formatMoney(card.value)}
                  </p>
                </div>
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900">Confirmed Admissions Revenue</h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Leads marked Admission Confirmed appear here with counselor and amount.
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
            {metrics.confirmedCount} confirmed
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
                <th className="py-3 font-black">Student</th>
                <th className="py-3 font-black">Course</th>
                <th className="py-3 font-black">Counselor</th>
                <th className="py-3 font-black">Payment</th>
                <th className="py-3 text-right font-black">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-xs font-bold text-slate-400">Loading revenue...</td>
                </tr>
              ) : metrics.confirmedLeads.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-xs font-bold text-slate-400">
                    No confirmed admissions yet.
                  </td>
                </tr>
              ) : metrics.confirmedLeads.map((lead) => (
                <tr key={lead.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-3">
                    <div className="font-black text-slate-900">{lead.full_name}</div>
                    <div className="text-xs font-medium text-slate-400">{lead.email || lead.phone || 'No contact'}</div>
                  </td>
                  <td className="py-3 font-semibold text-slate-600">{lead.course || 'Not set'}</td>
                  <td className="py-3 font-semibold text-slate-600">{lead.counselor}</td>
                  <td className="py-3">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                      lead.payment_status === 'Paid'
                        ? 'bg-emerald-100 text-emerald-700'
                        : lead.payment_status === 'Partial'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                    }`}>
                      {lead.payment_status || 'Unpaid'}
                    </span>
                    {lead.payment_reference && (
                      <div className="mt-1 text-[11px] font-medium text-slate-400">{lead.payment_reference}</div>
                    )}
                  </td>
                  <td className="py-3 text-right font-black text-slate-900">{formatMoney(lead.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-black text-slate-900">Flow</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Admin creates or receives a lead, assigns it to a counselor, counselor logs follow ups,
          and when the status becomes Admission Confirmed it is included in confirmed revenue.
          Amount is read from fields named Revenue, Fee, Course Fee, Admission Fee, Paid Amount, Total Fee, Payment Amount, or Amount.
        </p>
      </div>
    </div>
  )
}
