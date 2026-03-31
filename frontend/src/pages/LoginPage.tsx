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
      if (data.token) localStorage.setItem('token', data.token)
      setUser({ id: data.id, name: data.name, email: data.email, role: data.role })
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Login failed. Please check your credentials.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={page}>
      {/* Background orbs */}
      <div style={orb1} />
      <div style={orb2} />
      <div style={orb3} />

      <div style={container}>
        {/* Left panel */}
        <div style={leftPanel}>
          <div style={brandMark}>
            <span style={{ fontSize: '3.5rem', lineHeight: 1 }}>🐼</span>
          </div>
          <h1 style={heroTitle}>LPanda<br />Task Manager</h1>
          <p style={heroSub}>Your team's productivity hub — track tasks, earn points, and collaborate smarter.</p>
          <div style={featureList}>
            {['📋 Task tracking & assignment', '🏆 Points & leaderboard', '📅 Weekly scheduling', '🎥 AI meeting summaries'].map(f => (
              <div key={f} style={featureItem}>{f}</div>
            ))}
          </div>
        </div>

        {/* Right panel — form */}
        <div style={rightPanel}>
          <div style={formCard}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👋</div>
              <h2 style={{ ...formTitle, WebkitTextFillColor: 'initial', background: 'none', color: '#1a1035' }}>Welcome back</h2>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Sign in to your workspace</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={labelStyle}>Email address</label>
                <div style={inputWrap}>
                  <span style={inputIcon}>✉️</span>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    style={inputStyle}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Password</label>
                <div style={inputWrap}>
                  <span style={inputIcon}>🔒</span>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    style={inputStyle}
                  />
                </div>
              </div>

              {error && (
                <div style={errorBox}>
                  <span style={{ fontSize: '1rem' }}>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={loading} style={submitBtn}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                    <span style={{ animation: 'pulse 1s infinite' }}>⏳</span> Signing in…
                  </span>
                ) : 'Sign In →'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.78rem', color: '#9ca3af' }}>
              Contact your admin to get access
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const page: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #0f0720 0%, #1e0a4e 40%, #3b0f8c 70%, #6d28d9 100%)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  position: 'relative', overflow: 'hidden', padding: '1rem',
}
const orb1: React.CSSProperties = {
  position: 'absolute', width: '500px', height: '500px', borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)',
  top: '-150px', right: '-100px', pointerEvents: 'none',
}
const orb2: React.CSSProperties = {
  position: 'absolute', width: '400px', height: '400px', borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)',
  bottom: '-100px', left: '-100px', pointerEvents: 'none',
}
const orb3: React.CSSProperties = {
  position: 'absolute', width: '200px', height: '200px', borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)',
  top: '40%', left: '30%', pointerEvents: 'none',
}
const container: React.CSSProperties = {
  display: 'flex', gap: '3rem', alignItems: 'center', maxWidth: '900px',
  width: '100%', position: 'relative', zIndex: 1, flexWrap: 'wrap', justifyContent: 'center',
}
const leftPanel: React.CSSProperties = {
  flex: '1 1 320px', color: '#fff', maxWidth: '380px',
}
const brandMark: React.CSSProperties = {
  width: '72px', height: '72px', borderRadius: '20px',
  background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.2)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  marginBottom: '1.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
}
const heroTitle: React.CSSProperties = {
  fontSize: '2.8rem', fontWeight: 900, lineHeight: 1.1,
  margin: '0 0 1rem', letterSpacing: '-1px',
  background: 'linear-gradient(135deg, #fff 0%, #c4b5fd 100%)',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
}
const heroSub: React.CSSProperties = {
  fontSize: '1rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: '0 0 1.5rem',
}
const featureList: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.6rem' }
const featureItem: React.CSSProperties = {
  fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)',
  background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)',
  border: '1px solid rgba(255,255,255,0.12)',
  padding: '0.5rem 0.85rem', borderRadius: '8px',
}
const rightPanel: React.CSSProperties = { flex: '1 1 340px', maxWidth: '400px' }
const formCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)',
  borderRadius: '24px', padding: '2.5rem',
  boxShadow: '0 24px 64px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)',
}
const formTitle: React.CSSProperties = {
  fontSize: '1.6rem', fontWeight: 800, margin: '0 0 0.25rem', letterSpacing: '-0.5px',
}
const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.82rem', color: '#374151',
}
const inputWrap: React.CSSProperties = { position: 'relative' }
const inputIcon: React.CSSProperties = {
  position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)',
  fontSize: '0.9rem', pointerEvents: 'none',
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.75rem 0.85rem 0.75rem 2.5rem',
  border: '1.5px solid #e5e7eb', borderRadius: '10px',
  fontSize: '0.9rem', background: '#fafafa', color: '#1a1035',
  boxSizing: 'border-box',
}
const errorBox: React.CSSProperties = {
  background: '#fef2f2', color: '#b91c1c', padding: '0.7rem 1rem',
  borderRadius: '10px', fontSize: '0.875rem', display: 'flex', gap: '0.5rem', alignItems: 'center',
  border: '1px solid #fecaca',
}
const submitBtn: React.CSSProperties = {
  padding: '0.85rem', width: '100%',
  background: 'linear-gradient(135deg, #5b21b6, #7c3aed, #a855f7)',
  color: '#fff', border: 'none', borderRadius: '10px',
  fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
  boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
  letterSpacing: '0.3px',
}
