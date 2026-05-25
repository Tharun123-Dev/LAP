import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import systemSettingsService from '../../api/services/systemSettings'

const CATEGORY_LABELS = {
  attendance: { label: 'Attendance Settings', icon: '📅' },
  leave: { label: 'Leave Policies', icon: '🌴' },
  payroll: { label: 'Payroll Settings', icon: '💰' },
  general: { label: 'General Settings', icon: '⚙️' },
}

export default function SystemSettings() {
  const role = useSelector(s => s.auth.role)
  const canEdit = ['superadmin', 'admin', 'hr'].includes(role)

  const [settings, setSettings] = useState({})
  const [edits, setEdits] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await systemSettingsService.getAll()
        setSettings(res.data)
      } catch {
        setError('Failed to load settings')
      } finally {
        setLoading(false)
      }
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

  const getValue = setting =>
    edits[setting.key] !== undefined ? edits[setting.key] : setting.value

  const hasChanges = Object.keys(edits).length > 0

  const renderSetting = setting => {
    const value = getValue(setting)
    const isChanged = edits[setting.key] !== undefined

    return (
      <div
        key={setting.key}
        style={{
          padding: '16px',
          borderRadius: '10px',
          marginBottom: '10px',
          background: isChanged ? '#fffbeb' : '#fff',
          border: `1px solid ${isChanged ? '#fde68a' : '#e5e7eb'}`,
          transition: 'all 0.2s',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>{setting.label}</label>
              {isChanged && (
                <span
                  style={{
                    fontSize: '10px',
                    background: '#fde68a',
                    color: '#92400e',
                    padding: '2px 8px',
                    borderRadius: '20px',
                    fontWeight: 700,
                  }}
                >
                  MODIFIED
                </span>
              )}
            </div>

            {setting.description && (
              <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#888', lineHeight: 1.5 }}>
                {setting.description}
              </p>
            )}

            <div style={{ fontSize: '11px', color: '#bbb' }}>
              Key: <code style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: '4px' }}>{setting.key}</code>{' '}
              · Type: {setting.value_type}
            </div>
          </div>

          <div style={{ minWidth: '180px' }}>
            {setting.value_type === 'boolean' ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                {['true', 'false'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => canEdit && handleChange(setting.key, opt)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      border: '1px solid',
                      cursor: canEdit ? 'pointer' : 'not-allowed',
                      fontWeight: 600,
                      fontSize: '13px',
                      background: value === opt ? (opt === 'true' ? '#d1fae5' : '#fee2e2') : '#f9fafb',
                      borderColor: value === opt ? (opt === 'true' ? '#6ee7b7' : '#fca5a5') : '#e5e7eb',
                      color: value === opt ? (opt === 'true' ? '#065f46' : '#991b1b') : '#888',
                    }}
                    disabled={!canEdit}
                    type="button"
                  >
                    {opt === 'true' ? '✓ Yes' : '✗ No'}
                  </button>
                ))}
              </div>
            ) : setting.value_type === 'json' ? (
              <textarea
                value={value}
                rows={2}
                onChange={e => canEdit && handleChange(setting.key, e.target.value)}
                disabled={!canEdit}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  background: canEdit ? '#fff' : '#f9fafb',
                }}
              />
            ) : (
              <input
                value={value}
                type={setting.value_type === 'integer' || setting.value_type === 'decimal' ? 'number' : 'text'}
                onChange={e => canEdit && handleChange(setting.key, e.target.value)}
                disabled={!canEdit}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  background: canEdit ? '#fff' : '#f9fafb',
                }}
              />
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '14px' }}>
        Loading settings...
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '24px 16px' }}>
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
              padding: '9px 20px',
              borderRadius: '8px',
              border: 'none',
              background: hasChanges ? '#1a1a2e' : '#e5e7eb',
              color: hasChanges ? '#fff' : '#9ca3af',
              cursor: hasChanges ? 'pointer' : 'not-allowed',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
          </button>
        )}
      </div>

      {error && (
        <div
          style={{
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',
            color: '#dc2626',
            fontSize: '13px',
          }}
        >
          {error}
        </div>
      )}

      {saved && (
        <div
          style={{
            background: '#dcfce7',
            border: '1px solid #86efac',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',
            color: '#16a34a',
            fontSize: '13px',
          }}
        >
          ✓ Settings saved successfully!
        </div>
      )}

      {Object.entries(CATEGORY_LABELS).map(([cat, meta]) => {
        const catSettings = settings[cat] || []
        if (!catSettings.length) return null

        return (
          <div
            key={cat}
            style={{
              background: '#fff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              marginBottom: '16px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '14px 20px',
                background: '#f9fafb',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '18px' }}>{meta.icon}</span>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#111' }}>
                {meta.label}
              </h3>
            </div>

            <div style={{ padding: '14px 14px 4px' }}>
              {catSettings.map(setting => renderSetting(setting))}
            </div>
          </div>
        )
      })}

      {!canEdit && (
        <p
          style={{
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '13px',
            padding: '16px',
            background: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
          }}
        >
          🔒 Only Admin and HR can modify system settings.
        </p>
      )}
    </div>
  )
}