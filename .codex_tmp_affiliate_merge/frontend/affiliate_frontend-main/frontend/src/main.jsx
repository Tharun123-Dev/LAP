import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Main stylesheet — Tailwind directives + all @layer styles
import './index.css'

// Plain CSS supplements (no Tailwind @apply/@layer)
import './styles/theme.css'
import './styles/animations.css'
import './styles/globals.css'

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
