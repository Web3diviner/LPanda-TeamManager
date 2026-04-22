import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { useAmbassadorAdminAuth } from '../context/AmbassadorAdminAuthContext'

export default function AmbassadorAdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser } = useAmbassadorAdminAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      const data = res.data
      
      // Check if user has ambassador_admin role
      if (data.role !== 'ambassador_admin') {
        setError('Access denied: not an ambassador admin account')
        setLoading(false)
        return
      }
      
      // Successful authentication - store token and set user context
      localStorage.setItem('ambassador_admin_token', data.token)
      setUser({ id: data.id, name: data.name, email: data.email, role: 'ambassador_admin' })
      
      // Navigate to dashboard
      navigate('/ambassador-admin/dashboard')
      setLoading(false)
    } catch (err: any) {
      // Extract error message from API response or use fallback
      const errorMessage = err.response?.data?.error || 'Invalid email or password'
      setError(errorMessage)
      setLoading(false)
    }
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{ fontSize: '3rem' }}>🛡️</span>
          <h1 style={{ margin: '0.5rem 0 0.25rem', fontSize: '1.6rem', fontWeight: 900, color: '#1e3a5f' }}>
            Ambassador Admin Portal
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
            Restricted access — ambassador admins only
          </p>
        </div>

        {error && (
          <div style={errorStyle}>{error}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={inputStyle}
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={inputStyle}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #0c1a3a 0%, #1a3a6b 50%, #1e5fa8 100%)',
  padding: '1rem',
}
const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: '16px',
  padding: '2.5rem',
  width: '100%',
  maxWidth: '420px',
  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
}
const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '0.4rem',
  fontWeight: 600,
  fontSize: '0.9rem',
  color: '#374151',
}
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  border: '1.5px solid #d1d5db',
  fontSize: '1rem',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
}
const btnStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #1a3a6b, #1e5fa8)',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '0.85rem',
  fontSize: '1rem',
  fontWeight: 700,
  cursor: 'pointer',
  marginTop: '0.5rem',
  transition: 'opacity 0.2s',
}
const errorStyle: React.CSSProperties = {
  background: '#fef2f2',
  border: '1px solid #fca5a5',
  color: '#dc2626',
  borderRadius: '8px',
  padding: '0.75rem 1rem',
  fontSize: '0.9rem',
  marginBottom: '0.5rem',
}
