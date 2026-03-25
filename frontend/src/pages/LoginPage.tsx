import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setUser } = useAuth()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      const data = res.data
      setUser({ id: data.id, name: data.name, email: data.email, role: data.role })
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Login failed. Please check your credentials.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={pageStyle}>
      <div style={bgDecor1} />
      <div style={bgDecor2} />
      <div style={card}>
        <div style={logoWrap}>
          <span style={{ fontSize: '3rem', lineHeight: 1 }}>🐼</span>
          <h1 style={title}>LPanda Task Manager</h1>
          <p style={subtitle}>Sign in to your workspace</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={inputStyle}
            />
          </div>
          {error && (
            <div style={errorBox}>
              <span>⚠️</span> {error}
            </div>
          )}
          <button type="submit" disabled={loading} style={submitBtn}>
            {loading ? '⏳ Signing in…' : '🚀 Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

const pageStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 60%, #a855f7 100%)',
  position: 'relative',
  overflow: 'hidden',
}

const bgDecor1: React.CSSProperties = {
  position: 'absolute',
  width: '400px',
  height: '400px',
  borderRadius: '50%',
  background: 'rgba(255,255,255,0.05)',
  top: '-100px',
  right: '-100px',
}

const bgDecor2: React.CSSProperties = {
  position: 'absolute',
  width: '300px',
  height: '300px',
  borderRadius: '50%',
  background: 'rgba(255,255,255,0.05)',
  bottom: '-80px',
  left: '-80px',
}

const card: React.CSSProperties = {
  background: '#fff',
  padding: '2.5rem',
  borderRadius: '16px',
  boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
  width: '100%',
  maxWidth: '380px',
  position: 'relative',
  zIndex: 1,
  margin: '1rem',
}

const logoWrap: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '1.75rem',
}

const title: React.CSSProperties = {
  margin: '0.5rem 0 0.25rem',
  fontSize: '1.4rem',
  fontWeight: 800,
  color: '#4c1d95',
}

const subtitle: React.CSSProperties = {
  margin: 0,
  color: '#6b7280',
  fontSize: '0.875rem',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '0.35rem',
  fontWeight: 600,
  fontSize: '0.85rem',
  color: '#374151',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.65rem 0.85rem',
  border: '1.5px solid #e5e7eb',
  borderRadius: '8px',
  fontSize: '0.9rem',
  background: '#fafafa',
}

const errorBox: React.CSSProperties = {
  background: '#fee2e2',
  color: '#b91c1c',
  padding: '0.6rem 0.85rem',
  borderRadius: '8px',
  fontSize: '0.875rem',
  display: 'flex',
  gap: '0.4rem',
  alignItems: 'center',
}

const submitBtn: React.CSSProperties = {
  padding: '0.75rem',
  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 700,
  fontSize: '0.95rem',
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(124,58,237,0.35)',
  marginTop: '0.25rem',
}
