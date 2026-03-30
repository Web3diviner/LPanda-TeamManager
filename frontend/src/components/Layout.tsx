import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useIsMobile } from '../hooks/useIsMobile'

export default function Layout() {
  const { logout, user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const isMobile = useIsMobile()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={navStyle}>
        <div style={{ ...navInner, height: isMobile ? '56px' : '60px' }}>
          <div style={brandWrap}>
            <span style={{ fontSize: '1.6rem', lineHeight: '1' }}>🐼</span>
            <span style={{ ...brandText, fontSize: isMobile ? '0.95rem' : '1.05rem' }}>
              {isMobile ? 'LPanda' : 'LPanda Task Manager'}
            </span>
          </div>
          {!isMobile && (
            <div style={linksStyle}>
              <NavLink to="/dashboard" style={linkStyle}>📋 Dashboard</NavLink>
              <NavLink to="/leaderboard" style={linkStyle}>🏆 Leaderboard</NavLink>
              <NavLink to="/recap" style={linkStyle}>📊 Recap</NavLink>
              <NavLink to="/schedule" style={linkStyle}>📅 Schedule</NavLink>
              <NavLink to="/meeting" style={linkStyle}>🎥 Meeting</NavLink>
              <NavLink to="/profile" style={linkStyle}>👤 Profile</NavLink>
              {user?.role === 'admin' && <NavLink to="/users" style={linkStyle}>⚙️ Users</NavLink>}
            </div>
          )}
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {user && <span style={userBadge}>{user.role === 'admin' ? '👑' : '👤'} {user.name}</span>}
              <button onClick={logout} style={logoutBtn}>Logout</button>
            </div>
          )}
          {isMobile && (
            <button onClick={() => setMenuOpen(o => !o)} style={{ ...hamburgerStyle, marginLeft: 'auto' }} aria-label="Toggle menu">
              {menuOpen ? '✕' : '☰'}
            </button>
          )}
        </div>
        {isMobile && menuOpen && (
          <div style={mobileMenuStyle}>
            <NavLink to="/dashboard" style={mobileLinkStyle} onClick={() => setMenuOpen(false)}>📋 Dashboard</NavLink>
            <NavLink to="/leaderboard" style={mobileLinkStyle} onClick={() => setMenuOpen(false)}>🏆 Leaderboard</NavLink>
            <NavLink to="/recap" style={mobileLinkStyle} onClick={() => setMenuOpen(false)}>📊 Recap</NavLink>
            <NavLink to="/schedule" style={mobileLinkStyle} onClick={() => setMenuOpen(false)}>📅 Schedule</NavLink>
            <NavLink to="/meeting" style={mobileLinkStyle} onClick={() => setMenuOpen(false)}>🎥 Meeting</NavLink>
            <NavLink to="/profile" style={mobileLinkStyle} onClick={() => setMenuOpen(false)}>👤 Profile</NavLink>
            {user?.role === 'admin' && (
              <NavLink to="/users" style={mobileLinkStyle} onClick={() => setMenuOpen(false)}>⚙️ Users</NavLink>
            )}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '0.75rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {user && <span style={{ ...userBadge, fontSize: '0.8rem' }}>{user.role === 'admin' ? '👑' : '👤'} {user.name}</span>}
              <button onClick={logout} style={logoutBtn}>Logout</button>
            </div>
          </div>
        )}
      </nav>
      <main style={{ padding: isMobile ? '1rem' : '2rem', flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        <Outlet />
      </main>
    </div>
  )
}

const navStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #a855f7 100%)',
  boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
  position: 'sticky', top: 0, zIndex: 100,
}
const navInner: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '1rem',
  padding: '0 1.5rem', maxWidth: '1200px', margin: '0 auto',
}
const brandWrap: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '1rem', flexShrink: 0,
}
const brandText: React.CSSProperties = {
  fontWeight: 800, color: '#fff', letterSpacing: '-0.3px', whiteSpace: 'nowrap',
}
const linksStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '0.25rem', flex: 1,
}
const linkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
  color: isActive ? '#fff' : 'rgba(255,255,255,0.75)',
  textDecoration: 'none', fontWeight: isActive ? 600 : 400, fontSize: '0.875rem',
  padding: '0.4rem 0.75rem', borderRadius: '6px',
  background: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
  transition: 'all 0.15s ease', whiteSpace: 'nowrap',
})
const mobileLinkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
  color: '#fff', textDecoration: 'none', fontWeight: isActive ? 700 : 400,
  fontSize: '1rem', padding: '0.65rem 0.5rem', borderRadius: '8px',
  background: isActive ? 'rgba(255,255,255,0.2)' : 'transparent', display: 'block',
})
const mobileMenuStyle: React.CSSProperties = {
  padding: '0.75rem 1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem',
  borderTop: '1px solid rgba(255,255,255,0.15)', background: 'rgba(76,29,149,0.97)',
}
const userBadge: React.CSSProperties = {
  background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '0.3rem 0.75rem',
  borderRadius: '20px', fontSize: '0.8rem', fontWeight: 500, whiteSpace: 'nowrap',
}
const logoutBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
  color: '#fff', padding: '0.35rem 0.9rem', borderRadius: '6px',
  fontWeight: 500, fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap',
}
const hamburgerStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
  color: '#fff', width: '38px', height: '38px', borderRadius: '8px', fontSize: '1.1rem',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
}
