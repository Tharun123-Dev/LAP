// src/pages/settings/SystemSettings.jsx
import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import systemSettingsService from '../../api/services/systemSettings'

const CATEGORY_LABELS = {
  attendance: { label: 'Attendance Settings', icon: '📅' },
  leave:      { label: 'Leave Policies',       icon: '🌴' },
  payroll:    { label: 'Payroll Settings',     icon: '💰' },
  general:    { label: 'General Settings',     icon: '⚙️' },
}

export default function SystemSettings() {
  const role = useSelector(s => s.auth.role)
  const canEdit = ['superadmin', 'admin', 'hr'].includes(role)

  const [settings, setSettings]   = useState({})   // { category: [settings] }
  const [edits, setEdits]         = useState({})    // { key: newValue }
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [error, setError]         = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await systemSettingsService.getAll()
        setSettings(res.data)
      } catch { setError('Failed to load settings') }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const handleChange = (key, value) => {
    setEdits(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    if (!canEdit) return
    setSaving(true)
    setError('')
    try {
      await systemSettingsService.bulkUpdate(edits)
      // Refresh from server
      const res = await systemSettingsService.getAll()
      setSettings(res.data)
      setEdits({})
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const getValue = (setting) =>
    edits[setting.key] !== undefined ? edits[setting.key] : setting.value

  const hasChanges = Object.keys(edits).length > 0

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '14px' }}>
      Loading settings...
    </div>
  )

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#111' }}>
            System Settings
          </h2>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: '13px' }}>
            {canEdit ? 'Configure company-wide policies and defaults' : 'View system configuration (read-only)'}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            style={{
              padding: '9px 20px', borderRadius: '8px', border: 'none',
              background: hasChanges ? '#1a1a2e' : '#e5e7eb',
              color: hasChanges ? '#fff' : '#9ca3af',
              cursor: hasChanges ? 'pointer' : 'not-allowed',
              fontWeight: 600, fontSize: '14px',
            }}
          >
            {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
          </button>
        )}
      </div>

      {error && (
        <div style={{
          background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px',
          padding: '12px 16px', marginBottom: '16px', color: '#dc2626', fontSize: '13px',
        }}>
          {error}
        </div>
      )}

      {saved && (
        <div style={{
          background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px',
          padding: '12px 16px', marginBottom: '16px', color: '#16a34a', fontSize: '13px',
        }}>
          ✓ Settings saved successfully!
        </div>
      )}

      {/* Settings by Category */}
      {Object.entries(CATEGORY_LABELS).map(([cat, meta]) => {
        const catSettings = settings[cat] || []
        if (!catSettings.length) return null
        return (
          <div key={cat} style={{
            background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb',
            marginBottom: '16px', overflow: 'hidden',
          }}>
            {/* Category Header */}
            <div style={{
              padding: '14px 20px', background: '#f9fafb',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span style={{ fontSize: '18px' }}>{meta.icon}</span>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#111' }}>
                {meta.label}
              </h3>
            </div>

            {/* Settings Rows */}
            <div>
              {catSettings.map((setting, idx) => (
                <div key={setting.key} style={{
                  padding: '14px 20px',
                  borderBottom: idx < catSettings.length - 1 ? '1px solid #f3f4f6' : 'none',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px',
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#111' }}>
                      {setting.label}
                    </p>
                    {setting.description && (
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9ca3af' }}>
                        {setting.description}
                      </p>
                    )}
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    {/* Boolean toggle */}
                    {(setting.value === 'true' || setting.value === 'false') && canEdit ? (
                      <button
                        onClick={() => handleChange(setting.key, getValue(setting) === 'true' ? 'false' : 'true')}
                        style={{
                          width: '52px', height: '28px', borderRadius: '14px', border: 'none',
                          cursor: 'pointer', transition: 'background 0.2s', position: 'relative',
                          background: getValue(setting) === 'true' ? '#22c55e' : '#d1d5db',
                        }}
                      >
                        <span style={{
                          position: 'absolute', top: '3px',
                          left: getValue(setting) === 'true' ? '26px' : '3px',
                          width: '22px', height: '22px', borderRadius: '50%',
                          background: '#fff', transition: 'left 0.2s', display: 'block',
                        }} />
                      </button>
                    ) : canEdit ? (
                      /* Number or text input */
                      <input
                        type={isNaN(Number(setting.value)) ? 'text' : 'number'}
                        value={getValue(setting)}
                        onChange={e => handleChange(setting.key, e.target.value)}
                        style={{
                          width: '120px', padding: '6px 10px', borderRadius: '7px',
                          border: `1px solid ${edits[setting.key] !== undefined ? '#818cf8' : '#e5e7eb'}`,
                          fontSize: '14px', textAlign: 'right', outline: 'none',
                          background: edits[setting.key] !== undefined ? '#f0f4ff' : '#fff',
                        }}
                      />
                    ) : (
                      /* Read-only */
                      <span style={{
                        padding: '4px 12px', borderRadius: '6px', background: '#f3f4f6',
                        fontSize: '14px', color: '#374151', fontWeight: 600,
                      }}>
                        {setting.value === 'true' ? '✓ Yes' : setting.value === 'false' ? '✗ No' : setting.value}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {!canEdit && (
        <p style={{
          textAlign: 'center', color: '#9ca3af', fontSize: '13px',
          padding: '16px', background: '#f9fafb', borderRadius: '8px',
          border: '1px solid #e5e7eb',
        }}>
          🔒 Only Admin and HR can modify system settings.
        </p>
      )}
    </div>
  )
}