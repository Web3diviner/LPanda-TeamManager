import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAmbassadorAdminAuth } from '../context/AmbassadorAdminAuthContext'
import { useIsMobile } from '../hooks/useIsMobile'

export default function AmbassadorAdminLayout() {
  const { logout, user } = useAmbassadorAdminAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const isMobile = useIsMobile()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={navStyle}>
        <div style={{ ...navInner, height: isMobile ? '56px' : '60px' }}>
          <div style={brandWrap}>
            <span style={{ fontSize: '1.6rem', lineHeight: '1' }}>🤝</span>
            <span style={{ ...brandText, fontSize: isMobile ? '0.9rem' : '1rem' }}>
              {isMobile ? 'Amb. Admin' : 'Ambassador Admin'}
            </span>
          </div>
          {!isMobile && (
            <div style={linksStyle}>
              <NavLink to="/ambassador-admin/dashboard" style={linkStyle}>📊 Dashboard</NavLink>
              <NavLink to="/ambassador-admin/ambassadors" style={linkStyle}>🤝 Ambassadors</NavLink>
              <NavLink to="/ambassador-admin/tasks" style={linkStyle}>📋 Tasks</NavLink>
              <NavLink to="/ambassador-admin/leaderboard" style={linkStyle}>🏆 Leaderboard</NavLink>
              <NavLink to="/ambassador-admin/schedule" style={linkStyle}>📅 Schedule</NavLink>
            </div>
          )}
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {user && <span style={userBadge}>🛡️ {user.name}</span>}
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
            <NavLink to="/ambassador-admin/dashboard" style={mobileLinkStyle} onClick={() => setMenuOpen(false)}>📊 Dashboard</NavLink>
            <NavLink to="/ambassador-admin/ambassadors" style={mobileLinkStyle} onClick={() => setMenuOpen(false)}>🤝 Ambassadors</NavLink>
            <NavLink to="/ambassador-admin/tasks" style={mobileLinkStyle} onClick={() => setMenuOpen(false)}>📋 Tasks</NavLink>
            <NavLink to="/ambassador-admin/leaderboard" style={mobileLinkStyle} onClick={() => setMenuOpen(false)}>🏆 Leaderboard</NavLink>
            <NavLink to="/ambassador-admin/schedule" style={mobileLinkStyle} onClick={() => setMenuOpen(false)}>📅 Schedule</NavLink>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '0.75rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {user && <span style={{ ...userBadge, fontSize: '0.8rem' }}>🛡️ {user.name}</span>}
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
  background: 'linear-gradient(135deg, #0c1a3a 0%, #1a3a6b 50%, #1e5fa8 100%)',
  boxShadow: '0 8px 32px rgba(30,95,168,0.25)',
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
  borderTop: '1px solid rgba(255,255,255,0.15)', background: 'rgba(26,58,107,0.98)',
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
