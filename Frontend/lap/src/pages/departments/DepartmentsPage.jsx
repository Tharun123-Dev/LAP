// src/pages/departments/DepartmentsPage.jsx
import { useEffect, useState } from 'react'
import { listDepartmentsApi, createDepartmentApi, updateDepartmentApi, deleteDepartmentApi } from '../../api/services/departments'
import usePermission from '../../hooks/usePermission'
import toast from 'react-hot-toast'

export default function DepartmentsPage() {
  const { can } = usePermission()
  const [departments, setDepartments] = useState([])
  const [loading,     setLoading]     = useState(false)
  const [showForm,    setShowForm]    = useState(false)
  const [editTarget,  setEditTarget]  = useState(null)
  const [form,        setForm]        = useState({ name: '', description: '' })
  const [saving,      setSaving]      = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try { const r = await listDepartmentsApi(); setDepartments(r.data) }
    catch { toast.error('Failed to load departments') }
    finally { setLoading(false) }
  }

  const openAdd  = () => { setEditTarget(null); setForm({ name: '', description: '' }); setShowForm(true) }
  const openEdit = (d) => { setEditTarget(d); setForm({ name: d.name, description: d.description }); setShowForm(true) }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Department name is required'); return }
    setSaving(true)
    try {
      if (editTarget) {
        await updateDepartmentApi(editTarget.id, form)
        toast.success('Department updated!')
      } else {
        await createDepartmentApi(form)
        toast.success('Department created!')
      }
      setShowForm(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.name?.[0] || 'Failed to save')
    } finally { setSaving(false) }
  }

  const handleDelete = async (dept) => {
    if (!window.confirm(`Delete "${dept.name}"? This cannot be undone.`)) return
    try { await deleteDepartmentApi(dept.id); toast.success('Deleted'); load() }
    catch { toast.error('Cannot delete — employees are assigned to this department') }
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#111' }}>Departments</h2>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: '13px' }}>{departments.length} departments</p>
        </div>
        {can('create_department') && (
          <button onClick={openAdd} style={{ padding: '10px 20px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            + Add Department
          </button>
        )}
      </div>

      {loading ? <p style={{ color: '#888' }}>Loading...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {departments.map(dept => (
            <div key={dept.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#111' }}>{dept.name}</h3>
                  <p style={{ margin: '4px 0 0', color: '#888', fontSize: '12px' }}>{dept.description || 'No description'}</p>
                </div>
                <span style={{ background: '#f0f9ff', color: '#0369a1', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {dept.employee_count} emp
                </span>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                {can('edit_department') && (
                  <button onClick={() => openEdit(dept)} style={{ flex: 1, padding: '7px', background: '#f3f4f6', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', color: '#333' }}>
                    Edit
                  </button>
                )}
                {can('delete_department') && dept.employee_count === 0 && (
                  <button onClick={() => handleDelete(dept)} style={{ flex: 1, padding: '7px', background: '#fee2e2', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', color: '#dc2626' }}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inline modal for add/edit */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', width: '420px' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700 }}>
              {editTarget ? 'Edit Department' : 'Add Department'}
            </h3>
            <label style={lbl}>Name *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={inp2} placeholder="Engineering" />
            <label style={{ ...lbl, marginTop: '14px' }}>Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ ...inp2, height: '80px', resize: 'vertical' }} placeholder="What this department does..." />
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '9px 18px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '9px 20px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const lbl  = { fontSize: '12px', color: '#555', fontWeight: 500, display: 'block', marginBottom: '5px' }
const inp2 = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', display: 'block' }