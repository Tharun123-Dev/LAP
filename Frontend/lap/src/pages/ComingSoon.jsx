// src/pages/ComingSoon.jsx
export default function ComingSoon({ title }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', fontFamily: 'Inter, sans-serif',
    }}>
      <p style={{ fontSize: '48px', margin: 0 }}>🚧</p>
      <h3 style={{ color: '#333', marginTop: '16px' }}>{title || 'Coming Soon'}</h3>
      <p style={{ color: '#aaa', fontSize: '14px' }}>This module will be built in the next phase.</p>
    </div>
  )
}