import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { getAllRolesPermissionsApi, updateRolePermissionsApi } from '../../api/services/permissions'
import { getMeApi } from '../../api/services/users'
import { syncAuthUser } from '../../store/authSlice'
import toast from 'react-hot-toast'

const ROLES = ['superadmin', 'admin', 'manager', 'hr', 'counselor', 'employee']
const COLORS = { superadmin: '#6d28d9', admin: '#1d4ed8', manager: '#047857', hr: '#b45309', counselor: '#be185d', employee: '#374151' }

export default function PermissionManager() {
  const dispatch = useDispatch()
  const [data, setData]           = useState({})
  const [activeRole, setRole]     = useState('admin')
  const [loading, setLoading]     = useState(false)
  const [saving, setSaving]       = useState(false)
  const [changed, setChanged]     = useState({})

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try { const r = await getAllRolesPermissionsApi(); setData(r.data) }
    catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  const toggle = (code, current) => {
    setData((p) => ({ ...p, [activeRole]: p[activeRole].map((x) => x.code === code ? { ...x, is_granted: !current } : x) }))
    setChanged((p) => ({ ...p, [code]: !current }))
  }

  const save = async () => {
    setSaving(true)
    const perms   = data[activeRole] || []
    const granted = perms.filter((p) => p.is_granted).map((p) => p.code)
    const revoked = perms.filter((p) => !p.is_granted).map((p) => p.code)
    try {
      await updateRolePermissionsApi(activeRole, granted, revoked)
      const me = await getMeApi()
      dispatch(syncAuthUser(me.data))
      toast.success(`Saved for ${activeRole}!`)
      setChanged({})
    } catch { toast.error('Save failed') }
    finally { setSaving(false) }
  }

  const perms   = data[activeRole] || []
  const granted = perms.filter((p) => p.is_granted).length
  const dirty   = Object.keys(changed).length > 0

  const grouped = perms.reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = []
    acc[p.module].push(p)
    return acc
  }, {})

  return (
    <div style={{ padding: '32px', fontFamily: 'Inter, sans-serif', background: '#f9fafb', minHeight: '100vh' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111', margin: 0 }}>Permission Manager</h2>
      <p style={{ color: '#888', fontSize: '13px', marginTop: '4px', marginBottom: '24px' }}>
        Changes sync automatically for logged-in users.
      </p>

      {/* Role tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {ROLES.map((r) => (
          <button key={r} onClick={() => { setRole(r); setChanged({}) }} style={{
            padding: '8px 20px', borderRadius: '20px', fontSize: '13px', fontWeight: 500,
            border: activeRole === r ? 'none' : '1px solid #ddd',
            background: activeRole === r ? COLORS[r] : '#fff',
            color: activeRole === r ? '#fff' : '#555', cursor: 'pointer',
          }}>
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderRadius: '10px', padding: '14px 20px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          <span style={{ fontSize: '13px', color: '#555' }}>
            Role: <strong style={{ color: COLORS[activeRole] }}>{activeRole}</strong>
          </span>
          <span style={{ fontSize: '13px', color: '#555' }}>
            Granted: <strong style={{ color: '#16a34a' }}>{granted}</strong> / {perms.length}
          </span>
          {dirty && <span style={{ fontSize: '13px', color: '#d97706' }}>● {Object.keys(changed).length} unsaved</span>}
        </div>
        <button onClick={save} disabled={saving || !dirty} style={{
          padding: '8px 24px', border: 'none', borderRadius: '8px',
          background: dirty ? '#1a1a2e' : '#e5e7eb',
          color: dirty ? '#fff' : '#999',
          fontSize: '13px', fontWeight: 600, cursor: dirty ? 'pointer' : 'not-allowed',
        }}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {loading ? <p style={{ color: '#888' }}>Loading...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {Object.entries(grouped).map(([module, list]) => (
            <div key={module} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#333', textTransform: 'capitalize' }}>{module}</span>
                <span style={{ fontSize: '11px', color: '#aaa' }}>{list.filter((p) => p.is_granted).length}/{list.length}</span>
              </div>
              {list.map((perm) => (
                <label key={perm.code} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 16px', cursor: 'pointer',
                  background: changed[perm.code] !== undefined ? 'rgba(251,191,36,0.07)' : 'transparent',
                }}>
                  <input
                    type="checkbox"
                    checked={perm.is_granted}
                    onChange={() => toggle(perm.code, perm.is_granted)}
                    disabled={activeRole === 'superadmin'}
                    style={{ width: 15, height: 15, accentColor: COLORS[activeRole] }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#222', fontWeight: 500 }}>{perm.label}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#aaa' }}>{perm.code}</p>
                  </div>
                  {changed[perm.code] !== undefined && (
                    <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: changed[perm.code] ? '#dcfce7' : '#fee2e2', color: changed[perm.code] ? '#166534' : '#991b1b' }}>
                      {changed[perm.code] ? '+ granted' : '– revoked'}
                    </span>
                  )}
                </label>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
