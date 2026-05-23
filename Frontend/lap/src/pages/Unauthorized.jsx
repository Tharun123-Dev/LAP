import { useNavigate } from 'react-router-dom'

export default function Unauthorized() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', background: '#f9fafb' }}>
      <h2 style={{ fontSize: '48px', margin: 0 }}>🚫</h2>
      <h3 style={{ fontSize: '22px', color: '#dc2626', marginTop: '16px' }}>Access Denied</h3>
      <p style={{ color: '#888', fontSize: '14px' }}>You don't have permission to view this page.</p>
      <button
        onClick={() => navigate('/dashboard')}
        style={{ marginTop: '20px', padding: '10px 24px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}
      >
        ← Back to Dashboard
      </button>
    </div>
  )
}