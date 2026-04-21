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
              <NavLink to={user?.role === 'ambassador' ? '/ambassador' : '/dashboard'} style={linkStyle}>📋 Dashboard</NavLink>
              <NavLink to={user?.role === 'ambassador' ? '/ambassador-leaderboard' : '/leaderboard'} style={linkStyle}>🏆 Leaderboard</NavLink>
              <NavLink to={user?.role === 'ambassador' ? '/ambassador-recap' : '/recap'} style={linkStyle}>📊 Recap</NavLink>
              <NavLink to={user?.role === 'ambassador' ? '/ambassador-schedule' : '/schedule'} style={linkStyle}>📅 Schedule</NavLink>
              <NavLink to="/meeting" style={linkStyle}>🎥 Meeting</NavLink>
              <NavLink to="/profile" style={linkStyle}>👤 Profile</NavLink>
              {user?.role === 'admin' && <NavLink to="/users" style={linkStyle}>⚙️ Users</NavLink>}
            </div>
          )}
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {user && <span style={userBadge}>{user.role === 'admin' ? '👑' : user.role === 'ambassador' ? '🤝' : '👤'} {user.name}</span>}
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
            <NavLink to={user?.role === 'ambassador' ? '/ambassador' : '/dashboard'} style={mobileLinkStyle} onClick={() => setMenuOpen(false)}>📋 Dashboard</NavLink>
            <NavLink to={user?.role === 'ambassador' ? '/ambassador-leaderboard' : '/leaderboard'} style={mobileLinkStyle} onClick={() => setMenuOpen(false)}>🏆 Leaderboard</NavLink>
            <NavLink to={user?.role === 'ambassador' ? '/ambassador-recap' : '/recap'} style={mobileLinkStyle} onClick={() => setMenuOpen(false)}>📊 Recap</NavLink>
            <NavLink to={user?.role === 'ambassador' ? '/ambassador-schedule' : '/schedule'} style={mobileLinkStyle} onClick={() => setMenuOpen(false)}>📅 Schedule</NavLink>
            <NavLink to="/meeting" style={mobileLinkStyle} onClick={() => setMenuOpen(false)}>🎥 Meeting</NavLink>
            <NavLink to="/profile" style={mobileLinkStyle} onClick={() => setMenuOpen(false)}>👤 Profile</NavLink>
            {user?.role === 'admin' && (
              <NavLink to="/users" style={mobileLinkStyle} onClick={() => setMenuOpen(false)}>⚙️ Users</NavLink>
            )}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '0.75rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {user && <span style={{ ...userBadge, fontSize: '0.8rem' }}>{user.role === 'admin' ? '👑' : user.role === 'ambassador' ? '🤝' : '👤'} {user.name}</span>}
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
  background: 'linear-gradient(135deg, #0f0720 0%, #2d0f6b 50%, #5b21b6 100%)',
  boxShadow: '0 8px 32px rgba(91,33,182,0.25)',
  position: 'sticky', top: 0, zIndex: 100,
  borderBottom: '2px solid rgba(255,255,255,0.1)',
}
const navInner: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '1.5rem',
  padding: '0 1.5rem', maxWidth: '1400px', margin: '0 auto',
}
const brandWrap: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '0.6rem', marginRight: '1.5rem', flexShrink: 0,
}
const brandText: React.CSSProperties = {
  fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', whiteSpace: 'nowrap',
}
const linksStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1,
}
const linkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
  color: isActive ? '#fff' : 'rgba(255,255,255,0.8)',
  textDecoration: 'none', fontWeight: isActive ? 700 : 500, fontSize: '0.9rem',
  padding: '0.5rem 0.9rem', borderRadius: '8px',
  background: isActive ? 'rgba(255,255,255,0.18)' : 'transparent',
  transition: 'all 0.2s ease', whiteSpace: 'nowrap',
  border: isActive ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
})
const mobileLinkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
  color: '#fff', textDecoration: 'none', fontWeight: isActive ? 700 : 500,
  fontSize: '1rem', padding: '0.75rem 0.75rem', borderRadius: '8px',
  background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent', display: 'block',
  transition: 'all 0.2s ease',
})
const mobileMenuStyle: React.CSSProperties = {
  padding: '0.85rem 1.5rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem',
  borderTop: '1px solid rgba(255,255,255,0.15)', background: 'rgba(76,29,149,0.98)',
}
const userBadge: React.CSSProperties = {
  background: 'rgba(255,255,255,0.18)', color: '#fff', padding: '0.35rem 0.85rem',
  borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap',
  border: '1px solid rgba(255,255,255,0.2)',
}
const logoutBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
  color: '#fff', padding: '0.4rem 1rem', borderRadius: '8px',
  fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap',
  transition: 'all 0.2s ease',
}
const hamburgerStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
  color: '#fff', width: '40px', height: '40px', borderRadius: '8px', fontSize: '1.1rem',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  transition: 'all 0.2s ease',
}
