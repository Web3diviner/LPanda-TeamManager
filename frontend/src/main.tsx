import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './responsive.css'
import App from './App.tsx'

// Keep Render backend warm (free tier spins down after 15min inactivity)
const apiBase = import.meta.env.VITE_API_URL ?? ''
fetch(`${apiBase}/health`).catch(() => {})
setInterval(() => fetch(`${apiBase}/health`).catch(() => {}), 10 * 60 * 1000)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
