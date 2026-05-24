// src/pages/settings/ProfileSettings.jsx
import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { setCredentials } from '../../store/authSlice'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function ProfileSettings() {
  const user     = useSelector(s => s.auth)
  const dispatch = useDispatch()
  const [tab, setTab] = useState('profile')
  const [form, setForm] = useState({ first_name:'', last_name:'', email:'', phone:'', address:'' })
  const [pwd,  setPwd]  = useState({ old_password:'', new_password:'', confirm:'' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/users/me/').then(r => {
      const d = r.data
      setForm({
        first_name: d.first_name || '',
        last_name:  d.last_name  || '',
        email:      d.email      || '',
        phone:      d.phone      || '',
        address:    d.address    || '',
      })
    }).catch(() => {})
  }, [])

  const set  = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const setP = k => e => setPwd(p => ({ ...p, [k]: e.target.value }))

  const saveProfile = async () => {
    setSaving(true)
    try {
      const r = await api.patch('/users/profile/', form)
      toast.success('Profile updated!')
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to update')
    } finally { setSaving(false) }
  }

  const changePassword = async () => {
    if (!pwd.old_password || !pwd.new_password) { toast.error('Fill all fields'); return }
    if (pwd.new_password !== pwd.confirm) { toast.error('Passwords do not match'); return }
    if (pwd.new_password.length < 8) { toast.error('Min 8 characters'); return }
    setSaving(true)
    try {
      await api.post('/users/change-password/', { old_password: pwd.old_password, new_password: pwd.new_password })
      toast.success('Password changed!')
      setPwd({ old_password:'', new_password:'', confirm:'' })
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed')
    } finally { setSaving(false) }
  }

  const TABS = [{ key:'profile', label:'👤 Profile' }, { key:'password', label:'🔐 Password' }]

  return (
    <div style={{ fontFamily:'Inter,sans-serif', maxWidth:'560px' }}>
      <h2 style={{ margin:'0 0 20px', fontSize:'20px', fontWeight:700, color:'#111' }}>Settings</h2>

      <div style={{ display:'flex', gap:'4px', background:'#f3f4f6', borderRadius:'10px', padding:'4px', marginBottom:'24px', width:'fit-content' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding:'8px 18px', borderRadius:'7px', border:'none',
            background: tab===t.key ? '#fff' : 'transparent',
            color: tab===t.key ? '#1a1a2e' : '#888',
            fontWeight: tab===t.key ? 600 : 400,
            fontSize:'13px', cursor:'pointer',
            boxShadow: tab===t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ background:'#fff', borderRadius:'14px', border:'1px solid #e5e7eb', padding:'24px' }}>

        {tab === 'profile' && (
          <>
            {/* Avatar */}
            <div style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'24px' }}>
              <div style={{ width:'60px', height:'60px', borderRadius:'50%', background:'#1a1a2e', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', fontWeight:700, flexShrink:0 }}>
                {form.first_name?.[0]}{form.last_name?.[0]}
              </div>
              <div>
                <p style={{ margin:0, fontWeight:700, color:'#111', fontSize:'16px' }}>{form.first_name} {form.last_name}</p>
                <p style={{ margin:'2px 0 0', fontSize:'12px', color:'#888', textTransform:'capitalize' }}>{user.role} · {user.employeeType}</p>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'14px' }}>
              {[
                { label:'First Name', key:'first_name' },
                { label:'Last Name',  key:'last_name' },
                { label:'Email',      key:'email',   type:'email' },
                { label:'Phone',      key:'phone' },
              ].map(f => (
                <div key={f.key}>
                  <label style={lbl}>{f.label}</label>
                  <input value={form[f.key]} onChange={set(f.key)} type={f.type||'text'} style={inp} />
                </div>
              ))}
            </div>

            <div style={{ marginTop:'14px' }}>
              <label style={lbl}>Address</label>
              <textarea value={form.address} onChange={set('address')} style={{ ...inp, height:'70px', resize:'vertical' }} />
            </div>

            <button onClick={saveProfile} disabled={saving} style={btnPrimary}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </>
        )}

        {tab === 'password' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <p style={{ margin:'0 0 8px', fontSize:'13px', color:'#888' }}>
              Use a strong password of at least 8 characters.
            </p>
            {[
              { label:'Current Password', key:'old_password' },
              { label:'New Password',     key:'new_password' },
              { label:'Confirm New Password', key:'confirm' },
            ].map(f => (
              <div key={f.key}>
                <label style={lbl}>{f.label}</label>
                <input type="password" value={pwd[f.key]} onChange={setP(f.key)} style={inp}
                  onKeyDown={e => e.key === 'Enter' && changePassword()}
                />
              </div>
            ))}
            {pwd.new_password && pwd.confirm && pwd.new_password !== pwd.confirm && (
              <p style={{ margin:0, fontSize:'12px', color:'#dc2626' }}>❌ Passwords do not match</p>
            )}
            <button onClick={changePassword} disabled={saving} style={btnPrimary}>
              {saving ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const lbl      = { fontSize:'12px', color:'#555', fontWeight:500, display:'block', marginBottom:'5px' }
const inp      = { width:'100%', padding:'9px 12px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'13px', outline:'none', boxSizing:'border-box', fontFamily:'Inter,sans-serif', display:'block' }
const btnPrimary = { marginTop:'20px', padding:'10px 24px', background:'#1a1a2e', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:600, cursor:'pointer' }