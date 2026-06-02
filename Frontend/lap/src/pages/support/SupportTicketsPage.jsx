import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import usePermission from '../../hooks/usePermission'
import supportTicketsService from '../../api/services/supportTickets'

const priorities = ['low', 'medium', 'high', 'urgent']
const statuses = ['open', 'in_progress', 'waiting_user', 'resolved', 'closed', 'reopened']
const priorityRank = { urgent: 4, high: 3, medium: 2, low: 1 }

const card = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }
const input = { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '7px', fontSize: '13px', boxSizing: 'border-box' }
const button = (bg = '#2563eb', color = '#fff', disabled = false) => ({
  border: 'none',
  borderRadius: '7px',
  padding: '9px 12px',
  background: disabled ? '#93c5fd' : bg,
  color,
  fontWeight: 700,
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontSize: '13px',
  opacity: disabled ? 0.82 : 1,
})

function label(value) {
  return String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (m) => m.toUpperCase())
}

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString()
}

function timeAgo(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  const seconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

function Badge({ children, tone = '#2563eb' }) {
  return <span style={{ display: 'inline-flex', padding: '3px 8px', borderRadius: '999px', background: `${tone}18`, color: tone, fontSize: '11px', fontWeight: 800 }}>{children}</span>
}

function Field({ label: title, children }) {
  return (
    <label style={{ display: 'grid', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#374151' }}>
      {title}
      {children}
    </label>
  )
}

function Spinner() {
  return (
    <span
      style={{
        width: '14px',
        height: '14px',
        border: '2px solid rgba(255,255,255,0.55)',
        borderTopColor: '#fff',
        borderRadius: '50%',
        display: 'inline-block',
        animation: 'supportTicketSpin 0.75s linear infinite',
      }}
    />
  )
}

function LoadingButton({ loading, loadingText, children, style, disabled, ...props }) {
  const isDisabled = disabled || loading

  return (
    <button
      {...props}
      disabled={isDisabled}
      style={{
        ...button('#2563eb', '#fff', isDisabled),
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        minHeight: '41px',
        ...style,
        cursor: isDisabled ? 'not-allowed' : style?.cursor || 'pointer',
        opacity: isDisabled ? 0.82 : style?.opacity || 1,
      }}
    >
      {loading && <Spinner />}
      {loading ? loadingText : children}
    </button>
  )
}

function BufferNotice({ show, children }) {
  if (!show) return null

  return (
    <div style={{ border: '1px solid #bfdbfe', borderRadius: '8px', background: '#eff6ff', color: '#1d4ed8', padding: '10px 12px', display: 'grid', gap: '8px', fontSize: '12px', fontWeight: 700 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            width: '14px',
            height: '14px',
            border: '2px solid rgba(37,99,235,0.25)',
            borderTopColor: '#2563eb',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'supportTicketSpin 0.75s linear infinite',
          }}
        />
        {children}
      </div>
      <div style={{ height: '3px', overflow: 'hidden', borderRadius: '999px', background: '#dbeafe' }}>
        <div style={{ height: '100%', width: '42%', borderRadius: '999px', background: '#2563eb', animation: 'supportTicketBuffer 1s ease-in-out infinite' }} />
      </div>
    </div>
  )
}

function TicketList({ tickets, selectedId, onSelect, empty }) {
  if (!tickets.length) return <div style={{ ...card, textAlign: 'center', color: '#6b7280', padding: '28px' }}>{empty}</div>

  return (
    <div style={{ display: 'grid', gap: '10px', maxHeight: '600px', overflowY: 'auto', paddingRight: '4px' }}>
      {tickets.map((ticket) => (
        <button
          key={ticket.id}
          onClick={() => onSelect(ticket)}
          style={{
            ...card,
            textAlign: 'left',
            cursor: 'pointer',
            borderColor: selectedId === ticket.id ? '#2563eb' : '#e5e7eb',
            boxShadow: selectedId === ticket.id ? '0 0 0 2px #dbeafe' : 'none',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'start' }}>
            <div>
              <div style={{ fontWeight: 800, color: '#111827' }}>{ticket.ticket_no}</div>
              <div style={{ marginTop: '4px', fontSize: '13px', color: '#374151' }}>{ticket.subject}</div>
            </div>
            <Badge tone={ticket.priority === 'urgent' ? '#dc2626' : ticket.priority === 'high' ? '#d97706' : '#2563eb'}>{label(ticket.priority)}</Badge>
          </div>
          <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Badge tone="#059669">{label(ticket.status)}</Badge>
            <Badge tone="#6b7280">{ticket.issue_type_name}</Badge>
          </div>
          <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', fontSize: '11px', color: '#6b7280' }}>
            <span>Raised {timeAgo(ticket.created_at)}</span>
            <span>Updated {timeAgo(ticket.updated_at || ticket.created_at)}</span>
          </div>
        </button>
      ))}
    </div>
  )
}

function TicketDetail({ ticket, canManage, readOnly, onAction, updating }) {
  const [action, setAction] = useState('note')
  const [note, setNote] = useState('')
  const [internal, setInternal] = useState(false)

  if (!ticket) return <div style={{ ...card, color: '#6b7280' }}>Select a ticket to view status and tracking notes.</div>

  const actions = canManage
    ? ['note', 'assign', 'in_progress', 'waiting_user', 'resolve', 'close', 'reopen']
    : ['note', 'close', 'reopen']

  const submit = async () => {
    if (updating) return
    if (['resolve', 'close', 'reopen', 'waiting_user', 'in_progress'].includes(action) && !note.trim()) {
      toast.error('Note is required for this action')
      return
    }
    await onAction(ticket.id, { action, note, is_internal: internal })
    setNote('')
    setInternal(false)
  }

  return (
    <div style={{ ...card, display: 'grid', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#111827' }}>{ticket.subject}</h2>
          <p style={{ margin: '5px 0 0', color: '#6b7280', fontSize: '13px' }}>{ticket.ticket_no} | {ticket.issue_type_name}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Badge tone="#059669">{label(ticket.status)}</Badge>
          <Badge tone={ticket.priority === 'urgent' ? '#dc2626' : '#2563eb'}>{label(ticket.priority)}</Badge>
        </div>
      </div>

      <div style={{ background: '#f9fafb', border: '1px solid #eef2f7', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#374151', whiteSpace: 'pre-wrap' }}>
        {ticket.description}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', fontSize: '12px', color: '#4b5563' }}>
        <div><strong>Requester:</strong> {ticket.requester_name}</div>
        <div><strong>Assigned:</strong> {ticket.assigned_to_name || 'Not assigned'}</div>
        <div><strong>Resolved by:</strong> {ticket.resolved_by_name || '-'}</div>
        <div><strong>Created:</strong> {formatDateTime(ticket.created_at)}</div>
        <div><strong>Last update:</strong> {formatDateTime(ticket.updated_at || ticket.created_at)}</div>
      </div>

      <div style={{ display: 'grid', gap: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '15px' }}>Tracking Notes</h3>
        <div style={{ display: 'grid', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
          {(ticket.notes || []).map((noteItem) => (
            <div key={noteItem.id} style={{ borderLeft: `3px solid ${noteItem.is_internal ? '#d97706' : '#2563eb'}`, padding: '8px 10px', background: '#f9fafb', borderRadius: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '12px', color: '#6b7280' }}>
                <strong>{noteItem.author_name}</strong>
                <span>{new Date(noteItem.created_at).toLocaleString()}</span>
              </div>
              <div style={{ marginTop: '4px', fontSize: '13px', color: '#111827', whiteSpace: 'pre-wrap' }}>{noteItem.note}</div>
              {noteItem.status_to && <div style={{ marginTop: '4px', fontSize: '11px', color: '#059669' }}>{label(noteItem.status_from || 'new')} to {label(noteItem.status_to)}</div>}
              {noteItem.is_internal && <div style={{ marginTop: '4px', fontSize: '11px', color: '#d97706' }}>Internal note</div>}
            </div>
          ))}
        </div>
      </div>

      {!readOnly && (
        <div style={{ display: 'grid', gap: '10px', borderTop: '1px solid #e5e7eb', paddingTop: '14px' }}>
          <BufferNotice show={updating}>Updating ticket status and tracking note...</BufferNotice>
          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '10px' }}>
            <select value={action} onChange={(e) => setAction(e.target.value)} style={input} disabled={updating}>
              {actions.map((item) => <option key={item} value={item}>{label(item)}</option>)}
            </select>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add note or resolution update" style={input} disabled={updating} />
          </div>
          {canManage && (
            <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px', color: '#4b5563' }}>
              <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} disabled={updating} />
              Internal note only
            </label>
          )}
          <LoadingButton loading={updating} loadingText="Updating ticket..." onClick={submit}>
            Update Ticket
          </LoadingButton>
        </div>
      )}
    </div>
  )
}

export default function SupportTicketsPage() {
  const { can } = usePermission()
  const canRaise = can('raise_support_ticket')
  const canTrack = can('view_support_tickets')
  const canManage = can('manage_support_tickets')
  const canManageTypes = can('manage_support_ticket_types')

  const [tab, setTab] = useState(canRaise ? 'raise' : canManage ? 'all' : 'my')
  const [types, setTypes] = useState([])
  const [myTickets, setMyTickets] = useState([])
  const [allTickets, setAllTickets] = useState([])
  const [summary, setSummary] = useState({})
  const [selected, setSelected] = useState(null)
  const [filters, setFilters] = useState({ status: '', priority: '', issue_type: '' })
  const [ticketSearch, setTicketSearch] = useState('')
  const [ticketSort, setTicketSort] = useState('latest')
  const [form, setForm] = useState({ issue_type: '', priority: 'medium', subject: '', description: '' })
  const [typeForm, setTypeForm] = useState({ name: '', code: '', description: '' })
  const [submitting, setSubmitting] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [savingType, setSavingType] = useState(false)
  const [disablingTypeId, setDisablingTypeId] = useState(null)

  const visibleTickets = useMemo(() => {
    const search = ticketSearch.trim().toLowerCase()
    const source = tab === 'all' ? allTickets : myTickets
    const filtered = search
      ? source.filter((ticket) => [
        ticket.ticket_no,
        ticket.subject,
        ticket.description,
        ticket.issue_type_name,
        ticket.status,
        ticket.priority,
        ticket.requester_name,
      ].some((value) => String(value || '').toLowerCase().includes(search)))
      : source

    return [...filtered].sort((first, second) => {
      if (ticketSort === 'oldest') return new Date(first.created_at) - new Date(second.created_at)
      if (ticketSort === 'priority') return (priorityRank[second.priority] || 0) - (priorityRank[first.priority] || 0)
      if (ticketSort === 'updated') return new Date(second.updated_at || second.created_at) - new Date(first.updated_at || first.created_at)
      return new Date(second.created_at) - new Date(first.created_at)
    })
  }, [tab, allTickets, myTickets, ticketSearch, ticketSort])

  const load = async () => {
    const [typeRes, summaryRes] = await Promise.all([
      supportTicketsService.getTypes(),
      supportTicketsService.summary(),
    ])
    setTypes(typeRes.data || [])
    setSummary(summaryRes.data || {})

    if (canTrack) {
      const myRes = await supportTicketsService.myTickets()
      setMyTickets(myRes.data || [])
    }
    if (canManage) {
      const allRes = await supportTicketsService.allTickets(filters)
      setAllTickets(allRes.data || [])
    }
  }

  useEffect(() => {
    load().catch(() => toast.error('Could not load support tickets'))
  }, [])

  useEffect(() => {
    if (!canManage) return
    supportTicketsService.allTickets(filters)
      .then((res) => setAllTickets(res.data || []))
      .catch(() => toast.error('Could not filter tickets'))
  }, [filters.status, filters.priority, filters.issue_type])

  const raiseTicket = async (e) => {
    e.preventDefault()
    if (submitting) return
    if (!form.issue_type || !form.subject.trim() || !form.description.trim()) {
      toast.error('Issue type, subject, and description are required')
      return
    }
    try {
      setSubmitting(true)
      await supportTicketsService.raise(form)
      toast.success('Ticket raised')
      setForm({ issue_type: '', priority: 'medium', subject: '', description: '' })
      setTab(canTrack ? 'my' : 'raise')
      await load()
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Could not submit ticket')
    } finally {
      setSubmitting(false)
    }
  }

  const createType = async (e) => {
    e.preventDefault()
    if (savingType) return
    if (!typeForm.name.trim() || !typeForm.code.trim()) {
      toast.error('Name and code are required')
      return
    }
    try {
      setSavingType(true)
      await supportTicketsService.createType(typeForm)
      toast.success('Issue type added')
      setTypeForm({ name: '', code: '', description: '' })
      await load()
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Could not add issue type')
    } finally {
      setSavingType(false)
    }
  }

  const runAction = async (id, payload) => {
    if (updating) return
    try {
      setUpdating(true)
      const res = canManage
        ? await supportTicketsService.action(id, payload)
        : await supportTicketsService.requesterAction(id, payload)
      setSelected(res.data)
      toast.success('Ticket updated')
      await load()
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Could not update ticket')
    } finally {
      setUpdating(false)
    }
  }

  const tabs = [
    { key: 'raise', label: 'Raise Ticket', show: canRaise },
    { key: 'my', label: 'My Tracking', show: canTrack },
    { key: 'all', label: 'All Tickets', show: canManage },
    { key: 'types', label: 'Issue Types', show: canManageTypes },
  ].filter((item) => item.show)

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', display: 'grid', gap: '18px', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      <style>{'@keyframes supportTicketSpin { to { transform: rotate(360deg); } } @keyframes supportTicketBuffer { 0% { transform: translateX(-110%); } 50% { transform: translateX(80%); } 100% { transform: translateX(240%); } }'}</style>
      <div>
        <h1 style={{ margin: 0, fontSize: '24px', color: '#111827' }}>Support Tickets</h1>
        <p style={{ margin: '5px 0 0', color: '#6b7280', fontSize: '13px' }}>Raise, track, resolve, close, and reopen support requests.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
        {['total', 'open', 'in_progress', 'waiting_user', 'resolved', 'closed'].map((key) => (
          <div key={key} style={card}>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#111827' }}>{summary[key] || 0}</div>
            <div style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>{summary.scope === 'all' ? label(key) : `My ${label(key)}`}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#f3f4f6', borderRadius: '10px', padding: '4px', display: 'grid', gridTemplateColumns: `repeat(${Math.max(tabs.length, 1)}, minmax(0, 1fr))`, gap: '4px' }}>
        {tabs.map((item) => (
          <button key={item.key} onClick={() => setTab(item.key)} style={{ ...button(tab === item.key ? '#fff' : 'transparent', tab === item.key ? '#111827' : '#6b7280'), boxShadow: tab === item.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'raise' && (
        <form onSubmit={raiseTicket} style={{ ...card, display: 'grid', gap: '14px' }}>
          <BufferNotice show={submitting}>Submitting ticket, please wait...</BufferNotice>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <Field label="Issue Type">
              <select value={form.issue_type} onChange={(e) => setForm((prev) => ({ ...prev, issue_type: e.target.value }))} style={input} disabled={submitting}>
                <option value="">Select issue</option>
                {types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select value={form.priority} onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))} style={input} disabled={submitting}>
                {priorities.map((priority) => <option key={priority} value={priority}>{label(priority)}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Subject">
            <input value={form.subject} onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))} style={input} disabled={submitting} />
          </Field>
          <Field label="Description">
            <textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} rows={5} style={input} disabled={submitting} />
          </Field>
          <LoadingButton loading={submitting} loadingText="Submitting ticket...">
            Submit Ticket
          </LoadingButton>
        </form>
      )}

      {(tab === 'my' || tab === 'all') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 380px) minmax(0, 1fr)', gap: '16px', alignItems: 'start' }}>
          <div style={{ display: 'grid', gap: '10px' }}>
            {tab === 'all' && (
              <div style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
                <select value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))} style={input}>
                  <option value="">All status</option>
                  {statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}
                </select>
                <select value={filters.priority} onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))} style={input}>
                  <option value="">All priority</option>
                  {priorities.map((priority) => <option key={priority} value={priority}>{label(priority)}</option>)}
                </select>
                <select value={filters.issue_type} onChange={(e) => setFilters((prev) => ({ ...prev, issue_type: e.target.value }))} style={input}>
                  <option value="">All issues</option>
                  {types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                </select>
              </div>
            )}
            <div style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', alignItems: 'center' }}>
              <input
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                style={input}
                placeholder="Search ticket no, subject, issue, status"
              />
              <select value={ticketSort} onChange={(e) => setTicketSort(e.target.value)} style={input}>
                <option value="latest">Latest first</option>
                <option value="updated">Recently updated</option>
                <option value="priority">High priority first</option>
                <option value="oldest">Oldest first</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  setTicketSearch('')
                  setTicketSort('latest')
                }}
                style={button('#f3f4f6', '#374151')}
              >
                Clear
              </button>
            </div>
            <TicketList tickets={visibleTickets} selectedId={selected?.id} onSelect={setSelected} empty={tab === 'all' ? 'No tickets for this filter or search.' : 'No tickets raised yet.'} />
          </div>
          <TicketDetail ticket={selected} canManage={tab === 'all' && canManage} readOnly={tab === 'my'} onAction={runAction} updating={updating} />
        </div>
      )}

      {tab === 'types' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 360px) minmax(0, 1fr)', gap: '16px' }}>
          <form onSubmit={createType} style={{ ...card, display: 'grid', gap: '12px', alignContent: 'start' }}>
            <Field label="Issue Name">
              <input value={typeForm.name} onChange={(e) => setTypeForm((prev) => ({ ...prev, name: e.target.value }))} style={input} placeholder="Example: Access Request" disabled={savingType} />
            </Field>
            <Field label="Code">
              <input value={typeForm.code} onChange={(e) => setTypeForm((prev) => ({ ...prev, code: e.target.value.toLowerCase().replaceAll(' ', '_') }))} style={input} placeholder="access_request" disabled={savingType} />
            </Field>
            <Field label="Description">
              <textarea value={typeForm.description} onChange={(e) => setTypeForm((prev) => ({ ...prev, description: e.target.value }))} rows={3} style={input} disabled={savingType} />
            </Field>
            <LoadingButton loading={savingType} loadingText="Adding issue type...">
              Add Issue Type
            </LoadingButton>
          </form>

          <div style={{ ...card, display: 'grid', gap: '8px', maxHeight: '560px', overflowY: 'auto' }}>
            {types.map((type) => (
              <div key={type.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                <div>
                  <div style={{ fontWeight: 800 }}>{type.name}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>{type.code}</div>
                  {type.description && <div style={{ marginTop: '4px', fontSize: '12px', color: '#4b5563' }}>{type.description}</div>}
                </div>
                <LoadingButton
                  loading={disablingTypeId === type.id}
                  loadingText="Disabling..."
                  disabled={Boolean(disablingTypeId)}
                  onClick={async () => {
                    try {
                      setDisablingTypeId(type.id)
                      await supportTicketsService.deleteType(type.id)
                      toast.success('Issue type disabled')
                      await load()
                    } catch (error) {
                      toast.error(error?.response?.data?.detail || 'Could not disable issue type')
                    } finally {
                      setDisablingTypeId(null)
                    }
                  }}
                  style={button('#fee2e2', '#991b1b', Boolean(disablingTypeId))}
                >
                  Disable
                </LoadingButton>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
