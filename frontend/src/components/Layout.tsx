import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { logout, user } = useAuth()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={navStyle}>
        <div style={navInner}>
          <div style={brandWrap}>
            <span style={panda}>🐼</span>
            <span style={brandText}>LPanda Task Manager</span>
          </div>
          <div style={links}>
            <NavLink to="/dashboard" style={linkStyle}>📋 Dashboard</NavLink>
            <NavLink to="/leaderboard" style={linkStyle}>🏆 Leaderboard</NavLink>
            <NavLink to="/recap" style={linkStyle}>📊 Recap</NavLink>
            <NavLink to="/profile" style={linkStyle}>👤 Profile</NavLink>
            {user?.role === 'admin' && (
              <NavLink to="/users" style={linkStyle}>⚙️ Users</NavLink>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {user && (
              <span style={userBadge}>
                {user.role === 'admin' ? '👑' : '👤'} {user.name}
              </span>
            )}
            <button onClick={logout} style={logoutBtn}>Logout</button>
          </div>
        </div>
      </nav>
      <main style={{ padding: '2rem', flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        <Outlet />
      </main>
    </div>
  )
}

const navStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #a855f7 100%)',
  boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
  position: 'sticky',
  top: 0,
  zIndex: 100,
}

const navInner: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  padding: '0 1.5rem',
  maxWidth: '1200px',
  margin: '0 auto',
  height: '60px',
}

const brandWrap: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginRight: '1.5rem',
  flexShrink: 0,
}

const panda: React.CSSProperties = {
  fontSize: '1.6rem',
  lineHeight: 1,
}

const brandText: React.CSSProperties = {
  fontWeight: 800,
  fontSize: '1.05rem',
  color: '#fff',
  letterSpacing: '-0.3px',
  whiteSpace: 'nowrap',
}

const links: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem',
  flex: 1,
}

const linkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
  color: isActive ? '#fff' : 'rgba(255,255,255,0.75)',
  textDecoration: 'none',
  fontWeight: isActive ? 600 : 400,
  fontSize: '0.875rem',
  padding: '0.4rem 0.75rem',
  borderRadius: '6px',
  background: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
  transition: 'all 0.15s ease',
  whiteSpace: 'nowrap',
})

const userBadge: React.CSSProperties = {
  background: 'rgba(255,255,255,0.15)',
  color: '#fff',
  padding: '0.3rem 0.75rem',
  borderRadius: '20px',
  fontSize: '0.8rem',
  fontWeight: 500,
  whiteSpace: 'nowrap',
}

const logoutBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.15)',
  border: '1px solid rgba(255,255,255,0.3)',
  color: '#fff',
  padding: '0.35rem 0.9rem',
  borderRadius: '6px',
  fontWeight: 500,
  fontSize: '0.85rem',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}
